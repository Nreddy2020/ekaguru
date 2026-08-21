# Phase 3 — Parent Experience & Observability Architectural Specification v1

This document defines the frozen architectural specification and implementation plan for **EKAGURU Phase 3**, establishing a secure parent/guardian control and observation layer.

---

## 1. Security & Resource Authorization Model

To prevent Direct Object Reference and session traversal, resource authorization is decoupled from generic JWT authentication:

```
[JWT Authentication Guard] 
       │  (Resolves User Principal: userId, role)
       ▼
[Resource Authorization Interceptor]
       │  (Inspects parameters: sessionId, stepId, assessmentInstanceId, learnerId)
       ▼
[Resolve Learner ID] 
       ├── sessionId ──────► query session.learnerId
       ├── stepId ─────────► query step.session.learnerId
       ├── assessmentId ───► query assessmentInstance.sessionStep.session.learnerId
       └── learnerId ──────► target learnerId
       │
       ▼
[Verify Ownership]
       ├── PARENT ──► check legacyChild.parentId === user.userId
       └── STUDENT ─► check learnerId === user.childId
```

### Centralized Guard Enforcement
We will extend `LearningLibraryAuthGuard` to verify session ownership checks centrally:
1. **Identify Session Parameters**: If the request contains `sessionId` (in route params, query, or body), the guard queries the database to resolve the target `learnerId` from `session.learnerId`.
2. **Evaluate Ownership**: It passes `learnerId` to `verifyUserLearnerOwnership(user, learnerId)`. This prevents horizontal privilege escalation where an authenticated parent could manipulate another parent's active sessions.

---

## 2. API Contracts (V2 Parent Namespace)

All parent operations are isolated under `/api/v2/parent`:

### Parent profile and child lookup
* **`GET /api/v2/parent/profile`**
  * *Request*: Authenticated parent user (JWT context).
  * *Response*: `{ data: { id: string, email: string, name: string, consentGiven: boolean } }`
* **`GET /api/v2/parent/learners`**
  * *Request*: Authenticated parent user.
  * *Response*: `{ data: Array<{ id: string, name: string, learnerType: string, curriculumEnrollments: Array<{ active: boolean, structure: { version: number } }> }> }`

### Child onboarding & profile updates
* **`POST /api/v2/parent/learners`**
  * *Request*: `{ name: string, age: number, dateOfBirth?: string, preferredLanguage?: string }`
  * *Action*: Creates a `Child` profile under the parent, links a new V2 `Learner` profile, and initializes `ChildProgress` stats.
  * *Response*: `{ data: Learner }`
* **`PATCH /api/v2/parent/learners/:learnerId`**
  * *Request*: `{ name?: string, preferredLanguage?: string }`
  * *Response*: `{ data: Learner }`

### Configuration and Observability
* **`POST /api/v2/parent/learners/:learnerId/enroll`**
  * *Request*: `{ structureVersion: number }`
  * *Action*: Updates active enrollment. Implements Enrollment Semantics (Section 6).
  * *Response*: `{ data: LearnerCurriculumEnrollment }`
* **`GET /api/v2/parent/learners/:learnerId/analytics`**
  * *Response*: `{ data: ParentAnalytics }` (Derived stats only. No raw evidence keys or assessment payloads are returned).

---

## 3. Server-Authoritative Dashboard Metrics

The parent dashboard queries derived analytics from the backend:

```typescript
export interface ParentAnalytics {
  frontier: Array<{ conceptId: string; canonicalName: string }>;
  mastery: {
    masteredCount: number;
    inProgressCount: number;
    needsReviewCount: number;
  };
  recentActivity: Array<{
    sessionId: string;
    conceptName: string;
    durationSeconds: number;
    status: string;
    date: string;
  }>;
  attentionSignals: Array<{
    type: 'ASSESSMENT_STALL' | 'SESSION_STUCK' | 'INACTIVITY' | 'DECAY_WARNING';
    description: string;
    timestamp: string;
  }>;
}
```

---

## 4. Derived Struggle Detection & Decay Warnings

### Signal `ASSESSMENT_STALL`
* **Rule**: `Count(AssessmentResponse) >= 3` with `passed: false` for the same `learningObjectiveId` within a rolling 7-day window.
* **Clarification**: Failed attempts **do not** need to be consecutive.

### Signal `SESSION_STUCK`
* **Rule**: A session remains in `ACTIVE` or `PAUSED` status and the maximum of:
  * `session.startedAt`
  * `session.pausedAt`
  * Max `step.completedAt` for steps in session
  * Max `assessmentResponse.scoredAt` for assessments in session
  is older than 48 hours.

### Signal `INACTIVITY`
* **Rule**: The maximum of `session.completedAt` and `session.startedAt` for any session of the learner is older than 7 days.

### Signal `DECAY_WARNING`
* **Rule**: The analytics service queries `LearnerConceptMastery` and re-evaluates the authoritative Phase 2.7 decay policy:
  $$\text{Decayed Score} = \text{masteryScore} \times e^{-\lambda \times \Delta t_{\text{hours}}}$$
  If the derived score drops below `remediationThreshold` (0.50), it flags `DECAY_WARNING` for that concept.

---

## 5. Notification & Outbox Idempotency

To prevent duplicate deliveries and support retry/recovery, the notification loops enforce unique event logging keys:

```
[State Engine Event]
       │
       ▼
eventKey = SHA256(learnerId | eventType | aggregateType | aggregateId)
       │
       ▼  (Prisma Transaction)
Upsert NotificationEvent (unique: eventKey)
       │
       ▼  (Cron Worker Poll)
Upsert Notification (unique: eventId | deliveryType | parentId)
       │
       ▼
Idempotent Delivery (Email / In-App Notification Feed)
```

### Updated Prisma Models:
```prisma
enum NotificationEventStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
}

model NotificationEvent {
  id            String                  @id @default(uuid())
  learnerId     String
  eventType     NotificationEventType
  aggregateType String                  // e.g. \"session\", \"mastery\"
  aggregateId   String                  // e.g. sessionId, masteryId
  eventKey      String                  @unique // SHA256(learnerId|eventType|aggregateType|aggregateId)
  payload       Json
  status        NotificationEventStatus @default(PENDING)
  attempts      Int                     @default(0)
  lastAttemptAt DateTime?
  lastError     String?
  processedAt   DateTime?
  createdAt     DateTime                @default(now())

  @@index([status])
}

model Notification {
  id           String             @id @default(uuid())
  parentId     String
  eventId      String
  deliveryType String             // \"IN_APP\", \"EMAIL\"
  status       String             // \"PENDING\", \"SENT\", \"FAILED\"
  sentAt       DateTime?
  createdAt    DateTime           @default(now())

  @@unique([eventId, deliveryType, parentId])
}
```

---

## 6. Enrollment & Session Semantics

When a parent changes the curriculum enrollment version (`POST /api/v2/parent/learners/:learnerId/enroll`):

1. **ACTIVE Sessions (Immutable)**: If the learner currently has a session in `ACTIVE` status, the enrollment switch is **rejected** with `409 Conflict`. The active session must be completed or manually abandoned by the learner before changing the curriculum version.
2. **READY Sessions (Invalidated)**: If there is an existing session in `READY` status, the enrollment endpoint automatically transitions that session's status to `ABANDONED` (releasing its request fingerprint) and flags a replacement event.
3. **Future Sessions**: The session planner uses the new active curriculum enrollment for all subsequent sessions.

---

## 7. V1 Migration & Deprecation Strategy

* **Action `REMOVE`**: Remove the legacy unauthenticated parent endpoints from `ParentController` to close unauthorized access routes.
* **Action `DEPRECATE + BLOCK`**: Replace the mock response handler of `GET /tutor/analytics/:studentId` in `TutorController` with a `410 Gone` error.

---

## 8. Mandatory Invariants

* **`P3-01`**: A parent can access only learners connected through the authoritative parent-child relationship.
* **`P3-02`**: Browser-supplied IDs are never trusted; authorization is verified against the authenticated user context (JWT payload).
* **`P3-03`**: Curriculum structures are immutable to parents.
* **`P3-04`**: Parent APIs cannot directly write mastery, evidence, assessment scores, streaks, or frontier state.
* **`P3-05`**: Parent APIs cannot directly manipulate learner session state.
* **`P3-06`**: Unauthenticated V1 parent/analytics routes cannot remain an alternate production path.
* **`P3-07`**: Session -> learner -> child -> parent authorization must be enforced consistently for every nested V2 resource.
* **`P3-08`**: Every dashboard metric must have a documented authoritative backend source.

---

## 9. 40-Gate Acceptance Matrix

### Parent Security & Child Isolation (Gates 1-8)
* [ ] **`P3-01`**: Verify `GET /api/v2/parent/profile` rejects unauthenticated requests with `401 Unauthorized`.
* [ ] **`P3-02`**: Verify parent lookup fetches details linked solely to the JWT `sub` ID.
* [ ] **`P3-03`**: Verify parent child list rejects retrieval of children owned by another parent with `403 Forbidden`.
* [ ] **`P3-04`**: Verify onboard learner endpoint correctly links child to parent in database.
* [ ] **`P3-05`**: Verify PATCH details validates learner ownership.
* [ ] **`P3-06`**: Verify unauthenticated V1 `/parent/*` routes are removed from the server.
* [ ] **`P3-07`**: Verify `/tutor/analytics/:studentId` returns a `410 Gone` or `403 Forbidden` response.
* [ ] **`P3-08`**: Centralized Session guard resolves learnerId from sessionId and checks ownership.

### Curriculum Configuration (Gates 9-16)
* [ ] **`P3-09`**: Verify parents can select only `PUBLISHED` curriculum versions.
* [ ] **`P3-10`**: Verify enrollment validation rejects `DRAFT`, `VALIDATING`, or `FAILED` curriculum versions.
* [ ] **`P3-11`**: Verify enrollment updates the active enrollment and structure.
* [ ] **`P3-12`**: Verify enrollment rejects enrollments for learners owned by another parent.
* [ ] **`P3-13`**: Verify enrollment does not mutate an existing active session (`409 Conflict`).
* [ ] **`P3-14`**: Verify curriculum nodes and objectives remain immutable to parents.
* [ ] **`P3-15`**: Verify curriculum structure generate/construction routes reject `PARENT` role.
* [ ] **`P3-16`**: Verify board mapping create routes reject `PARENT` role.

### Dashboard Observability & Mastery (Gates 17-24)
* [ ] **`P3-17`**: Verify dashboard reads active frontier dynamically.
* [ ] **`P3-18`**: Verify mastery status progress matches db counts of `MASTERED`.
* [ ] **`P3-19`**: Verify no fabricated streak metrics are displayed on the frontend.
* [ ] **`P3-20`**: Verify recent sessions list pulls from active `LearningSession` database tables.
* [ ] **`P3-21`**: Verify session duration averages are calculated mathematically from database logs.
* [ ] **`P3-22`**: Verify decay status indicators reflect `lastAssessedAt` timestamps.
* [ ] **`P3-23`**: Verify parent dashboard rejects manual modification of child mastery scores.
* [ ] **`P3-24`**: Verify parent dashboard rejects manual additions of learner evidence.

### Struggle Detection & Event Alerts (Gates 25-32)
* [ ] **`P3-25`**: Verify `ASSESSMENT_STALL` trigger flags objective struggle on 3 consecutive failures.
* [ ] **`P3-26`**: Verify `SESSION_STUCK` trigger flags long-running inactive sessions.
* [ ] **`P3-27`**: Verify `INACTIVITY` trigger flags profile after 7 days of silence.
* [ ] **`P3-28`**: Verify `DECAY_WARNING` trigger flags decayed concepts.
* [ ] **`P3-29`**: Verify `NotificationEvent` is successfully logged to outbox.
* [ ] **`P3-30`**: Verify notification dispatcher runs independently from session planner.
* [ ] **`P3-31`**: Verify in-app notifications feed displays processed notifications.
* [ ] **`P3-32`**: Verify parent alert notifications match parent-configured notification settings.

### Production Readiness & Idempotency (Gates 33-40)
* [ ] **`P3-33`**: Verify nested resource isolation (nested sessionId/stepId/assessmentInstanceId queries verify owner).
* [ ] **`P3-34`**: Verify same learning event does not generate duplicate notification events via `eventKey`.
* [ ] **`P3-35`**: Verify failed notifications remain retryable in outbox status.
* [ ] **`P3-36`**: Verify notification dispatcher ensures delivery idempotency.
* [ ] **`P3-37`**: Verify changing enrollment auto-abandons existing `READY` sessions.
* [ ] **`P3-38`**: Verify parent analytics uses the authoritative Phase 2.7 decay policy.
* [ ] **`P3-39`**: Verify all Phase 2.7, 2.8, and 2.9 Jest test suites remain green.
* [ ] **`P3-40`**: Verify Next.js production build compiler check succeeds.

---

## 10. Verification & E2E Plan

1. **Database Schema Migrations**: Execute `npx prisma migrate dev` to add `NotificationEvent` and `Notification` models to the PostgreSQL schema.
2. **Automated Spec Suite**: Create a dedicated parent portal integration test suite `phase3-e2e-parent.spec.ts` asserting:
   * Parent-child boundary limits.
   * Multi-parent child isolation.
   * Dynamic curriculum version updates.
   * Struggle signal outbox event creation.
