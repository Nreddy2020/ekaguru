from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

app = FastAPI(title="Parent Dashboard Service", version="1.0.0")

STUDENT_SUMMARIES = {}


class ParentAnalyticsRequest(BaseModel):
    parent_id: int


class ChildProgress(BaseModel):
    child_id: int
    child_name: str
    total_concepts: int
    mastered: int
    understood: int
    partial: int
    misconception: int
    unknown: int
    avg_mastery: float
    fear_index: float
    confidence_index: float
    last_session: Optional[str]


class DashboardResponse(BaseModel):
    parent_id: int
    children: List[ChildProgress]
    overall_health: str
    weekly_insights: List[str]


@app.get("/")
def root():
    return {"service": "parent-dashboard", "status": "running"}


@app.post("/parent/analytics")
def get_analytics(request: ParentAnalyticsRequest) -> DashboardResponse:
    child_id = request.parent_id * 100
    
    summary = STUDENT_SUMMARIES.get(child_id, {
        "total_concepts": 0,
        "mastered": 0,
        "understood": 0,
        "partial": 0,
        "misconception": 0,
        "unknown": 0,
        "avg_mastery": 0.0,
        "fear_index": 5.0,
        "confidence_index": 5.0,
        "last_session": None
    })
    
    total = summary["total_concepts"]
    if total == 0:
        overall_health = "new"
    elif summary["mastered"] / total > 0.7:
        overall_health = "excellent"
    elif summary["mastered"] / total > 0.4:
        overall_health = "improving"
    elif summary["fear_index"] > 6:
        overall_health = "needs_attention"
    else:
        overall_health = "moderate"
    
    weekly_insights = []
    if summary["fear_index"] > 6:
        weekly_insights.append("Fear signals detected. Consider reducing difficulty.")
    if summary["confidence_index"] < 4:
        weekly_insights.append("Confidence building needed.")
    if summary["misconception"] > summary["mastered"] / 2:
        weekly_insights.append("Misconceptions need attention. Book a review session.")
    if not weekly_insights:
        weekly_insights.append("Great progress this week!")
    
    child = ChildProgress(
        child_id=child_id,
        child_name=f"Child {child_id}",
        total_concepts=summary["total_concepts"],
        mastered=summary["mastered"],
        understood=summary["understood"],
        partial=summary["partial"],
        misconception=summary["misconception"],
        unknown=summary["unknown"],
        avg_mastery=summary["avg_mastery"],
        fear_index=summary["fear_index"],
        confidence_index=summary["confidence_index"],
        last_session=summary["last_session"]
    )
    
    return DashboardResponse(
        parent_id=request.parent_id,
        children=[child],
        overall_health=overall_health,
        weekly_insights=weekly_insights
    )


@app.get("/parent/child/{child_id}")
def get_child_details(child_id: int):
    summary = STUDENT_SUMMARIES.get(child_id, {
        "total_concepts": 0,
        "mastered": 0,
        "understood": 0,
        "partial": 0,
        "misconception": 0,
        "unknown": 0,
        "avg_mastery": 0.0,
        "fear_index": 5.0,
        "confidence_index": 5.0,
        "last_session": None
    })
    
    return {
        "child_id": child_id,
        "summary": summary,
        "concept_breakdown": [],
        "recent_events": []  # Would come from Memory Service events
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)