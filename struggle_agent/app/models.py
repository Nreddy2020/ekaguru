from pydantic import BaseModel
from typing import List, Optional

class StruggleRequest(BaseModel):
    student_id: str
    concept_id: str
    mastery_score: int
    confidence_level: str
    struggle_count: int

class HintPolicy(BaseModel):
    max_attempts: int
    hint_levels: List[str]

class StruggleResponse(BaseModel):
    task_type: str  # worked_example, guided, independent
    content: str
    hint_policy: Optional[HintPolicy] = None
