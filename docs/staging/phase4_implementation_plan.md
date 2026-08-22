# Implementation Plan — Phase 4.0 & 4.1: Learner Experience & Design System

This plan details the design, routing integration, visual systems, and client-server contract for implementing **Phase 4.0 (Design System)** and **Phase 4.1 (Learner Golden Path)**.

---

## Technical & Product Invariants

We have aligned the execution to the following architectural and design invariants:
> [!IMPORTANT]
> * **Tutor Provider Abstraction**: A new `TutorProvider` interface will decouple the Socratic Tutor logic from LLM implementations. Phase 4.1 will execute using a pedagogical simulator (`DeterministicTutorProvider`) to guarantee reliable, testable response paths.
> * **Child-Friendly ≠ Childish**: All UI components utilize a professional, minimal, and premium aesthetic (4px/8px grid system, semantic colors, centered mathematical expressions).
> * **Age-Adaptive UX**: UI targets, font scales, and Socratic narrative complexity adapt dynamically based on the learner's age context.
> * **Universal Learner Model (ULM) & Explainable Reasons**: The ULM tracks active misconceptions, struggles, and mastery deltas to dynamically calculate next-best-action targets with explicit, human-readable reason keys.

---

## Proposed Changes

### 1. Global Design System (`universal/frontend`)
* **Visual Tokens**: Register semantic CSS variables/Tailwind tokens for mastered (`#389e0d`), active (`#1d39c4`), attention (`#d46b08`), locked (`#8c8c8c`), success (`#52c41a`), and error (`#f5222d`).
* **Socratic Chat Message & Hint Components**: Premium message bubble typography, centered math layout blocks, and progressive hint expansion buttons.
* **Competency Mastery Screen**: Clean achievement cards listing unlocked capabilities and next roadmap milestones without cartoon elements or excessive game decorations.

### 2. Frontend Golden Path Routes (`universal/frontend`)
* **Onboarding & Curriculum Selection**: Welcoming, large-target selection flows (welcome, grade, curriculum board) storing preferences in `Learner` and `LearnerCurriculumEnrollment`.
* **Learning Frontier**: Dashboard roadmap visually mapping active/locked nodes linked to the database learner frontier model.
* **Teach Me Session Player**: Chat-style workspace integrating `TutorContext` variables, showing bordered amber alerts (`#f39c12`) when misconception counters are triggered.

### 3. Backend Tutor Coordinator (`universal/backend`)
* **Tutor Abstractions**: Create `tutor-provider.interface.ts` and implement `DeterministicTutorProvider` coordinating `startSession`, `respond`, `requestHint`, and `explainMisconception` methods.
* **Session Lifecycle Updates**: Update `session.controller.ts` and `assessment-engine.service.ts` to coordinate Socratic dialog iterations, progressive hints, and misconception tag observations.

---

## Verification Plan

### Layer 1: Component/UI Verification
* Verify visual styling, mobile/tablet/desktop responsive breakpoints, accessibility tags, and state transitions using Jest.
  ```bash
  npm run test universal/frontend/app/student/session/phase29-ui.spec.tsx
  ```

### Layer 2: API Integration Verification
* Verify that Socratic dialog selections, hint calls, and response submissions successfully trigger state mutations on PostgreSQL.

### Layer 3: Golden Path Learner Journey Verification
* Execute a simulated full-journey E2E test suite simulating a student (Arjun, Grade 5, CBSE) walking through:
  `Diagnostic` $\to$ `Incorrect Response` $\to$ `Misconception Tag Observation` $\to$ `Socratic Hint 1/2` $\to$ `Correct Response` $\to$ `Mastery cross-threshold` $\to$ `Next-Best-Action update`.

---

## E2-012 — Human UX Acceptance & Connectivity Architecture

### Three-State Offline Connectivity Model
1. **Online + Authoritative (Connected)**: Standard REST API calls; Postgres/ULM state is fully authoritative.
2. **Offline + Learning Available (Offline)**: Read cached content; local IndexedDB queues learner events (`STEP_VIEWED`, `READ_TIME`) to sync upon reconnection.
3. **Offline + Evaluation Unavailable (Connection Required)**: Evaluative checkpoints and mastery assessments are locked until live connection is restored.

### Human UX Acceptance Persona Flows
* **Learner Flow**: Frontier Roadmap $\to$ Socratic Prompt $\to$ Safe Struggle (3 Hint levels) $\to$ Misconception Warning $\to$ Mastery Update $\to$ Frontier updates.
* **Parent Flow**: Check active mastery progress $\to$ view recorded misconception reasons $\to$ receive actionable suggestion cards.
* **Educator Flow**: Aggregate classroom-level frontier mapping $\to$ display missing prerequisites blocking advancement.
