from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .. import models, schemas, database

import logging

# Setup Logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

VALID_TRANSITIONS = {
    "unknown": ["introduced"],
    "introduced": ["partial", "misconception", "understood"],
    "partial": ["understood", "misconception", "introduced"], # Can regress
    "misconception": ["partial", "understood"],
    "understood": ["mastered", "partial"], # Can decay
    "mastered": ["understood"] # Decay
}

def validate_transition(current_state: str, new_state: str):
    if current_state == new_state:
        return True
    if current_state not in VALID_TRANSITIONS:
        # If current state (e.g. initial 'none') isn't in map, allow any valid starting state
        if new_state == "introduced": return True
        return True # Allow permissive for now if unknown
    
    allowed = VALID_TRANSITIONS.get(current_state, [])
    if new_state not in allowed:
        logger.warning(f"Invalid transition attempted: {current_state} -> {new_state}")
        raise HTTPException(status_code=400, detail=f"Invalid state transition from {current_state} to {new_state}")
    return True

def calculate_next_review(state: str) -> datetime:
    now = datetime.now()
    if state == 'introduced':
        return now + timedelta(days=1)
    elif state == 'partial':
        return now + timedelta(days=2)
    elif state == 'understood':
        return now + timedelta(days=7)
    elif state == 'mastered':
        return now + timedelta(days=21)
    else:
        # Default for unknown, misconception, etc.
        return now + timedelta(days=1)

@router.post("/update")
def update_concept_state(update_data: schemas.ConceptUpdate, db: Session = Depends(database.get_db)):
    logger.info(f"Update request for Student {update_data.student_id}, Concept {update_data.concept_id}")
    # Check if exists
    state_record = db.query(models.StudentConceptState).filter(
        models.StudentConceptState.student_id == update_data.student_id,
        models.StudentConceptState.concept_id == update_data.concept_id
    ).with_for_update().first() # Lock the row

    if not state_record:
        # Create new record
        state_record = models.StudentConceptState(
            student_id=update_data.student_id,
            concept_id=update_data.concept_id,
            exposure_count=0,
            struggle_count=0,
            version=1
        )
        db.add(state_record)
        old_state = "none"
    else:
        # Optimistic Concurrency Control
        if update_data.version is not None and state_record.version != update_data.version:
            raise HTTPException(status_code=409, detail=f"Conflict: State has been modified by another process. Expected version {update_data.version}, found {state_record.version}")
        
        old_state = state_record.state
        state_record.version += 1
    
    # Update fields
    # Validate transition
    validate_transition(state_record.state, update_data.state)

    state_record.mastery_score = update_data.mastery_score
    state_record.confidence_level = update_data.confidence_level
    state_record.state = update_data.state
    
    # Increment counters
    state_record.exposure_count += 1
    if update_data.struggle_increment:
        state_record.struggle_count += update_data.struggle_increment
    
    # Update timings
    state_record.last_seen = datetime.now()
    state_record.next_review = calculate_next_review(update_data.state)
    
    # Create Outbox Event
    import json
    event_payload = {
        "student_id": str(update_data.student_id),
        "concept_id": str(update_data.concept_id),
        "old_state": old_state,
        "new_state": state_record.state,
        "mastery_score": state_record.mastery_score,
        "timestamp": datetime.now().isoformat()
    }
    
    outbox_event = models.OutboxEvent(
        aggregate_type="student_concept_state",
        aggregate_id=f"{update_data.student_id}:{update_data.concept_id}",
        event_type="concept_state_updated",
        payload=json.dumps(event_payload),
        processed=False
    )
    db.add(outbox_event)

    db.commit()
    db.refresh(state_record)
    
    return {
        "status": "success", 
        "new_state": state_record.state, 
        "next_review": state_record.next_review,
        "version": state_record.version
    }
