# Ekaguru: 90-Day MVP Build Checklist
## From Zero → Pilot → Paid Users

**Last Updated**: January 2026  
**Status**: Ready for Execution

---

## 🔑 RULES FOR MVP (READ THIS FIRST)

### MVP ≠ Small Vision
### MVP = Small but complete learning loop

### ✅ MUST HAVE
- One full concept end-to-end (e.g., Fractions)
- Complete flow: Diagnosis → Teaching → Struggle → Reflection → Transfer
- Parent dashboard (basic)
- Safe, explainable behavior
- Working demo for pilot families

### ❌ MUST NOT HAVE
- Gamification / badges
- Exams / test prep
- Too many subjects (focus on Math + 1 Science topic)
- Fancy 3D avatar
- Social features
- Live chat with other students

---

## 📅 PHASE 1: FOUNDATION (Days 1-15)
**Goal**: Build the "brain & spine"

### ✅ Week 1: Repo, Infrastructure, Data (Days 1-7)

#### Engineering Setup
- [ ] Monorepo setup (e.g., `ekaguru-monorepo`)
  ```
  /services
    /memory_service
    /orchestrator_service
    /diagnosis_agent
    /teaching_agent
    /struggle_agent
    /reflection_agent
    /transfer_agent
    /parent_dashboard
  /frontend
  /shared
  /docs
  ```
- [ ] Docker base images (Python 3.11, Node 20)
- [ ] Docker Compose for local dev
- [ ] PostgreSQL + pgvector setup
- [ ] Basic auth (JWT for parents + children)
- [ ] Environment variable management (.env)
- [ ] Git workflow (main, develop, feature branches)

#### Database Schema
- [ ] `students` table
- [ ] `subjects`, `topics`, `concepts` tables
- [ ] `student_concept_state` table
- [ ] `learning_events` table
- [ ] `misconceptions` table
- [ ] Database migrations setup (Alembic)

#### DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Linting (black, flake8, eslint)
- [ ] Testing framework (pytest, jest)

**🎯 Output**: System can store and retrieve cognitive state.

**Verification**: 
```bash
# Can create student, store concept state, retrieve it
curl -X POST http://localhost:8000/memory/student
curl -X GET http://localhost:8000/memory/student/{id}/topic/{topic_id}
```

---

### ✅ Week 2: Knowledge Memory + Orchestrator (Days 8-15)

#### Build
- [ ] Memory Service APIs
  - `POST /memory/concept/update`
  - `GET /memory/student/{id}/topic/{topic_id}`
  - `POST /memory/event`
- [ ] Tutor Orchestrator FSM
  - State definitions (OBSERVE, DIAGNOSE, EXPLAIN, etc.)
  - Transition logic
  - `POST /orchestrate` endpoint
- [ ] Deterministic routing logic
- [ ] Event logging (all decisions tracked)

#### Test
- [ ] Unit tests for FSM transitions
- [ ] Integration test: Memory ↔ Orchestrator
- [ ] Manual test with fake student data
- [ ] Verify state transitions are correct

**🎯 Output**: System decides what to do next correctly.

**Verification**:
```python
# Test orchestrator decision
signal = {"mastery_score": 30, "state": "misconception"}
response = orchestrator.decide(signal)
assert response["next_agent"] == "teaching-agent"
```

---

## 📅 PHASE 2: LEARNING INTELLIGENCE (Days 16-45)
**Goal**: Make the tutor actually teach

### ✅ Week 3: Diagnosis Agent (Days 16-22)

#### Build
- [ ] Rule-based misconception detection
  - Common misconceptions database (fractions, decimals)
  - Pattern matching in student answers
- [ ] Semantic similarity (embeddings)
  - Sentence transformers
  - Cosine similarity for answer matching
- [ ] Confidence & fear signals
  - Response time analysis
  - Hesitation detection
- [ ] Diagnosis → Memory update integration
- [ ] `POST /diagnose` endpoint

#### Test
- [ ] Test known misconceptions (e.g., "1/4 > 1/2")
- [ ] Test fear detection (long pauses)
- [ ] Verify memory updates after diagnosis

**🎯 Output**: System can say WHY a student is wrong.

**Verification**:
```
Input: "1/4 is bigger because 4 is bigger"
Output: {
  "diagnosis": "misconception",
  "misconception_tags": ["denominator_as_size"],
  "confidence_level": "low"
}
```

---

### ✅ Week 4: Teaching Agent (Days 23-29) **MOST IMPORTANT**

#### Build
- [ ] Micro-concept breakdown
  - Fractions: meaning → comparison → operations
- [ ] Experience → Intuition → Explanation flow
  - Pizza/chocolate examples
  - Visual representations
  - Language before symbols
- [ ] RAG from textbook
  - Textbook ingestion (PDF → chunks)
  - Vector search for relevant content
- [ ] Misconception destruction logic
  - Safe counter-examples
  - Rebuild mental model
- [ ] `POST /teach` endpoint

#### Test
- [ ] Test with "denominator as size" misconception
- [ ] Verify teaching plan has correct layers
- [ ] User testing: "Ohhh... now I get it" moment

**🎯 Output**: Students say "Ohhh… now I get it."

**Verification**:
```
Input: misconception_tags = ["denominator_as_size"]
Output: Teaching plan with:
  - Experience: Pizza sharing example
  - Intuition: "More pieces = smaller each"
  - Language: "Denominator = how many share"
```

---

### ✅ Week 5: Guided Struggle Agent (Days 30-36)

#### Build
- [ ] Adaptive difficulty logic
  - Mastery < 40: Worked example
  - 40-70: Guided practice
  - 70+: Independent
- [ ] Thinking-first tasks
  - Compare, predict, explain, what-if
- [ ] Progressive hint engine
  - Nudge → Visual → Partial explanation
- [ ] Emotional-safe feedback
  - Encouraging tone
  - No judgment
- [ ] `POST /struggle` endpoint

#### Test
- [ ] Test difficulty adaptation
- [ ] Test hint progression
- [ ] Verify no fear-inducing language

**🎯 Output**: Students struggle without fear.

---

## 📅 PHASE 3: MEMORY & WISDOM (Days 37-57)
**Goal**: Make learning stick

### ✅ Week 6: Reflection Agent (Days 37-43)

#### Build
- [ ] Self-explanation prompts
  - "Explain in your own words"
- [ ] Error reflection
  - "What was confusing earlier?"
- [ ] Illusion-of-understanding detection
  - High confidence + poor explanation
- [ ] Spaced repetition scheduling
  - Next review calculation
- [ ] `POST /reflect` endpoint

#### Test
- [ ] Test spaced repetition intervals
- [ ] Test illusion detection
- [ ] Verify memory state updates

**🎯 Output**: Knowledge persists beyond the session.

---

### ✅ Week 7: Knowledge Transfer Agent (Days 44-50)

#### Build
- [ ] Teach-back tasks
  - "Teach this to a friend"
- [ ] Near transfer
  - Same concept, different numbers
- [ ] Far transfer
  - Different domain, same principle
- [ ] Creative application
  - "Create your own problem"
- [ ] Mastery decision logic
  - Transfer score → state update
- [ ] `POST /transfer` endpoint

#### Test
- [ ] Test all transfer types
- [ ] Verify mastery decision
- [ ] User testing: Can student apply?

**🎯 Output**: Student can apply concept in new situations.

---

## 📅 PHASE 4: HUMAN & TRUST LAYER (Days 51-71)
**Goal**: Make parents trust it

### ✅ Week 8: Parent Dashboard MVP (Days 51-57)

#### Build
- [ ] Learning health summary
  - Understanding, confidence, fear, retention
- [ ] Subject progress bars
  - Mastery percentages
- [ ] Concept clarity map
  - Hierarchical tree view
- [ ] Confidence & fear index
  - Signals detected, insights
- [ ] Tutor decision explanations
  - "Why teaching vs struggle"
- [ ] `GET /parent/dashboard/{student_id}` endpoint

#### Frontend
- [ ] React dashboard components
- [ ] Recharts for visualizations
- [ ] Mobile-responsive design
- [ ] Parent authentication

**🎯 Output**: Parent understands progress in 2 minutes.

---

### ✅ Week 9: Avatar + Voice (Simple) (Days 58-64)

#### Build
- [ ] 2D avatar (static expressions)
  - 6 emotion states (calm, encouraging, etc.)
  - CSS transitions
- [ ] Browser TTS (Web Speech API)
  - Voice selection
  - Rate/pitch control
- [ ] Emotion mapping from orchestrator
  - Orchestrator signal → Avatar emotion
- [ ] Parent controls
  - Enable/disable voice
  - Choose persona
- [ ] Avatar Controller service

#### Test
- [ ] Test emotion transitions
- [ ] Test voice quality
- [ ] User testing: Does it feel safe?

**🎯 Output**: Child feels safe, not judged.

---

### ✅ Week 10: Integration & Polish (Days 65-71)

#### Build
- [ ] End-to-end integration
  - All services working together
  - `learning_flow.py` coordinator
- [ ] Error handling & logging
- [ ] Performance optimization
- [ ] Security audit (basic)
- [ ] Onboarding flow
  - Parent signup
  - Child profile creation
  - Subject selection

#### Test
- [ ] Full learning loop test (Diagnosis → Mastery)
- [ ] Load testing (100 concurrent users)
- [ ] Security testing (SQL injection, XSS)

---

## 📅 PHASE 5: PILOT & LAUNCH (Days 72-90)
**Goal**: Real users, real feedback

### ✅ Week 11: Pilot Preparation (Days 72-78)

#### Prep
- [ ] Onboarding flow finalization
- [ ] Feedback capture mechanism
  - In-app surveys
  - Weekly parent calls
- [ ] Support channel setup
  - WhatsApp group
  - Email support
- [ ] Analytics instrumentation
  - Mixpanel/Amplitude
  - Custom events tracking
- [ ] Content preparation
  - Fractions (complete)
  - 1 Science topic (Photosynthesis)

#### Recruitment
- [ ] Recruit 25-50 pilot families
  - Parent groups
  - School partnerships
  - Referrals
- [ ] Schedule onboarding calls
- [ ] Create pilot WhatsApp group

---

### ✅ Week 12-13: Pilot Launch (Days 79-90)

#### Launch
- [ ] Onboard first 10 families (Day 79-80)
- [ ] Daily monitoring & bug fixes
- [ ] Collect initial feedback
- [ ] Iterate on UX/voice tone

#### Week 2 of Pilot
- [ ] Onboard remaining families
- [ ] Weekly feedback calls
- [ ] Document common issues
- [ ] Collect testimonials

#### Analysis
- [ ] Analyze fear index trends
- [ ] Measure retention (7-day, 14-day)
- [ ] Parent satisfaction survey
- [ ] Identify top 3 improvements

**🎯 Success Criteria**:
- ✅ Fear ↓ (30%+ reduction)
- ✅ Confidence ↑ (visible in dashboard)
- ✅ Parents say "I finally understand my child"
- ✅ 60%+ weekly active users
- ✅ 3+ strong testimonials

---

## 📊 MVP SUCCESS METRICS (TRACK ONLY THESE)

### Learning Metrics
- **Fear Index Reduction**: 30%+ in 30 days
- **Concept Mastery**: 70%+ concepts understood/mastered
- **Transfer Success**: 60%+ pass transfer tasks

### Business Metrics
- **30-Day Retention**: 60%+
- **Parent Engagement**: 3+ dashboard views/week
- **Willingness to Pay**: 50%+ say "yes" in survey

### Trust Metrics
- **Parent Satisfaction**: NPS > 40
- **Support Tickets**: < 10% of users
- **Data Concerns**: < 5% deletion requests

---

## 🚫 MVP ANTI-GOALS (VERY IMPORTANT)

**If you add these, MVP will fail**:
- ❌ Exams & marks
- ❌ Gamification addiction (streaks, badges)
- ❌ Too many subjects (stick to Math + 1 Science)
- ❌ "AI magic" marketing
- ❌ Feature bloat
- ❌ Fancy animations
- ❌ Social features

**Focus**: One concept, done perfectly.

---

## 🧠 TEAM COMPOSITION (LEAN)

| Role | Count | Responsibilities |
|------|-------|------------------|
| Backend/AI Engineer | 1-2 | Services, agents, ML |
| Frontend Engineer | 1 | Dashboard, student UI |
| Product/Pedagogy | 1 | Content, UX, testing |
| Designer (part-time) | 0.5 | Avatar, UI design |

**Total**: 3.5 people

---

## 🛠️ TECH STACK (CONFIRMED)

### Backend
- Python 3.11
- FastAPI
- PostgreSQL + pgvector
- Docker + Docker Compose

### Frontend
- React + TypeScript
- Recharts (visualizations)
- TailwindCSS (styling)

### AI/ML
- Sentence Transformers (embeddings)
- OpenAI API (controlled, RAG-only)
- Textbook RAG (vector search)

### DevOps
- GitHub Actions (CI/CD)
- Docker (containerization)
- AWS/GCP (hosting - Phase 2)

---

## 📋 WEEKLY CHECKPOINTS

### Week 1 Checkpoint
- [ ] Can store/retrieve student data
- [ ] Database schema complete
- [ ] Local dev environment working

### Week 2 Checkpoint
- [ ] Orchestrator makes correct decisions
- [ ] Memory service integrated
- [ ] State transitions verified

### Week 4 Checkpoint (Critical)
- [ ] Teaching agent produces "aha" moments
- [ ] Misconception destruction works
- [ ] RAG retrieves relevant content

### Week 8 Checkpoint
- [ ] Parent dashboard shows insights
- [ ] All agents integrated
- [ ] End-to-end flow works

### Week 12 Checkpoint (Launch)
- [ ] 25+ pilot families onboarded
- [ ] Fear reduction visible
- [ ] Testimonials collected

---

## 🏁 WHAT YOU HAVE NOW

You now possess:
- ✅ A complete cognitive architecture (8 services built)
- ✅ A 90-day execution plan (week-by-week tasks)
- ✅ A real MVP scope (focused, achievable)
- ✅ A launch-ready product vision

**This is founder-grade clarity.**

**Next Step**: Start Week 1, Day 1. Set up the monorepo.

---

## 📞 SUPPORT & RESOURCES

### Documentation
- PRD: `docs/PRD.md`
- Architecture: `docs/architecture.md`
- Commercialization: `docs/commercialization_strategy.md`

### Code
- All services: `e:\Ekaguru\`
- Demos: `e:\Ekaguru\demos\`
- Verification scripts: `verify_*.py` in each service

### Community
- Internal team Slack/Discord
- Weekly standups
- Daily async updates

---

**Remember**: MVP is not about perfection. It's about learning fast.

**Ship early. Learn fast. Iterate quickly.**
