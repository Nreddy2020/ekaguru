from pydantic import BaseModel
from typing import List, Optional

class DiagnosisRequest(BaseModel):
    student_id: str
    concept_id: str
    student_answer: str
    response_time: float

class DiagnosisResult(BaseModel):
    concept_id: str
    diagnosis: str  # unknown, misconception, partial, understood
    mastery_score: int
    confidence_level: str
    misconception_tags: List[str]
    recommended_next: str
