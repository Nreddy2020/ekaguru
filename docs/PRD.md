# Product Requirement Document (PRD)
## Ekaguru: Virtual Cognitive Tutor
### "Learning Like a Scientist"

**Version**: 1.0  
**Date**: January 2026  
**Status**: Production-Ready

---

## 1. Product Overview

### Product Name
**Ekaguru** (Sanskrit: एकगुरु - "One Teacher")

### One-Line Vision
A virtual tutor that teaches children how to think, not what to memorize — inspired by how great teachers and scientists learn.

### Problem Statement

**Children**:
- Memorize without understanding
- Fear math and science
- Cannot apply knowledge in new contexts
- Lose confidence early

**Parents**:
- Don't know what the child doesn't understand
- Don't trust black-box AI tools
- Are tired of tuition with no clarity
- Want real understanding, not just marks

### Solution
A human-centered AI tutor that:
- ✅ Diagnoses misconceptions (not just wrong answers)
- ✅ Rebuilds concepts from first principles (Experience → Symbol)
- ✅ Uses guided struggle, reflection, and transfer
- ✅ Tracks confidence and fear levels
- ✅ Explains all decisions to parents

---

## 2. Target Users

### Primary Users
**Children (Grades 3-10)**:
- Students afraid of math/science
- Students who "score but don't understand"
- Students with learning gaps from previous grades

### Primary Customers
**Parents** (middle & upper-middle income):
- Decision makers
- Pay for subscriptions
- Monitor progress via dashboard

### Secondary Customers
**Schools & Coaching Institutes**:
- Bulk licensing
- Class-level analytics
- Teacher dashboards

---

## 3. Key Product Principles (Non-Negotiable)

1. **Learning science first, AI second**
2. **No rote memorization**
3. **Confusion is allowed and encouraged**
4. **Struggle must be guided, never punished**
5. **Explainable AI for parents**
6. **Child safety and emotional well-being**
7. **No manipulation or dependency loops**

---

## 4. Core User Journeys

### 4.1 Student Journey (Single Concept)
```
Observe → Diagnose → Teach → Struggle → Reflect → Transfer → Mastery
```

**Outcome**:
- Concept understood (not memorized)
- Fear reduced
- Confidence increased
- Long-term memory created

### 4.2 Parent Journey
```
Onboard Child → Select Subjects → Monitor Dashboard → 
Understand Progress → Receive Weekly Insights → Adjust Settings
```

**Outcome**:
- Visibility into child's understanding
- Trust in the system
- Actionable guidance

---

## 5. Functional Requirements

### 5.1 Learning Engine (Core)

#### 5.1.1 Knowledge Memory System
**Purpose**: Store and track cognitive state

**Data Model**:
- `concept_id`: Unique identifier
- `state`: unknown, partial, misconception, understood, mastered
- `mastery_score`: 0-100
- `confidence_level`: low, medium, high
- `struggle_count`: Number of attempts
- `misconception_tags`: Specific errors
- `next_review`: Spaced repetition date

**Acceptance Criteria**:
- ✅ System can explain why a child is weak in a concept
- ✅ No marks or exam-style scoring exposed to child
- ✅ Data persists across sessions

#### 5.1.2 Tutor Orchestrator (FSM)
**Purpose**: Decide next pedagogical action

**States**:
- OBSERVE
- DIAGNOSE
- EXPLAIN (Teaching Agent)
- STRUGGLE (Practice Agent)
- REFLECT (Memory Agent)
- TRANSFER (Application Agent)

**Acceptance Criteria**:
- ✅ Decisions are deterministic and explainable
- ✅ No random jumps in difficulty
- ✅ Parent can see decision reasoning

#### 5.1.3 Diagnosis Agent
**Purpose**: Detect what child doesn't understand and why

**Detection Layers**:
1. **Rule-based**: Known misconceptions (e.g., "denominator as size")
2. **Semantic**: Pattern matching in answers
3. **LLM**: Controlled reasoning (RAG-only)

**Acceptance Criteria**:
- ✅ Correctly identifies common misconceptions
- ✅ Separates language weakness from concept weakness
- ✅ Detects fear signals (long pauses, avoidance)

#### 5.1.4 Teaching Agent (Concept Reconstruction)
**Purpose**: Rebuild mental models from first principles

**Teaching Layers** (in order):
1. Experience (concrete examples)
2. Intuition (questioning)
3. Story (narrative)
4. Visual (diagrams)
5. Language (terminology)
6. Symbol (formulas - last)

**Acceptance Criteria**:
- ✅ No formulas before intuition
- ✅ Child can explain concept in own words
- ✅ Wrong mental models destroyed safely

#### 5.1.5 Guided Struggle Agent
**Purpose**: Build intelligence through productive struggle

**Difficulty Levels**:
- **Worked Example** (I Do): Mastery < 40
- **Guided Practice** (We Do): Mastery 40-70
- **Independent** (You Do): Mastery > 70

**Acceptance Criteria**:
- ✅ Struggle never causes fear
- ✅ Difficulty adapts dynamically
- ✅ Progressive hints available

#### 5.1.6 Reflection & Memory Agent
**Purpose**: Convert short-term clarity → long-term memory

**Reflection Tasks**:
- Self-explanation
- Error reflection
- Why-questions
- Teach-back

**Spaced Repetition**:
- Introduced: +1 day
- Partial: +2 days
- Understood: +7 days
- Mastered: +21 days

**Acceptance Criteria**:
- ✅ Knowledge persists across sessions
- ✅ Illusion of understanding is detected
- ✅ Review schedule adapts to performance

#### 5.1.7 Knowledge Transfer Agent
**Purpose**: Test true understanding through application

**Transfer Types**:
- **Teach-back**: Explain to someone else
- **Near Transfer**: Same concept, different numbers
- **Far Transfer**: Different domain, same principle
- **Creative**: Create own problem

**Acceptance Criteria**:
- ✅ Concept marked "mastered" only after transfer
- ✅ Child can apply concept in new domains
- ✅ Transfer quality evaluated (not graded)

---

### 5.2 Avatar & Voice Requirements

#### Avatar
**Personas**:
- 👩‍👧 Mother-like (emotional safety)
- 👨‍👦 Father-like (confidence)
- 🧑‍🏫 Guru/Mentor (wisdom)
- 👩‍🔬 Scientist (curiosity)

**Emotion States**:
- Calm (default)
- Encouraging (wrong answer)
- Curious (observation)
- Proud (breakthrough)
- Gentle (fear detected)

**Acceptance Criteria**:
- ✅ Avatar reacts to learning state, not correctness
- ✅ No manipulation or dependency
- ✅ Parent can choose persona

#### Voice
**Principles**:
- Slightly slower than normal (0.9x)
- Warm, neutral accent
- Pauses after questions
- Emotion-aware modulation

**Acceptance Criteria**:
- ✅ Voice reduces hesitation
- ✅ Multi-language support (Phase 2)
- ✅ Parent can disable voice

---

### 5.3 Parent Dashboard Requirements

#### Sections
1. **Learning Health Summary**
   - Understanding: strong/improving/needs_attention
   - Confidence: high/improving/low
   - Fear: low/medium/high
   - Retention: excellent/good/needs_work

2. **Subject-wise Understanding**
   - Mastery percentage
   - Concept breakdown (clear/improving/not_taught)

3. **Concept Clarity Map**
   - Hierarchical tree view
   - Visual status indicators

4. **Confidence & Fear Index**
   - Signals detected (long_pause, avoidance)
   - Parent insights

5. **Tutor Decision Explanations**
   - Why teaching vs struggle
   - Reasoning transparency

6. **Parent Guidance**
   - Weekly tips
   - How to support at home

7. **Privacy Controls**
   - View all interactions
   - Delete data
   - Pause sessions

**Acceptance Criteria**:
- ✅ Parents understand progress in < 2 minutes
- ✅ No raw AI or technical jargon
- ✅ Mobile-responsive design

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Response time < 2 seconds
- Session continuity guaranteed
- 99.9% uptime

### 6.2 Scalability
- Microservice-based architecture
- Stateless agents
- Horizontal scaling
- Support 100K+ concurrent users

### 6.3 Security & Privacy
- Encrypted data at rest and in transit
- Parent-controlled data deletion
- No training on child data
- COPPA / GDPR-ready
- No third-party data sharing

### 6.4 Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation

---

## 7. MVP Scope (First Release)

### ✅ Included
- Grades 4-7
- Math + Science (core concepts)
- Core agents (Diagnosis → Transfer)
- Parent dashboard
- Avatar + voice (basic)
- Web application (desktop + mobile)

### ❌ Excluded (Phase 2+)
- Exams / test prep
- Gamification / badges
- Social features
- Ads
- AR/VR
- Live tutors

---

## 8. Success Metrics

### Learning Metrics
- **Fear Index Reduction**: 30%+ reduction in 30 days
- **Concept Mastery**: 70%+ concepts understood/mastered
- **Transfer Success**: 60%+ pass transfer tasks

### Business Metrics
- **3-Month Retention**: 70%+
- **Parent Engagement**: 3+ dashboard views/week
- **Referral Rate**: 20%+

### Trust Metrics
- **Parent Satisfaction**: NPS > 50
- **Data Deletion Requests**: < 5%
- **Support Tickets**: < 10% of users

---

## 9. Technical Architecture

### System Components
1. **Knowledge Memory Service** (PostgreSQL)
2. **Tutor Orchestrator** (FSM)
3. **Diagnosis Agent** (Rules + NLP + LLM)
4. **Teaching Agent** (Layered pedagogy)
5. **Struggle Agent** (Adaptive difficulty)
6. **Reflection Agent** (Spaced repetition)
7. **Transfer Agent** (Application testing)
8. **Parent Dashboard** (Analytics)
9. **Avatar Controller** (Emotion + voice)

### Tech Stack
- **Backend**: Python, FastAPI
- **Database**: PostgreSQL
- **Frontend**: React, TypeScript
- **Voice**: Web Speech API / Neural TTS
- **Deployment**: Docker, Kubernetes
- **Monitoring**: Prometheus, Grafana

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-complex AI | High | Rule + FSM control, no free-form generation |
| Child dependency | Medium | Encourage breaks, time limits |
| Parent mistrust | High | Explainable dashboard, transparency |
| LLM hallucination | High | RAG-only, no creative generation |
| High churn | High | Weekly insights, visible progress |

---

## 11. Roadmap (High Level)

### Phase 1: MVP (0-3 months)
- [ ] Build all 8 core services
- [ ] Closed pilot (100 families)
- [ ] Iterate based on feedback
- [ ] **Goal**: Prove fear reduction + clarity

### Phase 2: Beta (3-6 months)
- [ ] Multi-language support (Hindi)
- [ ] School pilots (5-10 schools)
- [ ] Advanced analytics
- [ ] **Goal**: 1,000 paying users

### Phase 3: Scale (6-12 months)
- [ ] Curriculum expansion (Grades 3-10)
- [ ] Government/NGO pilots
- [ ] Teacher training programs
- [ ] **Goal**: 10,000+ users, school partnerships

---

## 12. Product Differentiation (Moat)

1. **Cognitive-science-driven design** (not content-first)
2. **Multi-agent learning intelligence** (hard to replicate)
3. **Fear & confidence tracking** (unique in market)
4. **Explainable AI for parents** (trust advantage)
5. **Pedagogy moat** (requires educator + engineer collaboration)

---

## 13. Compliance & Safety

### Child Safety
- No personal data collection beyond learning
- No chat with other users
- No external links
- Content moderation
- Age-appropriate language

### Data Privacy
- COPPA compliant (US)
- GDPR compliant (EU)
- Data localization (India)
- Parent consent required
- Right to deletion

### Ethical AI
- No manipulation tactics
- No addiction mechanics
- Transparent decision-making
- Human oversight

---

## 14. Open Questions & Decisions Needed

- [ ] Final product name (Ekaguru vs alternatives)
- [ ] Pricing finalization (₹499 vs ₹999)
- [ ] LLM provider (OpenAI vs Anthropic vs Google)
- [ ] Voice provider (Web Speech vs ElevenLabs)
- [ ] Curriculum source (NCERT vs CBSE vs custom)

---

## 15. Appendix

### A. Glossary
- **Misconception**: Wrong mental model (not just wrong answer)
- **Transfer**: Applying knowledge in new context
- **Spaced Repetition**: Reviewing at optimal intervals
- **FSM**: Finite State Machine (decision engine)

### B. References
- Cognitive Load Theory (Sweller)
- Productive Struggle (Hiebert & Grouws)
- Spaced Repetition (Ebbinghaus)
- Transfer of Learning (Perkins & Salomon)

---

## Final Note

**This product is not a chatbot, not a content platform, and not a quiz app.**

**It is a Digital Guru System** — designed to help children think, struggle, reflect, and grow safely.

**The goal is not to replace teachers, but to give every child access to world-class pedagogy.**

---

**Prepared by**: Ekaguru Product Team  
**For**: Engineering, Investors, School Partnerships, Internal Alignment
