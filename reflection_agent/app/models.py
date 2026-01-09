from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class ReflectionRequest(BaseModel):
    student_id: str
    concept_id: str
    mastery_score: int
    confidence_level: str
    struggle_count: int
    recent_success: bool = True

class ReflectionTask(BaseModel):
    type: str  # self_explanation, why_question, prediction, error_recall, teach_back
    prompt: str

class MemoryStateUpdate(BaseModel):
    state: str
    mastery_score: int

class ReflectionResponse(BaseModel):
    reflection_tasks: List[ReflectionTask]
    next_review: str  # ISO date string
    memory_state_update: Optional[MemoryStateUpdate] = None
