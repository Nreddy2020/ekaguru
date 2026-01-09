from pydantic import BaseModel
from typing import List

class TeachingRequest(BaseModel):
    student_id: str
    concept_id: str
    diagnosis: str
    misconception_tags: List[str]
    age: int
    confidence_level: str

class TeachingStep(BaseModel):
    step: int
    mode: str  # experience, intuition, symbol
    content: str

class TeachingPlan(BaseModel):
    teaching_plan: List[TeachingStep]
    checkpoints: List[str]
