# Ekaguru: Verification Scripts Catalog & Runbook
**Last Updated**: February 2026
**Total Scripts**: 38 source files (13 TypeScript + 25 Python)

---

## Quick Reference: How to Run

### TypeScript (NestJS Backend)
```bash
cd universal/backend
npx ts-node src/verify_<script_name>.ts
```

### Python (Microservices)
```bash
cd <service_directory>
python verify_<script_name>.py
```

### Full System Health
```bash
python scripts/verify_system_health.py
```

---

## 1. NestJS Backend Verification Scripts (TypeScript)

All located in `universal/backend/src/`

| # | Script | What It Tests | Key Assertions |
|---|--------|--------------|----------------|
| 1 | [verify_adaptive.ts](file:///e:/Ekaguru/universal/backend/src/verify_adaptive.ts) | **Persona Lens System** — Kid/Student/Genius modes for "Velocity" | Kid lens contains "rabbit"; Student has "Speed + Direction"; Genius has Socratic + Interdisciplinary |
| 2 | [verify_ai_logic.ts](file:///e:/Ekaguru/universal/backend/src/verify_ai_logic.ts) | **Knowledge Graph Construction** — Node/edge creation from book content | Velocity node found; edges created; Velocity→Time edge verified |
| 3 | [verify_architect.ts](file:///e:/Ekaguru/universal/backend/src/verify_architect.ts) | **OmniEngine Book Structuring** — empty text, stopwords, rich text | Handles edge cases; generates chapters from keyword analysis |
| 4 | [verify_book_service.ts](file:///e:/Ekaguru/universal/backend/src/verify_book_service.ts) | **Visual Layout + Vision AI** — PDF item structuring + image captions | Caption detection; Vision AI integration via mock; H1/H2 classification |
| 5 | [verify_complete_uke.ts](file:///e:/Ekaguru/universal/backend/src/verify_complete_uke.ts) | **Comprehensive UKE Suite** (5 tests) — Super-Intelligence, Self-Evolution, Version Tracking, Deep Ingestion, Goal Roadmaps | All personas work for Gravity/Democracy/Quantum Computing; on-demand learning; FIFO version limit; deep learning ≥5 topics; 5-level roadmap |
| 6 | [verify_dashboard.ts](file:///e:/Ekaguru/universal/backend/src/verify_dashboard.ts) | **Parent Dashboard Analytics** — mastery tracking and insight generation | Initial mastery = 0; updates dynamically after student learns; generates success insights |
| 7 | [verify_deep_ingestion.ts](file:///e:/Ekaguru/universal/backend/src/verify_deep_ingestion.ts) | **Proactive Topic Learning** — deep learning with instant answers | Deep learn "OpenShift"; all sub-topics answered <100ms (instant, no on-demand) |
| 8 | [verify_roadmap.ts](file:///e:/Ekaguru/universal/backend/src/verify_roadmap.ts) | **Goal-Based Learning Path** — 5-level roadmap with progress tracking | 5 levels (Beginner→Architect); each has milestones + topics; next step recommender works |
| 9 | [verify_schema.ts](file:///e:/Ekaguru/universal/backend/src/verify_schema.ts) | **Prisma Knowledge Graph Models** — schema validation | ConceptAtom, ConceptRelation, ComplexityLens models exist |
| 10 | [verify_self_evolution.ts](file:///e:/Ekaguru/universal/backend/src/verify_self_evolution.ts) | **On-Demand Learning Loop** — learning unknown topics | Quantum Computing learned on first ask; cached on second ask; Genius mode has deep reasoning |
| 11 | [verify_super_intelligence.ts](file:///e:/Ekaguru/universal/backend/src/verify_super_intelligence.ts) | **Cross-Domain Reasoning** — physics, philosophy, tech, emotion | Tests Entropy, Justice, Kubernetes, Love across all persona lenses; Socratic/Interdisciplinary patterns |
| 12 | [verify_tutor.ts](file:///e:/Ekaguru/universal/backend/src/verify_tutor.ts) | **Tutor ↔ Brain Integration** — Kid + Architect persona | Kid lens has "rabbit" narrative; Architect lens has "derivative" |
| 13 | [verify_version_tracking.ts](file:///e:/Ekaguru/universal/backend/src/verify_version_tracking.ts) | **Temporal Version Tracking** — FIFO version limits | OpenShift v4.12→v4.17; stores exactly 5 versions (FIFO); version count correct |

---

## 2. Python Microservice Verification Scripts

### Memory Service (`memory_service/`)

| Script | What It Tests | Key Assertions |
|--------|--------------|----------------|
| [verify_production.py](file:///e:/Ekaguru/memory_service/verify_production.py) | **Optimistic Locking + Outbox + FSM Guards** | Create→version 1; Update with correct version→version 2; Wrong version→409 Conflict; Outbox events created; Invalid state transition (introduced→mastered)→400 |
| [verify_service.py](file:///e:/Ekaguru/memory_service/verify_service.py) | Basic CRUD operations | Service responds to API calls |

### Orchestrator Service (`orchestrator_service/`)

| Script | What It Tests | Key Assertions |
|--------|--------------|----------------|
| [verify_orchestrator.py](file:///e:/Ekaguru/orchestrator_service/verify_orchestrator.py) | **FSM State Transitions** (5 scenarios) | Unknown→observe; Misconception→explain; Partial+HighStruggle→explain; Partial+LowStruggle→struggle; Understood+Confident→reflect |
| [verify_integration.py](file:///e:/Ekaguru/orchestrator_service/verify_integration.py) | Memory Service integration | Orchestrator fetches state from Memory Service |

### Diagnosis Agent (`diagnosis_agent/`)

| Script | What It Tests | Key Assertions |
|--------|--------------|----------------|
| [verify_diagnosis.py](file:///e:/Ekaguru/diagnosis_agent/verify_diagnosis.py) | **Misconception Detection** (3 scenarios) | "I don't know"→fear_avoidance; "4 is bigger"→denominator_as_bigger_number; "divide into parts"→understood |
| [verify_ph2_task5.py](file:///e:/Ekaguru/diagnosis_agent/verify_ph2_task5.py) | Phase 2 Task 5 regression | Extended diagnosis scenarios |

### Teaching Agent (`teaching_agent/`)

| Script | What It Tests | Key Assertions |
|--------|--------------|----------------|
| [verify_teaching.py](file:///e:/Ekaguru/teaching_agent/verify_teaching.py) | **Layered Pedagogy** (2 scenarios) | Misconception→experience layer with "pizza"; Unknown→experience with "chocolate"; ≥3 teaching steps |
| [verify_ph2_task6.py](file:///e:/Ekaguru/teaching_agent/verify_ph2_task6.py) | Phase 2 Task 6 regression | Extended teaching scenarios |

### Struggle Agent (`struggle_agent/`)

| Script | What It Tests | Key Assertions |
|--------|--------------|----------------|
| [verify_struggle.py](file:///e:/Ekaguru/struggle_agent/verify_struggle.py) | **Adaptive Difficulty** (3 levels) | Mastery 20→worked_example; Mastery 50→guided (with hint_policy); Mastery 80→independent |
| [verify_ph2_task7.py](file:///e:/Ekaguru/struggle_agent/verify_ph2_task7.py) | Phase 2 Task 7 regression | Extended struggle scenarios |

### Reflection Agent (`reflection_agent/`)

| Script | What It Tests | Key Assertions |
|--------|--------------|----------------|
| [verify_reflection.py](file:///e:/Ekaguru/reflection_agent/verify_reflection.py) | **Spaced Repetition + Metacognition** (3 cases) | Low mastery→self_explanation + error_recall; High mastery→why_question + state=mastered; Mastered→teach_back task |
| [verify_ph2_task8.py](file:///e:/Ekaguru/reflection_agent/verify_ph2_task8.py) | Phase 2 Task 8 regression | Extended reflection scenarios |

### Transfer Agent (`transfer_agent/`)

| Script | What It Tests |
|--------|--------------|
| [verify_transfer.py](file:///e:/Ekaguru/transfer_agent/verify_transfer.py) | Near/far transfer testing |
| [verify_ph2_task9.py](file:///e:/Ekaguru/transfer_agent/verify_ph2_task9.py) | Phase 2 Task 9 regression |

### System-Wide

| Script | What It Tests | Key Assertions |
|--------|--------------|----------------|
| [verify_system_health.py](file:///e:/Ekaguru/scripts/verify_system_health.py) | **Full System Health Check** — 10 backends + 3 frontends | File existence + Python syntax validation for all services |
| [verify_full_loop.py](file:///e:/Ekaguru/system_integration/verify_full_loop.py) | **End-to-End Cognitive Loop** (mocked) | Diagnosis→Orchestrator→Teaching call sequence; misconception forwarded correctly; 3 total service calls |
| [verify_rag.py](file:///e:/Ekaguru/scripts/verify_rag.py) | RAG pipeline | Content retrieval from textbook embeddings |
| [verify_school_onboarding.py](file:///e:/Ekaguru/scripts/verify_school_onboarding.py) | School bulk upload | CSV student onboarding |
| [verify_ingestion_mock_db.py](file:///e:/Ekaguru/scripts/verify_ingestion_mock_db.py) | Content ingestion | PDF→vector pipeline |
| [verify_openshift.py](file:///e:/Ekaguru/scripts/verify_openshift.py) | OpenShift compatibility | Deployment manifest checks |

### Other

| Script | Location |
|--------|----------|
| [verify_avatar.py](file:///e:/Ekaguru/avatar_controller/verify_avatar.py) | Avatar emotion transitions |
| [verify_backend_analytics.py](file:///e:/Ekaguru/parent_dashboard/verify_backend_analytics.py) | Parent dashboard API |
| [verify_dashboard.py](file:///e:/Ekaguru/parent_dashboard/verify_dashboard.py) | Dashboard UI rendering |
| [verify_struggle_integration.py](file:///e:/Ekaguru/system_integration/verify_struggle_integration.py) | Struggle Agent ↔ Memory |

---

## 3. Recommended Verification Order

Run these in this order to validate the full system:

```
1. scripts/verify_system_health.py          # All files exist & syntax OK
2. memory_service/verify_production.py      # DB + locking + outbox
3. orchestrator_service/verify_orchestrator.py  # FSM decisions
4. diagnosis_agent/verify_diagnosis.py      # Misconception detection
5. teaching_agent/verify_teaching.py        # Pedagogy layers
6. struggle_agent/verify_struggle.py        # Adaptive difficulty
7. reflection_agent/verify_reflection.py    # Spaced repetition
8. system_integration/verify_full_loop.py   # End-to-end flow
9. universal/backend: npx ts-node src/verify_complete_uke.ts  # Full UKE suite
```

---

## 4. Notes

- All TypeScript scripts bypass NestJS DI by directly instantiating services with mock dependencies
- All Python scripts use FastAPI `TestClient` for in-process API testing (no server needed)
- `verify_schema.ts` requires Prisma to be configured (currently not set up)
- `verify_book_service.ts` uses mock VisionService — no real image AI
- `verify_full_loop.py` patches `httpx.AsyncClient.post` to mock all inter-service calls
