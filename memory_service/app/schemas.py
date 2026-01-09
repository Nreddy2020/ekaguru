from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ConceptUpdate(BaseModel):
    student_id: UUID
    concept_id: UUID
    mastery_score: int
    confidence_level: str
    state: str
    struggle_increment: Optional[int] = 0
    version: Optional[int] = None # For optimistic locking

class ConceptStateOut(BaseModel):
    name: str
    state: Optional[str] = "unknown"
    mastery: Optional[int] = 0
    confidence: Optional[str] = "low"
    version: int

class TopicSnapshot(BaseModel):
    topic: str
    concepts: List[ConceptStateOut]

class LearningEventCreate(BaseModel):
    student_id: UUID
    concept_id: UUID
    agent: str
    event_type: str
    response_quality: int
    confidence_detected: str
