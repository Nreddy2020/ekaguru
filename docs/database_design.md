# Ekaguru: Database Design
## PostgreSQL (Source of Truth) + MongoDB (Events & Analytics)

**Last Updated**: January 2026  
**Status**: Production-Ready  
**Architect**: Cognition-Aware Data Modeling

---

## 1️⃣ DATABASE PHILOSOPHY (READ FIRST)

### Golden Rules (Non-Negotiable)

1. **PostgreSQL = Cognitive Truth**
   - Current mental state of a child
   - Deterministic, auditable, transactional

2. **MongoDB = Learning History & Insight**
   - What happened over time
   - Flexible, high-volume, analytics-friendly

3. **NO AGENT WRITES DIRECTLY TO DB**
   - All writes go through Memory Service
   - Prevents corruption & hallucination

---

## 2️⃣ POSTGRESQL SCHEMA (AUTHORITATIVE MEMORY)

**This is the brain of the system.**

### 2.1 students
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    parent_id UUID NOT NULL,
    name TEXT NOT NULL,
    age INT CHECK (age BETWEEN 3 AND 18),
    grade TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Why SQL?**
- Identity integrity
- Parental linkage
- Compliance audits

---

### 2.2 subjects
```sql
CREATE TABLE subjects (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);
```

---

### 2.3 concepts

Each atomic learnable idea.

```sql
CREATE TABLE concepts (
    id UUID PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id),
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 10)
);
```

---

### 2.4 student_concept_state (MOST IMPORTANT TABLE)

**This is the mental state snapshot.**

```sql
CREATE TABLE student_concept_state (
    student_id UUID REFERENCES students(id),
    concept_id UUID REFERENCES concepts(id),

    state TEXT CHECK (
        state IN ('unknown', 'partial', 'misconception', 'understood', 'mastered')
    ),

    mastery_score INT CHECK (mastery_score BETWEEN 0 AND 100),
    confidence_level TEXT CHECK (
        confidence_level IN ('low', 'medium', 'high')
    ),

    struggle_count INT DEFAULT 0,
    last_review TIMESTAMPTZ,
    next_review TIMESTAMPTZ,
    
    version INT NOT NULL DEFAULT 0,  -- For optimistic locking

    PRIMARY KEY (student_id, concept_id)
);
```

**🔥 Why this table matters**:
- One row = one mental model
- Deterministic
- Explainable
- Auditable
- Impossible in MongoDB alone without pain

---

### 2.5 misconceptions (controlled vocabulary)
```sql
CREATE TABLE misconceptions (
    id UUID PRIMARY KEY,
    concept_id UUID REFERENCES concepts(id),
    tag TEXT NOT NULL,
    description TEXT
);
```

---

### 2.6 student_misconceptions
```sql
CREATE TABLE student_misconceptions (
    student_id UUID,
    misconception_id UUID,
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved BOOLEAN DEFAULT false,

    PRIMARY KEY (student_id, misconception_id)
);
```

---

### 2.7 orchestrator_decisions (for explainability)
```sql
CREATE TABLE orchestrator_decisions (
    id UUID PRIMARY KEY,
    student_id UUID,
    concept_id UUID,
    from_state TEXT,
    to_state TEXT,
    chosen_agent TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Parents & auditors LOVE this table.**

---

### 2.8 outbox_events (transactional outbox pattern)
```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    event_type TEXT,
    payload JSONB,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 2.9 processed_requests (idempotency)
```sql
CREATE TABLE processed_requests (
    request_id UUID PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3️⃣ MONGODB SCHEMA (EVENTS & FLEXIBLE DATA)

**MongoDB is append-only, schema-flexible, high volume.**

### 3.1 learning_events (CORE COLLECTION)
```json
{
  "_id": ObjectId("..."),
  "student_id": "uuid",
  "concept_id": "uuid",
  "agent": "struggle-agent",
  "event_type": "attempt",
  "payload": {
    "answer": "1/4",
    "hint_level": 2,
    "response_time": 11.3
  },
  "timestamp": ISODate("2026-01-08T10:00:00Z")
}
```

**Used for**:
- Analytics
- Debugging
- Replay
- Model improvement (offline)

---

### 3.2 teaching_plans
```json
{
  "_id": ObjectId("..."),
  "concept_id": "uuid",
  "diagnosis": "misconception",
  "plan": [
    { "step": 1, "mode": "experience", "content": "Pizza sharing..." }
  ],
  "version": "v1",
  "created_at": ISODate()
}
```

---

### 3.3 reflection_responses
```json
{
  "_id": ObjectId("..."),
  "student_id": "uuid",
  "concept_id": "uuid",
  "response_text": "A fraction shows sharing...",
  "quality_score": 82,
  "timestamp": ISODate()
}
```

---

### 3.4 parent_reports (materialized views)
```json
{
  "_id": ObjectId("..."),
  "student_id": "uuid",
  "week": "2026-W02",
  "learning_health": {
    "understanding": "strong",
    "confidence": "improving",
    "fear": "low"
  }
}
```

**These are pre-computed for fast dashboards.**

---

## 4️⃣ DATA FLOW (VERY IMPORTANT)

```
Agent Output
   ↓
Memory Service
   ↓
PostgreSQL (state update)
   ↓
Outbox → MongoDB
```

**Never reverse this order.**

---

## 5️⃣ TRANSACTION STRATEGY (PRODUCTION SAFE)

### Pattern: Transactional Outbox

1. Update Postgres (transaction)
2. Write event record ID
3. Async worker writes full event to MongoDB

**This ensures**:
- No lost events
- No partial cognitive state
- Crash safety

---

## 6️⃣ INDEXING STRATEGY

### PostgreSQL
```sql
CREATE INDEX idx_student_concept
ON student_concept_state (student_id, concept_id);

CREATE INDEX idx_next_review
ON student_concept_state (next_review);

CREATE INDEX idx_outbox_unprocessed
ON outbox_events (processed, created_at)
WHERE processed = false;
```

### MongoDB
```javascript
db.learning_events.createIndex({ student_id: 1, timestamp: -1 })
db.learning_events.createIndex({ concept_id: 1 })
db.learning_events.createIndex({ timestamp: 1 }, { expireAfterSeconds: 31536000 }) // 1 year TTL
```

---

## 7️⃣ BACKUP & RECOVERY (MANDATORY)

### PostgreSQL
- Daily full backup
- PITR enabled (WAL archiving)
- RPO: ≤ 5 minutes
- RTO: ≤ 15 minutes

### MongoDB
- Daily snapshot
- Weekly retention
- RPO: ≤ 24 hours
- RTO: ≤ 1 hour

---

## 8️⃣ WHY THIS DESIGN IS WORLD-CLASS

✔ **Cognitive correctness** - Truth is deterministic  
✔ **Safe for children** - No data corruption  
✔ **Explainable to parents** - SQL queries for insights  
✔ **Auditable for schools** - Full decision history  
✔ **Scales technically** - Hybrid approach  
✔ **Evolves without migration hell** - MongoDB flexibility  

**This schema will not collapse at scale.**

---

## 9️⃣ MIGRATION PATH

### MVP → Production
- Single PostgreSQL → HA with replication
- Single MongoDB → Atlas or Operator
- Zero code changes required
- See `docs/database_migration_plan.md`

---

## 📚 References

- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/index.html)
- [MongoDB Schema Design](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)
- [Transactional Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
