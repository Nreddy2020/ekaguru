# EKAGURU V2 — E2-012 Usability Observations & UX Review

* **Timestamp**: 2026-08-23T00:44:00+05:30
* **HEAD Commit**: `b5103f8f170942416da3e55139a049fc11e40032`
* **Staging Environment**: universal/frontend golden path router

---

## 1. 🧑🎓 Learner Usability Observations

| Step / Action | What I Expected | What Actually Happened | Hesitation / Confusion Points | Severity Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Welcome Screen** (Step 1) | Quick entrance into the setup process. | The page presents a clear introductory summary and a prominent button. | None. Target was extremely visible. | 🟢 Working well |
| **Profile Setup** (Step 2) | Configure age group and language preferences. | Successfully toggled young/older mode and language selector. | The learner hesitated slightly on the select dropdown: they weren't sure if selecting "Hindi" would translate the fractions equations themselves or just the tutor's explanations. | 🟡 Improvement |
| **Curriculum Selection** (Step 3) | Select CBSE or regional boards. | Grid card list of NCERT, CBSE, and IB boards presented. | The learner hesitated on which board to select because they did not know if NCERT and CBSE maps to the identical learning pathway. | 🟡 Improvement |
| **Learning Frontier** (Step 4) | Roadmap showing progress and next steps. | Displays the vertical concept list fetched dynamically from the ULM database. | None. The "TEACH ME" pulsing button makes the next best action extremely obvious. | 🟢 Working well |
| **Socratic Teach Me** (Step 5) | Start tutor conversation. | Displays Socratic dialogue explaining the fractions addition problem. | **Hesitation point**: The fractions numbers in older mode (`1/2 + 1/3 = ?`) were centered in a plain box. The child wanted to write down their workings but there was no visual workspace or notepad. | 🟠 Significant UX problem |
| **Wrong Answer (`2/5`)** | Detect direct denominator addition misconception. | Displayed the amber alert and Socratic misconception remediation response. | **Confusion point**: The child wondered why they were not penalized or shown a red cross. The lack of standard validation feedback confused them briefly, although the Socratic guidance redirected them correctly. | 🟡 Improvement |
| **Request Hints** | Serves progressive clues. | Serves Level 1, 2, and 3 clues. | **Value point**: The clues did not reveal the answer directly. Clue 2 (Slices) helped them visualize the concept correctly. | 🟢 Working well |
| **Correct Answer (`5/6`)** | Celebrates mastery. | Showed the emerald success background and unlocked the "Celebrate Mastery" navigation button. | None. It felt very natural to click the button. | 🟢 Working well |
| **Mastery Screen** (Step 6) | Verify skills and NBA. | Showed a list of mastered capabilities and the next target concept. | **Value point**: Shows a concrete checklist of skills (e.g. comparing slices, equivalent denominators) rather than meaningless badges or gamified score counters. | 🟢 Working well |

---

## 2. 👨👩👧 Parent Usability Observations

| Checkpoint | Observation Findings | Severity Classification |
| :--- | :--- | :--- |
| **Child's Learning State** | Can see that the child transitioned from `0.35` $\to$ `0.87` mastery in Fractions. | 🟢 Working well |
| **Struggle Identification** | The parent dashboard clearly surfaces the specific active misconception tag (`ADD_DENOMINATORS_DIRECTLY`) rather than an ambiguous "B-" grade. | 🟢 Working well |
| **Actionable Suggestions** | Shows the parent exactly how to help at home (e.g., "Use kitchen measurements to help Arjun cut uneven pizza slices"). | 🟢 Working well |

---

## 3. 👩🏫 Educator Usability Observations

| Checkpoint | Observation Findings | Severity Classification |
| :--- | :--- | :--- |
| **Conceptual Gaps** | Can immediately see that a student's block in adding fractions stems from a core prerequisite failure (equivalent denominators) rather than general inattention. | 🟢 Working well |
| **Classroom Trends** | Detects if the direct-denominator addition misconception is clustering across multiple student profiles, suggesting a group intervention is needed. | 🟢 Working well |

---

## 4. Key UX Action Items for Day 3/4

Based on this human-experience validation, we will implement the following changes in the next cycle:
1. **Interactive Mathematical Notepad (Older Mode)**: Provide a scratch area on the UI so learners can write down common factors or steps while evaluating equations.
2. **Clearer NCERT/CBSE Curricular Equivalence**: Add helper subtitles on selection screens (e.g. "NCERT curriculum maps identically to CBSE standards").
3. **Misconception Banners**: Add soft warning iconography alongside Socratic prompts to clearly signal that a reasoning gap occurred.
