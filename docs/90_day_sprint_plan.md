# Ekaguru: 90-Day Day-by-Day Sprint Plan
## Virtual Cognitive Tutor MVP - Execution-Grade Schedule

**Last Updated**: January 2026  
**Team Size**: 3-4 people  
**Daily Standup**: 9:00 AM  
**Sprint Reviews**: Every Friday

---

## 🟦 PHASE 1: FOUNDATION & BRAIN (Days 1-15)
**Goal**: Build the spine - memory + orchestrator + infrastructure

### Day 1 (Monday) - Planning & Setup
- [ ] **Morning**: Finalize MVP scope (Grades 4-7, Math + 1 Science topic)
- [ ] Freeze architecture (no changes after today)
- [ ] Create Git repo + branching strategy (main, develop, feature/*)
- [ ] Define coding standards (black, flake8, type hints)
- [ ] **Deliverable**: Architecture diagram, repo created

### Day 2 (Tuesday) - Infrastructure
- [ ] Setup monorepo structure (`/services`, `/frontend`, `/shared`, `/docs`)
- [ ] Setup Docker + Docker Compose
- [ ] Create base FastAPI template (with health check)
- [ ] Setup PostgreSQL + pgvector locally
- [ ] **Deliverable**: `docker-compose up` works

### Day 3 (Wednesday) - Database Schema (Part 1)
- [ ] Create DB schema: `students`, `subjects`, `topics`, `concepts`
- [ ] Write Alembic migration scripts
- [ ] Add seed data (sample subjects/topics)
- [ ] **Deliverable**: Database tables created

### Day 4 (Thursday) - Database Schema (Part 2)
- [ ] Implement `student_concept_state` table
- [ ] Implement `learning_events` table
- [ ] Test CRUD manually via Postman/curl
- [ ] **Deliverable**: Can store/retrieve student state

### Day 5 (Friday) - Memory Service APIs
- [ ] Build Memory Service APIs:
  - `GET /memory/student/{id}/topic/{topic_id}`
  - `POST /memory/concept/update`
  - `POST /memory/event`
- [ ] Unit tests for memory logic
- [ ] **Deliverable**: Memory service working
- [ ] **Sprint Review**: Demo memory service

---

### Day 6 (Monday) - Orchestrator FSM
- [ ] Implement Tutor Orchestrator FSM
- [ ] Define states (OBSERVE, DIAGNOSE, EXPLAIN, STRUGGLE, REFLECT, TRANSFER)
- [ ] Define transitions (hardcoded rules, no AI yet)
- [ ] **Deliverable**: FSM logic complete

### Day 7 (Tuesday) - Orchestrator Integration
- [ ] Integrate Orchestrator with Memory Service
- [ ] End-to-end dry run with fake student data
- [ ] Validate state transitions are correct
- [ ] **Deliverable**: Orchestrator makes decisions

### Day 8 (Wednesday) - Signal Handling
- [ ] Add confidence + fear signal handling
- [ ] Add struggle counter logic
- [ ] Implement logging + tracing (structured logs)
- [ ] **Deliverable**: Signals tracked correctly

### Day 9 (Thursday) - Error Handling
- [ ] Error handling & fallback paths
- [ ] Documentation for Orchestrator decisions
- [ ] Add health checks for all services
- [ ] **Deliverable**: Robust error handling

### Day 10 (Friday) - Internal Review
- [ ] Internal review day
- [ ] Fix design flaws identified
- [ ] Freeze Memory + Orchestrator APIs (no breaking changes)
- [ ] **Deliverable**: Stable foundation
- [ ] **Sprint Review**: Demo full orchestration

---

### Day 11 (Monday) - Content Preparation
- [ ] Load real textbook content (TXT/PDF)
- [ ] Extract fractions chapter
- [ ] Clean and structure content
- [ ] **Deliverable**: Textbook content ingested

### Day 12 (Tuesday) - Concept Ontology
- [ ] Create concept ontology (Math fractions)
- [ ] Map micro-concepts (meaning, comparison, operations)
- [ ] Define concept dependencies
- [ ] **Deliverable**: Concept hierarchy

### Day 13 (Wednesday) - Embeddings
- [ ] Add semantic embeddings (sentence-transformers)
- [ ] Store concept embeddings in pgvector
- [ ] Test similarity search
- [ ] **Deliverable**: RAG foundation ready

### Day 14 (Thursday) - Integration Testing
- [ ] Smoke test full "brain"
- [ ] Validate memory persistence across sessions
- [ ] Load testing (basic)
- [ ] **Deliverable**: System stable

### Day 15 (Friday) - Milestone 1
- [ ] ✅ **MILESTONE 1**: System knows what the child knows and what to do next
- [ ] Documentation update
- [ ] **Sprint Review**: Demo cognitive state tracking

---

## 🟩 PHASE 2: UNDERSTANDING ENGINE (Days 16-45)
**Goal**: Teach like a real teacher

### Day 16 (Monday) - Diagnosis Agent Start
- [ ] Implement Diagnosis Agent skeleton
- [ ] Define misconception registry (common errors)
- [ ] Setup API structure
- [ ] **Deliverable**: Diagnosis service scaffolded

### Day 17 (Tuesday) - Rule-Based Diagnosis
- [ ] Rule-based misconception detection
- [ ] Add silence & fear detection (response time)
- [ ] Test with sample wrong answers
- [ ] **Deliverable**: Basic diagnosis working

### Day 18 (Wednesday) - Semantic Diagnosis
- [ ] Semantic similarity scoring
- [ ] Threshold tuning (precision vs recall)
- [ ] Edge case handling
- [ ] **Deliverable**: Improved diagnosis accuracy

### Day 19 (Thursday) - Diagnosis Integration
- [ ] Integrate Diagnosis → Memory update
- [ ] Log learning events automatically
- [ ] Test end-to-end flow
- [ ] **Deliverable**: Diagnosis updates memory

### Day 20 (Friday) - Diagnosis Validation
- [ ] Diagnosis validation using 20+ sample answers
- [ ] Edge case handling (language errors vs concept errors)
- [ ] **Sprint Review**: Demo diagnosis accuracy

---

### Day 21 (Monday) - Milestone 2
- [ ] ✅ **MILESTONE 2**: System can explain why a child is wrong
- [ ] Regression testing
- [ ] **Deliverable**: Diagnosis agent complete

### Day 22 (Tuesday) - Teaching Agent Start
- [ ] Teaching Agent skeleton
- [ ] Define teaching layers (experience → intuition → language → symbol)
- [ ] Setup prompt templates
- [ ] **Deliverable**: Teaching structure defined

### Day 23 (Wednesday) - Experience & Intuition
- [ ] Implement experience & intuition generation
- [ ] Safe prompt templates (no hallucination)
- [ ] Test with fractions examples
- [ ] **Deliverable**: First two layers working

### Day 24 (Thursday) - Misconception Destruction
- [ ] Implement misconception destruction logic
- [ ] Counter-example generation (safe, gentle)
- [ ] Test with "denominator as size" misconception
- [ ] **Deliverable**: Wrong models destroyed safely

### Day 25 (Friday) - RAG Integration
- [ ] Integrate RAG from textbook chunks
- [ ] Prevent hallucination (strict grounding)
- [ ] Test retrieval accuracy
- [ ] **Sprint Review**: Demo teaching examples

---

### Day 26 (Monday) - Teaching Checkpoints
- [ ] Teaching checkpoints ("Explain in own words" logic)
- [ ] Comprehension check prompts
- [ ] **Deliverable**: Teaching validates understanding

### Day 27 (Tuesday) - Teaching Integration
- [ ] Teaching Agent ↔ Orchestrator integration
- [ ] Flow testing (Diagnosis → Teaching)
- [ ] **Deliverable**: Teaching triggered correctly

### Day 28 (Wednesday) - UX Wording
- [ ] UX wording review (child-friendly language)
- [ ] Remove academic jargon
- [ ] Test with 8-10 year olds (internal)
- [ ] **Deliverable**: Language appropriate

### Day 29 (Thursday) - Teaching Tests
- [ ] Teaching regression tests
- [ ] Fix over-explaining bugs
- [ ] Performance optimization
- [ ] **Deliverable**: Teaching stable

### Day 30 (Friday) - Milestone 3
- [ ] ✅ **MILESTONE 3**: Children say "Oh… I get it now"
- [ ] User testing (internal kids)
- [ ] **Sprint Review**: Demo teaching flow

---

### Day 31 (Monday) - Struggle Agent Start
- [ ] Guided Struggle Agent skeleton
- [ ] Define difficulty bands (worked example, guided, independent)
- [ ] **Deliverable**: Struggle structure defined

### Day 32 (Tuesday) - Task Generation
- [ ] Thinking-first task generator (no MCQs)
- [ ] Compare, predict, explain, what-if tasks
- [ ] **Deliverable**: Task templates created

### Day 33 (Wednesday) - Hint Engine
- [ ] Progressive hint engine (nudge → visual → explanation)
- [ ] Emotional-safe feedback
- [ ] **Deliverable**: Hints working

### Day 34 (Thursday) - Struggle Integration
- [ ] Integrate Struggle → Memory updates
- [ ] Retry logic (max 3 attempts)
- [ ] **Deliverable**: Struggle tracked

### Day 35 (Friday) - Struggle Tuning
- [ ] Tune struggle difficulty (prevent frustration)
- [ ] Test with different mastery levels
- [ ] **Sprint Review**: Demo adaptive difficulty

---

### Day 36 (Monday) - Reflection Agent Start
- [ ] Reflection Agent skeleton
- [ ] Self-explanation prompts
- [ ] **Deliverable**: Reflection structure

### Day 37 (Tuesday) - Spaced Repetition
- [ ] Spaced repetition scheduling
- [ ] Memory decay logic (Ebbinghaus curve)
- [ ] **Deliverable**: Review dates calculated

### Day 38 (Wednesday) - Illusion Detection
- [ ] Illusion-of-understanding detection
- [ ] Reflection → mastery update
- [ ] **Deliverable**: False confidence caught

### Day 39 (Thursday) - Transfer Agent Start
- [ ] Knowledge Transfer Agent skeleton
- [ ] Teach-back tasks
- [ ] **Deliverable**: Transfer structure

### Day 40 (Friday) - Transfer Logic
- [ ] Near & far transfer logic
- [ ] Creativity prompts
- [ ] **Sprint Review**: Demo reflection + transfer

---

### Day 41 (Monday) - Transfer Evaluation
- [ ] Transfer evaluation logic
- [ ] Mastery decision rules (transfer score → state)
- [ ] **Deliverable**: Mastery confirmed correctly

### Day 42 (Tuesday) - Full Loop Integration
- [ ] Full learning loop integration test
- [ ] Diagnosis → Teaching → Struggle → Reflection → Transfer → Mastery
- [ ] **Deliverable**: Complete flow works

### Day 43 (Wednesday) - Bug Fixing
- [ ] Bug fixing from integration testing
- [ ] Edge case handling
- [ ] **Deliverable**: Stable system

### Day 44 (Thursday) - Performance Tuning
- [ ] Performance tuning (response time < 2s)
- [ ] Database query optimization
- [ ] **Deliverable**: Fast responses

### Day 45 (Friday) - Milestone 4
- [ ] ✅ **MILESTONE 4**: Complete cognitive learning loop works
- [ ] End-to-end demo (full concept mastery)
- [ ] **Sprint Review**: Demo complete system

---

## 🟨 PHASE 3: TRUST & HUMAN LAYER (Days 46-70)
**Goal**: Parents trust it, kids feel safe

### Day 46 (Monday) - Dashboard Planning
- [ ] Parent dashboard wireframe
- [ ] Metric definitions (learning health, fear index)
- [ ] **Deliverable**: Dashboard design

### Day 47 (Tuesday) - Dashboard APIs (Part 1)
- [ ] Learning health API
- [ ] Subject summary API
- [ ] **Deliverable**: Backend APIs ready

### Day 48 (Wednesday) - Dashboard APIs (Part 2)
- [ ] Concept clarity map API
- [ ] Confidence & fear index logic
- [ ] **Deliverable**: Analytics APIs complete

### Day 49 (Thursday) - Explainability API
- [ ] Tutor decision explanation API
- [ ] Decision logging
- [ ] **Deliverable**: Transparency layer

### Day 50 (Friday) - Dashboard UI Start
- [ ] Parent dashboard UI (basic React components)
- [ ] **Sprint Review**: Demo dashboard APIs

---

### Day 51 (Monday) - Dashboard UX
- [ ] Dashboard UX cleanup
- [ ] Language simplification (no jargon)
- [ ] **Deliverable**: Parent-friendly UI

### Day 52 (Tuesday) - Avatar Controller
- [ ] Avatar controller service
- [ ] Emotion mapping (orchestrator signal → avatar emotion)
- [ ] **Deliverable**: Avatar logic ready

### Day 53 (Wednesday) - Voice Integration
- [ ] Browser TTS integration (Web Speech API)
- [ ] Voice tone control (rate, pitch)
- [ ] **Deliverable**: Voice working

### Day 54 (Thursday) - Parent Controls
- [ ] Parent controls (voice on/off, avatar persona)
- [ ] Safety toggles
- [ ] **Deliverable**: Customization ready

### Day 55 (Friday) - Safety Features
- [ ] Session timeout + break reminders
- [ ] Screen time limits
- [ ] **Sprint Review**: Demo parent dashboard + avatar

---

### Day 56-58 (Mon-Wed) - UX Testing
- [ ] End-to-end UX testing with kids (internal)
- [ ] Tone adjustments based on feedback
- [ ] Iteration on voice/avatar
- [ ] **Deliverable**: Child-tested UX

### Day 59-60 (Thu-Fri) - Privacy Review
- [ ] Privacy review (COPPA compliance)
- [ ] Data deletion workflows
- [ ] Parent consent flows
- [ ] **Sprint Review**: Demo safety features

---

### Day 61-65 (Mon-Fri) - Stabilization Week
- [ ] Performance stabilization
- [ ] Logging & monitoring (Prometheus/Grafana)
- [ ] Error tracking (Sentry)
- [ ] Load testing (1000 concurrent users)
- [ ] **Deliverable**: Production-ready system

### Day 66-70 (Mon-Fri) - Final Polish
- [ ] ✅ **MILESTONE 5**: Parent-ready, child-safe product
- [ ] Final bug fixes
- [ ] Documentation complete
- [ ] Deployment scripts
- [ ] **Sprint Review**: Full system demo

---

## 🟥 PHASE 4: PILOT & LAUNCH (Days 71-90)
**Goal**: Real users, real validation

### Day 71 (Monday) - Pilot Preparation
- [ ] Pilot onboarding flow
- [ ] Feedback forms (in-app + email)
- [ ] Support channel setup (WhatsApp group)
- [ ] **Deliverable**: Pilot infrastructure ready

### Day 72 (Tuesday) - Curriculum Finalization
- [ ] Create pilot curriculum (Fractions + Photosynthesis)
- [ ] Content review
- [ ] **Deliverable**: Pilot content ready

### Day 73 (Wednesday) - First Onboarding
- [ ] Onboard first 10 pilot families
- [ ] Onboarding calls (30 min each)
- [ ] **Deliverable**: 10 families active

### Day 74-76 (Thu-Sat) - Observation
- [ ] Observe sessions (screen recordings with permission)
- [ ] Capture confusion points
- [ ] Daily feedback collection
- [ ] **Deliverable**: Feedback log

### Day 77 (Monday) - Quick Fixes
- [ ] Quick fixes from pilot feedback
- [ ] UX improvements
- [ ] **Deliverable**: Iteration 1 deployed

### Day 78-80 (Tue-Thu) - Scale Pilot
- [ ] Onboard next 20-30 families
- [ ] Continue monitoring
- [ ] **Deliverable**: 30-40 families total

---

### Day 81 (Friday) - Parent Interviews
- [ ] Parent interviews (10-15 families)
- [ ] Test willingness to pay
- [ ] Collect testimonials
- [ ] **Sprint Review**: Pilot results

### Day 82-85 (Mon-Thu) - Stabilization
- [ ] Stabilize system based on pilot load
- [ ] Fix learning blockers
- [ ] Performance optimization
- [ ] **Deliverable**: Stable at scale

### Day 86 (Friday) - Feature Freeze
- [ ] Freeze MVP features (no new features)
- [ ] Final regression testing
- [ ] **Deliverable**: Launch candidate

### Day 87 (Monday) - Pricing Test
- [ ] Pricing test (soft launch to pilot users)
- [ ] Conversion tracking
- [ ] **Deliverable**: Pricing validated

### Day 88 (Tuesday) - Launch Readiness
- [ ] Launch readiness checklist
- [ ] Marketing materials ready
- [ ] Support team trained
- [ ] **Deliverable**: Go/no-go decision

### Day 89 (Wednesday) - Soft Launch
- [ ] Go-live (limited public access)
- [ ] Monitor closely
- [ ] **Deliverable**: Live system

### Day 90 (Thursday) - MVP LAUNCH 🎉
- [ ] ✅ **MVP LAUNCH**: Virtual Cognitive Tutor is live
- [ ] Celebrate with team
- [ ] Plan next 90 days
- [ ] **Deliverable**: Real cognitive tutor, not a prototype

---

## ✅ FINAL DELIVERABLE AT DAY 90

- ✅ One full subject end-to-end (Fractions + Photosynthesis)
- ✅ Real parent trust (NPS > 40)
- ✅ Kids thinking independently (transfer success > 60%)
- ✅ Clear retention signals (60%+ weekly active)
- ✅ Strong differentiation (category-defining)
- ✅ 30-50 paying customers (pilot → paid conversion)

---

## 📊 Daily Standup Format

**Every morning at 9:00 AM**:
1. What did you complete yesterday?
2. What will you complete today?
3. Any blockers?

**Duration**: 15 minutes max

---

## 📅 Sprint Review Format

**Every Friday at 4:00 PM**:
1. Demo what was built this week
2. Review metrics (if applicable)
3. Retrospective (what went well, what to improve)
4. Plan next week

**Duration**: 1 hour

---

## 🚨 Risk Management

**If you fall behind**:
- Cut scope, not quality
- Focus on core learning loop
- Defer dashboard polish
- Simplify avatar (static images OK)

**If you're ahead**:
- Add more test coverage
- Improve documentation
- Start next phase early

---

**Remember**: This is a marathon, not a sprint. Pace yourself. Ship quality, not features.

**Next Step**: Start Day 1 tomorrow morning. Set up the repo.
