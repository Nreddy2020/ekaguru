# EKAGURU V2 — Product Experience Specification v1

This document establishes the functional user experience model and UI flow design for **EKAGURU**, linking every screen and interaction explicitly back to its backend database schema domain model.

---

## 1. GUI-to-Backend Domain Mapping Invariants

To prevent the product experience from diverging from the technical architecture, every interface element maps directly to one or more database tables:

| GUI Component | Action | Primary Backend Model | Key Schema Relationship |
|---|---|---|---|
| **Curriculum Tree** | Select Grade & Board | `Subject` / `Phase` / `Module` | Topic hierarchy traversal |
| **Import Book** | Upload PDF / Photo | `LearningMaterial` / `Document` | Extracted text blocks |
| **Frontier View** | Next-Best-Action Node | `LearnerCurriculumFrontier` | Linked to `CurriculumNode` |
| **Teach Me Screen** | Start Session | `LearningSession` | References `Learner` and `CurriculumStructure` |
| **Tutor Conversation** | Chat Message | `SessionStep` | Step execution lifecycle |
| **Assessment Prompt** | MCQ / Q&A Prompt | `AssessmentInstance` | Spawned from `AssessmentSpecification` |
| **Learner Response** | Child Submission | `AssessmentResponse` | Scored on-server only |
| **Parent Dashboard** | Journey View | `LearnerConceptMastery` | traversal via `Parent` $\to$ `Child` $\to$ `Learner` |

---

## 2. Comprehensive Product Screen Specifications

### Screen 1: Global Navigation
* **UX Description**: Clean, distraction-free bottom navigation bar for mobile (Learner/Parent) and side sidebar for desktop (Educator). Minimizes controls to keep children focused on learning.
* **UI Elements**:
  * Learner: `Home (Frontier)`, `Teach Me (Active Session)`, `Progress (Mastery Graph)`.
  * Parent: `Child Profile`, `Today's Learning`, `Attention Signals`, `Notifications`.
* **Domain Model Mapping**:
  * Traversals resolved using `Parent` $\to$ `Child` $\to$ `Learner` to ensure tenant isolation.

### Screen 2: Learner Onboarding
* **UX Description**: Welcoming step-by-step onboarding flow. Collects child name, age, and language preference using friendly, large interactive buttons.
* **UI Elements**: Name text input, age selection dial, narrative role card selector (KID, STUDENT, GENIUS).
* **Domain Model Mapping**:
  * Creates record in `Learner` with fields `name`, `dateOfBirth` (calculated from age), `learnerType` set to `CHILD`, and `preferredLanguage`.

### Screen 3: Curriculum Selection
* **UX Description**: Simple grid selector to pick the standard curriculum the learner's school uses.
* **UI Elements**: Grid of board logos: CBSE, ICSE, NCERT, IB, IGCSE, State Board, Custom.
* **Domain Model Mapping**:
  * Writes to `LearnerCurriculumEnrollment` linking the `Learner` to the selected `CurriculumStructure`.

### Screen 4: Textbook Upload
* **UX Description**: Camera/file uploader interface allowing students to take photos of their school textbook pages or drag-and-drop course PDFs.
* **UI Elements**: Upload drag-area, camera capture button, upload progress bar, document status indicator.
* **Domain Model Mapping**:
  * Creates `LearningMaterial` and `Document` records. Sets `processingStatus` to `UPLOADED` to trigger OCR and concept mapping workers.

### Screen 5: Knowledge Extraction
* **UX Description**: Visual background processing screen showing a stylized "brain scanning" animation as EKAGURU extracts chapters and topics from the uploaded textbook.
* **UI Elements**: Animation of text blocks converting into nodes, status indicators: "Extracting Chapters", "Mapping Concepts", "Synthesizing Tasks".
* **Domain Model Mapping**:
  * Displays status based on `Document` status (`PENDING` $\to$ `PROCESSING` $\to$ `READY`). Populates `ContentChapter`, `ContentTopic`, and `ContentChunk` records once extraction completes.

### Screen 6: Diagnostic Assessment
* **UX Description**: A quick, 5-question adaptive assessment presented in a gamified conversational format to find gaps in prerequisite knowledge.
* **UI Elements**: Interactive questions with progress dots (e.g. 1/5), single-select answer options.
* **Domain Model Mapping**:
  * Spawns `AssessmentInstance` for the diagnostic `SessionStep`. Saves responses to `AssessmentResponse` to immediately calibrate starting `LearnerConceptMastery` scores.

### Screen 7: Learning Frontier
* **UX Description**: The primary home dashboard. Shows a clear path of the current chapter, highlighting the next best concept to learn.
* **UI Elements**: Interactive roadmap nodes (Greened = Mastered, Yellow/Glowing = Next Best Action, Grey = Locked).
* **Domain Model Mapping**:
  * Renders path dynamically based on `LearnerCurriculumFrontier` and `LearnerConceptMastery` states.

### Screen 8: Teach Me (Signature Screen)
* **UX Description**: The main interactive study workspace. Combines conversational guidance from the AI Tutor with visual layouts of the concepts, formulas, or diagrams.
* **UI Elements**: Tutor avatar head, chat transcript area, interactive canvas showing current formula/question, navigation buttons: `I'll try`, `Give me a hint`, `I don't know`.
* **Domain Model Mapping**:
  * Modifies `LearningSession` status to `ACTIVE`. Steps are tracked via `SessionStep` models linked to `SessionTarget`.

### Screen 9: Tutor Conversation
* **UX Description**: Chat bubble interface where the AI Tutor explains concepts and asks clarifying questions. Explanations are limited to 3 sentences maximum.
* **UI Elements**: Conversational bubble chain, typing indicators, auto-scroll toggle.
* **Domain Model Mapping**:
  * Writes user responses as `AssessmentResponse` entries. Conversation history and logs are maintained in `SessionEvidence`.

### Screen 10: Hint System
* **UX Description**: A button that provides progressive, Socratic assistance instead of giving away answers immediately.
* **UI Elements**: Progressively revealed text panels, Level indicator (Level 1 Clue $\to$ Level 2 Analogy $\to$ Level 3 Walkthrough).
* **Domain Model Mapping**:
  * References `AssessmentSpecification` hint array configurations, tracking usage count inside `AssessmentInstance`.

### Screen 11: Misconception Experience
* **UX Description**: Triggered when the student makes a common mistake (e.g. adding denominators directly). The tutor screen changes border color to soft yellow and pivots to a friendly visual counter-example walkthrough.
* **UI Elements**: Highlighted counter-example box (e.g. "If you add 1/2 pizza and 1/2 pizza, do you get 2/4 pizza?").
* **Domain Model Mapping**:
  * Creates a record in `LearnerObjectiveMastery` with a misconception tag, triggering the `AdaptiveEngine` to insert a `REMEDIATION` target into `SessionTarget`.

### Screen 12: Mastery Celebration
* **UX Description**: High-energy, rewarding modal triggered when a concept is successfully mastered.
* **UI Elements**: Confetti animation, sound cue toggle, badge reveal, mastery level increase visualizer (e.g. "Fractions Mastered!").
* **Domain Model Mapping**:
  * Triggered when `LearnerConceptMastery` score crosses the threshold (e.g., $\ge 0.85$). Writes a `MASTERY_ACHIEVED` record to `NotificationEvent`.

### Screen 13: Parent Dashboard
* **UX Description**: Clean, parent-friendly overview focusing on "Learning Health" and actionable insights.
* **UI Elements**: Today's Learning status bar (Understand $\to$ Practice $\to$ Strengthen $\to$ Master), Learning Health indicator (🟢 ACTIVE / 🟡 NEEDS ATTENTION / 🔴 STUCK).
* **Domain Model Mapping**:
  * Aggregates stats from `LearnerConceptMastery` and `ChildProgress` tables linked to the parent's `Child` records.

### Screen 14: Parent Intervention
* **UX Description**: A dedicated drawer providing the parent with guide cards and scripts to help their struggling child.
* **UI Elements**: "Practice Together" button, 10-minute guide scripts (e.g. "How to explain equivalent denominators using paper folding").
* **Domain Model Mapping**:
  * Pulls from `CurriculumNodeObjective` remediation guidelines for nodes flagged as `STUCK` in the child's `LearnerObjectiveMastery`.

### Screen 15: Educator Dashboard
* **UX Description**: Desktop grid visualization designed for classroom teachers to identify conceptual gaps across all students.
* **UI Elements**: Class concept coverage heatmaps (CBSE syllabus nodes vs mastery percentages), student list sorted by struggle alerts.
* **Domain Model Mapping**:
  * Aggregates `LearnerConceptMastery` and `MasteryHistory` records across all children enrolled in the educator's class context.

### Screen 16: Knowledge Graph View
* **UX Description**: An interactive node-link map showing the network of concept dependencies.
* **UI Elements**: Zomable SVG node-link graph (Green = Mastered, Orange = Active, Grey = Locked).
* **Domain Model Mapping**:
  * Traverses relations in `CurriculumPrerequisite` and `CurriculumNode` for the current syllabus tree.

### Screen 17: Notifications
* **UX Description**: Real-time message feed showing updates on student learning.
* **UI Elements**: List of notifications grouped by date, action links (e.g. "View Maya's Struggle").
* **Domain Model Mapping**:
  * Fetches paginated records from the `Notification` table matching the parent's profile.

### Screen 18: Accessibility (A11y)
* **UX Description**: Global settings panel to adjust visual and audial settings.
* **UI Elements**: Font size sliders, high-contrast toggle, screen reader friendly layouts (with `aria` tags), text-to-speech button.
* **Domain Model Mapping**:
  * Persisted in the `Learner` preferences JSON metadata object.

### Screen 19: Multilingual Experience
* **UX Description**: Seamless language switcher ensuring children can learn in their home language.
* **UI Elements**: Language selection dropdown (English, Hindi, Telugu, Tamil, Marathi, etc.).
* **Domain Model Mapping**:
  * Updates `Learner.preferredLanguage`, causing the `TutorEngine` to request translation layers from `AI Foundation`.

### Screen 20: Low-Bandwidth / Mobile Optimization
* **UX Description**: Minimalist mode designed to function over degraded 2G/3G connections in rural areas.
* **UI Elements**: Offline indicators, low-resolution/text-only toggles, local progress sync indicator.
* **Domain Model Mapping**:
  * LocalStorage-backed state syncs delta events back to the backend once connections are restored.

### Screen 21: Free vs Paid Learning Access
* **UX Description**: Informative, non-intrusive access limit screens.
* **UI Elements**: Daily free learning limits, sponsor-backed free credits, premium unlocks for unlimited practice.
* **Domain Model Mapping**:
  * Validated against user limits tracked via payment/entitlement metadata in the `Parent` record.

### Screen 22: Privacy & Child-Safe UX
* **UX Description**: Explicit consent flows ensuring children are protected.
* **UI Elements**: Parent verification questions (PIN verification), COPPA/GDPR warning popups.
* **Domain Model Mapping**:
  * Tracks consent state via `consentGiven` and `consentDate` fields in the `Parent` model.
