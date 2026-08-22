# EKAGURU Feature Value Gate & Educational Impact Review Framework

This framework serves as a permanent architectural and product gate for EKAGURU. Every proposed feature, API update, or UI capability must pass this gate before entering implementation.

---

## 1. Feature Review Architecture Card

For every new capability, the implementation team must fill out this architecture card:

| Assessment Field | Requirement / Criteria |
|---|---|
| **Problem** | What specific educational problem does this solve? |
| **Target Audience** | Who benefits? (Learner / Parent / Educator / Underserved Learner) |
| **Potential Reach** | Estimated learner population size (Scale) |
| **Frequency** | Daily / Weekly / Occasional usage rate |
| **Learning Impact** | Low / Medium / High (Demonstrated pedagogical outcome) |
| **Accessibility Impact** | Low / Medium / High (Multilingual, Offline, Screen-reader compatibility) |
| **Affordability Impact** | Low / Medium / High (Enabling zero-cost or low-cost learning access) |
| **Acceptance Risk** | Low / Medium / High (User friction, parental trust, educator alignment) |
| **Technical Complexity** | Low / Medium / High (Database schema updates, API burden, model dependencies) |
| **Staging Evidence** | How will we prove it works? (E2E run logs, user tests) |
| **Trust Check** | "Would I give this to my own child?" (Safety, cognitive payload) |
| **Verdict** | Build / Defer / Reject |

---

## 2. The Six Mandatory Architectural Gates

### Gate 1: Global Value Gate
Every pixel must earn its place. Features that only serve decorative purposes, cause excessive gamification, or distract from the learning content are deferred or rejected.

### Gate 2: Design Gate ("Child-Friendly ≠ Childish")
The visual identity of EKAGURU must reflect a calm, premium, modern, and intelligent global learning platform. We prioritize high-legibility mathematical notation and clean Socratic layouts over game-arcade animations.

### Gate 3: Tutor Architecture Gate
Decouples UI layout from intelligence engine implementations. All front-end modules communicate via the `Pedagogical Tutor Engine` coordinator, which maps to `TutorProvider` implementations. The client must never know if it is talking to a deterministic simulator or a live LLM instance.

### Gate 4: ULM-Driven Decisions
The Universal Learner Model (ULM) remains the single source of truth for the child's academic state. Frontend views must never determine what to display next; they merely render next-best-action targets calculated by the Mastery and Adaptive Engines.

### Gate 5: Learning Outcome Verification
Verification goes beyond API response status codes. Every major feature release must verify:
* Misconception tags detected before/after intervention.
* Time-to-understanding and retention metrics.
* Mastery delta improvements.

### Gate 6: Child Safety & Explainability
Every tutor interaction must minmize personal data collection and provide audit trails. Next Best Actions must contain machine-readable explainability logs (e.g. why a specific remediation path was chosen).
