from fastapi import FastAPI, HTTPException
from .models import StudentSignal, OrchestratorDecision
from .fsm import decide_next
from .memory_client import MemoryClient
import logging
import json
from datetime import datetime

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orchestrator")

app = FastAPI(title="Tutor Orchestrator")

# Initialize Clients
memory_client = MemoryClient()

@app.post("/orchestrate", response_model=OrchestratorDecision)
def orchestrate(signal: StudentSignal):
    # 1. Enrich Signal with State from Memory Service if missing
    if not signal.state or signal.state == "unknown":
        logger.info(f"Fetching state for Student {signal.student_id}, Concept {signal.concept_id}")
        state_data = memory_client.get_student_state(signal.student_id, signal.concept_id)
        
        # Merge fetched state into signal
        signal.state = state_data.get("state", "unknown")
        if not signal.mastery_score:
            signal.mastery_score = state_data.get("mastery_score", 0)
        if not signal.confidence_level:
            signal.confidence_level = state_data.get("confidence_level", "low")
        if not signal.struggle_count:
            signal.struggle_count = state_data.get("struggle_count", 0)

    # 2. Key Decision (FSM)
    logger.info(f"Deciding for Signal: {signal.dict()}")
    decision = decide_next(signal.dict())

    # 3. Decision Logging (Structure for 'orchestrator_decisions' table ingestion)
    log_entry = {
        "event": "orchestrator_decision",
        "timestamp": datetime.now().isoformat(),
        "student_id": signal.student_id,
        "concept_id": signal.concept_id,
        "input_state": signal.state,
        "decision": decision.dict()
    }
    logger.info(json.dumps(log_entry))

    return decision
