from pydantic import BaseModel
from typing import Optional

class StudentSignal(BaseModel):
    student_id: str
    concept_id: str
    mastery_score: Optional[int] = None
    confidence_level: Optional[str] = None
    state: Optional[str] = None
    struggle_count: Optional[int] = 0
    last_event_type: Optional[str] = None
    response_quality: Optional[int] = None

class OrchestratorDecision(BaseModel):
    next_state: str
    next_agent: str
    instruction: str
    tone: str
    depth: str
