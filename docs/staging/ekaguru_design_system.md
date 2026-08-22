# EKAGURU Global Design System Specification v1

This document establishes the visual design language, typographic standards, semantic color palettes, and component blueprints for **EKAGURU**. It serves as the foundational design contract for Phase 4.1 execution, ensuring that the interface is child-friendly but never childish.

---

## 1. Visual Identity & Tone

EKAGURU is designed as a premium, global learning access layer. The visual identity avoids toy-like elements, cartoon avatars, and excessive animations.

### Design Principles
* **Intelligent & Professional**: The interface feels like a sophisticated learning tool, making it suitable for schools, parents, and governments.
* **Calm & Distraction-Free**: White space, clean lines, and soft neutral backgrounds minimize cognitive fatigue.
* **Content-First**: Educational content, mathematical equations, and Socratic dialogues are the main focus of the UI.
* **Empowering**: Highlights competencies and learning growth rather than game-like rewards.

---

## 2. Spacing Grid & Typography

The spacing system is built on a strict **4px/8px baseline grid** to ensure visual alignment and clean mathematical layout.

### Font Scale
* **Header Large (H1)**: `30px` (bold, tracking `-0.02em`) — Dashboard titles.
* **Header Medium (H2)**: `22px` (semibold, tracking `-0.015em`) — Concept cards.
* **Header Small (H3)**: `18px` (medium) — Section labels.
* **Body Large**: `16px` (regular, leading `1.5`) — Socratic tutor statements.
* **Body Regular**: `14px` (regular, leading `1.45`) — General text.
* **Code / Math**: `14px` (monospace) — Equations, code expressions.

### Mathematical Layout Invariant
All mathematical fractions and formulas are rendered centered, with clear fraction bars and legible numerators/denominators:

```
    1
    ─
    2
```

---

## 3. Semantic Color System

Colors are used strictly to convey learning state and semantic meaning, not decoration.

| State / Semantic | Light Mode Value | Dark Mode Value | Meaning |
|---|---|---|---|
| **Mastered** | `#389e0d` (Soft Green) | `#27c24c` | Concept is successfully mastered |
| **Active** | `#1d39c4` (Deep Blue) | `#4d7cfe` | The active target / current milestone |
| **Attention** | `#d46b08` (Ochre) | `#f39c12` | Misconception / struggle observed |
| **Locked** | `#8c8c8c` (Muted Grey) | `#434343` | locked prerequisite node |
| **Success** | `#52c41a` (Green) | `#2ecc71` | Correct response / task completed |
| **Error** | `#f5222d` (Red) | `#e74c3c` | Incorrect response / failure |
| **Neutral BG** | `#f9fafb` (Off-white) | `#020617` (Deep Slate) | Page backgrounds |

---

## 4. Age-Adaptive UX Presentation

EKAGURU adapts its presentation layer dynamically based on the learner's age profile tracked in the `Universal Learner Model`:

```
                       [ UNIVERSAL LEARNER MODEL ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        [ Young Learner Mode ]              [ Older Learner Mode ]
         (Learner Age 7 - 11)                (Learner Age 12 - 15)
         * 16px base font size               * 14px base font size
         * 56px touch target heights         * 44px touch target heights
         * Visual fraction cards             * Symbolic fraction equations
         * Socratic analogies               * Rigorous conceptual terminology
```

---

## 5. Tutor Presence & Workspace Layout

The active learning workspace ("Teach Me") implements a structured, content-focused layout. The tutor is represented by a clean identity, focusing entirely on the learning task:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Fractions                                       (82% Progress)
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [ Tutor Statement ]                                        │
│  "Let's look at these two fractions. We cannot add them     │
│  directly because their denominators are different."         │
│                                                             │
│  [ Mathematical Hero Section ]                              │
│                                                             │
│                    1            1                           │
│                    ─     +      ─                           │
│                    2            3                           │
│                                                             │
│  "Before we find a common denominator, what do you think   │
│  happens to the size of the pieces?"                        │
│                                                             │
│  [ Interactive Socratic Controls ]                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ A) The pieces become smaller                          │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ B) The pieces remain the same                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Need help? [ Request Hint ]                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Socratic & Remediation Interaction Patterns

### Progressive Hint Progression
When the learner requests a hint, the interface presents Socratic guidance in three strict levels:
1. **Level 1 (Gentle Clue)**: General hint prompting observation.
2. **Level 2 (Conceptual Analogy)**: Everyday conceptual comparison (e.g. comparing pizza slices).
3. **Level 3 (Guided Steps)**: Step-by-step mathematical breakdown.

### Misconception Detection Alert
* **Interaction**: Triggered when a misconception tag is identified.
* **Visual Presentation**: The workspace border transitions to a soft yellow highlight (`#f39c12`), and the tutor statement transitions to a counter-example prompt instead of displaying standard error flags.

---

## 7. Competency-Focused Mastery Screen

Avoid game-like dashboard rewards or excessive decorations. Achievement is presented as competency-focused growth:

```
                            [✓]
                         FRACTIONS
                          MASTERED

               You can now confidently:
               • Compare fractions visually.
               • Find equivalent denominators.
               • Add fractions with like denominators.

               Next milestone:
               Adding fractions with unlike denominators.

                         [ CONTINUE ]
```

---

## 8. Responsive System & Accessibility (A11y)

### Breakpoints
* **Mobile**: `< 640px` (Single column layout, bottom navigation).
* **Tablet**: `640px - 1024px` (Two column layout, split explorer view).
* **Desktop**: `> 1024px` (Sidebar navigation, workspace with side-by-side math canvas).

### A11y Standards
* Minimum contrast ratio of **4.5:1** for body text.
* Interactive targets have a minimum height of **44px** (Older) and **56px** (Young).
* All images and visual formulas contain structural screen reader tags (`aria-label` / `alt` tags).
