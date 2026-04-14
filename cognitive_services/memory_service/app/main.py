from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from .database import get_db, Student, Concept, StudentConceptState, OutboxEvent, Parent
from datetime import datetime, timedelta
import json

app = FastAPI(title="Memory Service", version="1.0.0")


class StudentCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None
    grade: Optional[str] = None


class ConceptCreate(BaseModel):
    name: str
    subject: str
    metadata: Optional[dict] = None


class ConceptStateUpdate(BaseModel):
    student_id: int
    concept_id: int
    state: str
    mastery_score: Optional[float] = None
    confidence_level: Optional[str] = None
    struggle_count: Optional[int] = None
    misconception_tags: Optional[List[str]] = None
    version: int


class EventCreate(BaseModel):
    event_type: str
    aggregate_id: str
    payload: dict


@app.get("/")
def root():
    return {"service": "memory", "status": "running"}


@app.post("/memory/student")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = Student(
        name=student.name,
        parent_id=student.parent_id,
        grade=student.grade
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@app.get("/memory/student/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.post("/memory/concept")
def create_concept(concept: ConceptCreate, db: Session = Depends(get_db)):
    db_concept = Concept(
        name=concept.name,
        subject=concept.subject,
        metadata_json=json.dumps(concept.metadata) if concept.metadata else None
    )
    db.add(db_concept)
    db.commit()
    db.refresh(db_concept)
    return db_concept


@app.get("/memory/concept/{concept_id}")
def get_concept(concept_id: int, db: Session = Depends(get_db)):
    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    return concept


@app.post("/memory/state")
def update_concept_state(update: ConceptStateUpdate, db: Session = Depends(get_db)):
    state = db.query(StudentConceptState).filter(
        StudentConceptState.student_id == update.student_id,
        StudentConceptState.concept_id == update.concept_id
    ).first()

    if not state:
        if update.version != 1:
            raise HTTPException(status_code=409, detail="Version conflict - state does not exist")
        state = StudentConceptState(
            student_id=update.student_id,
            concept_id=update.concept_id,
            state=update.state,
            mastery_score=update.mastery_score or 0.0,
            confidence_level=update.confidence_level or "low",
            struggle_count=update.struggle_count or 0,
            version=1
        )
        db.add(state)
    else:
        if state.version != update.version:
            raise HTTPException(status_code=409, detail=f"Version conflict - expected {state.version}, got {update.version}")
        state.state = update.state
        if update.mastery_score is not None:
            state.mastery_score = update.mastery_score
        if update.confidence_level is not None:
            state.confidence_level = update.confidence_level
        if update.struggle_count is not None:
            state.struggle_count = update.struggle_count
        if update.misconception_tags is not None:
            state.misconception_tags = json.dumps(update.misconception_tags)
        state.version = state.version + 1
        state.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(state)

    outbox = OutboxEvent(
        event_type="concept_state_updated",
        aggregate_id=f"{update.student_id}_{update.concept_id}",
        payload=json.dumps({
            "state": update.state,
            "mastery_score": update.mastery_score,
            "confideration_level": update.confidence_level,
            "version": state.version
        })
    )
    db.add(outbox)
    db.commit()

    return state


@app.get("/memory/state/{student_id}/{concept_id}")
def get_concept_state(student_id: int, concept_id: int, db: Session = Depends(get_db)):
    state = db.query(StudentConceptState).filter(
        StudentConceptState.student_id == student_id,
        StudentConceptState.concept_id == concept_id
    ).first()

    if not state:
        return {
            "student_id": student_id,
            "concept_id": concept_id,
            "state": "unknown",
            "mastery_score": 0.0,
            "confidence_level": "low",
            "version": 0
        }

    return state


@app.post("/memory/event")
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    outbox = OutboxEvent(
        event_type=event.event_type,
        aggregate_id=event.aggregate_id,
        payload=json.dumps(event.payload)
    )
    db.add(outbox)
    db.commit()
    return {"status": "created", "id": outbox.id}


@app.get("/memory/events")
def get_unprocessed_events(db: Session = Depends(get_db)):
    events = db.query(OutboxEvent).filter(OutboxEvent.processed == False).all()
    return events


@app.post("/memory/events/{event_id}/process")
def mark_event_processed(event_id: int, db: Session = Depends(get_db)):
    event = db.query(OutboxEvent).filter(OutboxEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.processed = True
    db.commit()
    return {"status": "processed"}


@app.get("/memory/analytics/{student_id}")
def get_student_analytics(student_id: int, db: Session = Depends(get_db)):
    states = db.query(StudentConceptState).filter(
        StudentConceptState.student_id == student_id
    ).all()

    total = len(states)
    mastered = sum(1 for s in states if s.state == "mastered")
    understood = sum(1 for s in states if s.state == "understood")
    partial = sum(1 for s in states if s.state == "partial")
    misconception = sum(1 for s in states if s.state == "misconception")
    unknown = sum(1 for s in states if s.state == "unknown")

    avg_mastery = sum(s.mastery_score for s in states) / total if total > 0 else 0

    return {
        "student_id": student_id,
        "total_concepts": total,
        "mastered": mastered,
        "understood": understood,
        "partial": partial,
        "misconception": misconception,
        "unknown": unknown,
        "avg_mastery": round(avg_mastery, 2)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)