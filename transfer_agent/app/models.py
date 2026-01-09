from pydantic import BaseModel
from typing import List, Optional

class TransferRequest(BaseModel):
    student_id: str
    concept_id: str
    mastery_score: int
    confidence_level: str
    age: int
    state: str = "understood"

class TransferTask(BaseModel):
    type: str  # teach_back, near_transfer, far_transfer, predictive, creative
    prompt: str

class MasteryDecision(BaseModel):
    new_state: str  # mastered, understood, partial
    new_mastery_score: int
    transfer_quality_score: int

class TransferResponse(BaseModel):
    transfer_tasks: List[TransferTask]
    mastery_decision: Optional[MasteryDecision] = None
