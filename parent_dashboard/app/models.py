from pydantic import BaseModel
from typing import List, Optional

class LearningHealth(BaseModel):
    understanding: str  # strong, improving, needs_attention
    confidence: str  # high, improving, low
    fear: str  # low, medium, high
    retention: str  # excellent, good, needs_work
    growth_trend: str  # up, stable, down

class ConceptNode(BaseModel):
    concept_name: str
    state: str  # clear, improving, not_taught, misconception

class SubjectHealth(BaseModel):
    subject_name: str
    mastery_percentage: int
    concept_breakdown: List[ConceptNode]

class FearSignal(BaseModel):
    type: str  # long_pause, avoidance, abandonment
    count: int

class FearIndex(BaseModel):
    level: str  # low, medium, high
    signals_detected: List[FearSignal]
    insights: List[str]

class TutorDecision(BaseModel):
    timestamp: str
    decision: str
    reason: str

class DashboardSummary(BaseModel):
    student_id: str
    learning_health: LearningHealth
    subjects: List[SubjectHealth]
    fear_index: FearIndex
    recent_decisions: List[TutorDecision]
