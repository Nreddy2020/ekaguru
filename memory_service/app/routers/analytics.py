from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, database
from typing import List, Dict, Any

router = APIRouter()

@router.get("/dashboard/{student_id}")
def get_dashboard_metrics(student_id: str, db: Session = Depends(database.get_db)):
    # 1. Understanding Health
    total_concepts = db.query(models.StudentConceptState).filter_by(student_id=student_id).count()
    if total_concepts == 0:
        return {"understanding": "no_data", "confidence": "no_data"}
        
    mastered_count = db.query(models.StudentConceptState).filter(
        models.StudentConceptState.student_id == student_id,
        models.StudentConceptState.state.in_(["mastered", "understood"])
    ).count()
    
    understanding_pct = (mastered_count / total_concepts) * 100
    understanding_health = "strong" if understanding_pct > 70 else "improving" if understanding_pct > 40 else "needs_attention"

    # 2. Confidence Trend (Simple heuristics)
    high_conf_count = db.query(models.StudentConceptState).filter_by(
        student_id=student_id, confidence_level="high"
    ).count()
    confidence_health = "high" if (high_conf_count / total_concepts) > 0.5 else "average"

    # 3. Fear Index
    metrics = {
        "understanding": understanding_health,
        "confidence": confidence_health,
        "fear": "low", # Placeholder for complex logic
        "retention": "good",
        "growth_trend": "up"
    }
    return metrics

@router.get("/subject/{student_id}/{subject}")
def get_subject_breakdown(student_id: str, subject: str, db: Session = Depends(database.get_db)):
    # In a real app, join with Concepts -> Topics -> Subjects
    # Here we assume all concepts belong to the subject for simplicity (since we don't have subject mapping fully seeded)
    
    # Mock filtering by filtering concepts that 'might' be in the subject
    # Or just returning all concepts for now
    concepts = db.query(models.StudentConceptState).filter_by(student_id=student_id).all()
    
    concept_list = []
    for c in concepts:
        # Get concept name (mock lookup as we didn't join)
        concept_list.append({
            "concept_name": f"Concept {str(c.concept_id)[:8]}", # Mock name
            "state": c.state
        })
        
    return {
        "subject_name": subject,
        "mastery_percentage": 75, # Mock
        "concept_breakdown": concept_list
    }

@router.get("/fear/{student_id}")
def get_fear_index(student_id: str, db: Session = Depends(database.get_db)):
    # Analyze recent events for fear patterns (long pause, avoidance)
    # Using 'struggle_count' from state as proxy
    
    high_struggle = db.query(models.StudentConceptState).filter(
        models.StudentConceptState.student_id == student_id,
        models.StudentConceptState.struggle_count > 2
    ).count()
    
    level = "low"
    if high_struggle > 5:
        level = "high"
    elif high_struggle > 2:
        level = "medium"
        
    return {
        "level": level,
        "signals_detected": [{"type": "struggle", "count": high_struggle}],
        "insights": ["Confidence is stable"] if level == "low" else ["Detected struggle in some areas"]
    }
