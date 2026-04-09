# Ekaguru Cognitive Tutor - End-to-End Demos

This directory contains complete demonstrations of the cognitive learning flow.

## Available Demos

### Demo A: Math (Fractions)
**File**: `demo_fractions.py`

**Scenario**: 10-year-old student with misconception about fraction comparison

**Learning Flow**:
1. Diagnosis → Detects "denominator as size" misconception
2. Teaching → Rebuilds concept using pizza analogy
3. Struggle → Guided practice with hints
4. Reflection → Self-explanation
5. Transfer → Application to new domain (teams qualifying)

**Result**: Mastery achieved, fear reduced, true understanding confirmed

---

## Running the Demos

### Prerequisites

All 8 services must be running:

```bash
# Terminal 1: Memory Service
cd e:\Ekaguru\memory_service
uvicorn app.main:app --port 8000

# Terminal 2: Orchestrator
cd e:\Ekaguru\orchestrator_service
uvicorn app.main:app --port 8001

# Terminal 3: Diagnosis Agent
cd e:\Ekaguru\diagnosis_agent
uvicorn app.main:app --port 8002

# Terminal 4: Teaching Agent
cd e:\Ekaguru\teaching_agent
uvicorn app.main:app --port 8003

# Terminal 5: Struggle Agent
cd e:\Ekaguru\struggle_agent
uvicorn app.main:app --port 8004

# Terminal 6: Reflection Agent
cd e:\Ekaguru\reflection_agent
uvicorn app.main:app --port 8005

# Terminal 7: Parent Dashboard
cd e:\Ekaguru\parent_dashboard
uvicorn app.main:app --port 8006

# Terminal 8: Transfer Agent
cd e:\Ekaguru\transfer_agent
uvicorn app.main:app --port 8007
```

### Run Demo

```bash
cd e:\Ekaguru\demos
python demo_fractions.py
```

---

## What the Demo Proves

✅ **Detects ignorance correctly** - Diagnosis agent identifies misconceptions  
✅ **Teaches like a human Guru** - Experience → Intuition → Symbol  
✅ **Builds intelligence via struggle** - Adaptive difficulty with hints  
✅ **Locks memory via reflection** - Self-explanation and spaced repetition  
✅ **Creates thinkers via transfer** - Tests application in new contexts  
✅ **Builds parent trust** - Transparent analytics and explainable AI  

This is not EdTech. This is **Cognitive Skill Engineering**.
