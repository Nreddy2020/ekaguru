from .models import (
    LearningHealth, SubjectHealth, ConceptNode, 
    FearIndex, FearSignal, TutorDecision, DashboardSummary
)
from typing import List
import os
import httpx

MEMORY_SERVICE_URL = os.getenv("MEMORY_SERVICE_URL", "http://localhost:8000")

def calculate_learning_health(student_id: str) -> LearningHealth:
    """Aggregate cognitive metrics from Memory Service (Real)"""
    try:
        response = httpx.get(f"{MEMORY_SERVICE_URL}/memory/analytics/dashboard/{student_id}", timeout=5.0)
        response.raise_for_status()
        data = response.json()
        return LearningHealth(**data)
    except Exception as e:
        print(f"Analytics Error: {e}")
        # Fallback for resilience
        return LearningHealth(
            understanding="no_data", confidence="no_data", 
            fear="low", retention="unknown", growth_trend="stable"
        )

def get_subject_breakdown(student_id: str, subject_name: str) -> SubjectHealth:
    """Get detailed breakdown for a specific subject (Real)"""
    try:
        response = httpx.get(f"{MEMORY_SERVICE_URL}/memory/analytics/subject/{student_id}/{subject_name}", timeout=5.0)
        data = response.json()
        
        # Convert dict logic to Pydantic if needed, but schema matches 
        concept_nodes = [ConceptNode(**c) for c in data.get("concept_breakdown", [])]
        
        return SubjectHealth(
            subject_name=data["subject_name"],
            mastery_percentage=data["mastery_percentage"],
            concept_breakdown=concept_nodes
        )
    except Exception:
        return SubjectHealth(subject_name=subject_name, mastery_percentage=0, concept_breakdown=[])

def calculate_fear_index(student_id: str) -> FearIndex:
    """Analyze fear signals (Real)"""
    try:
        response = httpx.get(f"{MEMORY_SERVICE_URL}/memory/analytics/fear/{student_id}", timeout=5.0)
        data = response.json()
        
        signals = [FearSignal(**s) for s in data.get("signals_detected", [])]
        
        return FearIndex(
            level=data["level"],
            signals_detected=signals,
            insights=data["insights"]
        )
    except Exception:
        return FearIndex(level="low", signals_detected=[], insights=["Data unavailable"])

def get_recent_decisions(student_id: str, limit: int = 5) -> List[TutorDecision]:
    """Get explainable AI decisions (Mock for now as Orchestrator log access is separate)"""
    # Orchestrator logs are in SQL 'orchestrator_decisions' but accessed via Memory or direct DB?
    # For MVP, we'll keep this mocked or implement a 'decisions' endpoint later.
    return [
        TutorDecision(
            timestamp="2026-01-08T20:00:00",
            decision="teaching-agent",
            reason="Misconception detected in denominator understanding"
        )
    ]

def get_dashboard_summary(student_id: str) -> DashboardSummary:
    """Generate complete dashboard summary"""
    learning_health = calculate_learning_health(student_id)
    
    # Get all subjects (In production, query from curriculum)
    subjects = [
        get_subject_breakdown(student_id, "Mathematics"),
        # get_subject_breakdown(student_id, "Science") # Only math for now
    ]
    
    fear_index = calculate_fear_index(student_id)
    recent_decisions = get_recent_decisions(student_id)
    
    return DashboardSummary(
        student_id=student_id,
        learning_health=learning_health,
        subjects=subjects,
        fear_index=fear_index,
        recent_decisions=recent_decisions
    )
