from fastapi import FastAPI
from .models import DashboardSummary, SubjectHealth, FearIndex
from .analytics import (
    get_dashboard_summary,
    get_subject_breakdown,
    calculate_fear_index
)

app = FastAPI(title="Parent Dashboard & Cognitive Analytics")

@app.get("/parent/dashboard/{student_id}", response_model=DashboardSummary)
def get_dashboard(student_id: str):
    """Get complete dashboard summary for a student"""
    return get_dashboard_summary(student_id)

@app.get("/parent/subject/{student_id}/{subject_name}", response_model=SubjectHealth)
def get_subject(student_id: str, subject_name: str):
    """Get detailed breakdown for a specific subject"""
    return get_subject_breakdown(student_id, subject_name)

@app.get("/parent/fear-index/{student_id}", response_model=FearIndex)
def get_fear_index(student_id: str):
    """Get fear and confidence analytics"""
    return calculate_fear_index(student_id)
