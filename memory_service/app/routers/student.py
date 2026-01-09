from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .. import models, schemas, database

router = APIRouter()

@router.get("/{student_id}/topic/{topic_id}", response_model=schemas.TopicSnapshot)
def get_student_topic_snapshot(student_id: UUID, topic_id: UUID, db: Session = Depends(database.get_db)):
    # 1. Get Topic name
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # 2. Get all concepts for the topic
    concepts = db.query(models.Concept).filter(models.Concept.topic_id == topic_id).all()
    
    # 3. Get student states for these concepts
    concept_ids = [c.id for c in concepts]
    states = db.query(models.StudentConceptState).filter(
        models.StudentConceptState.student_id == student_id,
        models.StudentConceptState.concept_id.in_(concept_ids)
    ).all()
    
    state_map = {s.concept_id: s for s in states}
    
    concept_responses = []
    for concept in concepts:
        state_entry = state_map.get(concept.id)
        concept_responses.append(schemas.ConceptStateOut(
            name=concept.name,
            state=state_entry.state if state_entry else "unknown",
            mastery=state_entry.mastery_score if state_entry else 0,
            confidence=state_entry.confidence_level if state_entry else "low"
        ))
        
    return schemas.TopicSnapshot(topic=topic.name, concepts=concept_responses)
