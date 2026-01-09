from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas, database

router = APIRouter()

@router.post("")
def log_learning_event(event_data: schemas.LearningEventCreate, db: Session = Depends(database.get_db)):
    new_event = models.LearningEvent(
        student_id=event_data.student_id,
        concept_id=event_data.concept_id,
        agent=event_data.agent,
        event_type=event_data.event_type,
        response_quality=event_data.response_quality,
        confidence_detected=event_data.confidence_detected
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return {"status": "recorded", "event_id": str(new_event.id)}
