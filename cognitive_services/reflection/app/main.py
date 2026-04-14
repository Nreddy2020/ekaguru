from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

app = FastAPI(title="Reflection Agent", version="1.0.0")

REVIEW_INTERVALS = {
    "introduced": 1,
    "partial": 2,
    "understood": 7,
    "mastered": 21
}

REFLECTION_TASKS = [
    {
        "type": "self_explanation",
        "prompt": "Explain this concept in your own words as if teaching a younger sibling.",
        "duration_seconds": 120
    },
    {
        "type": "error_reflection",
        "prompt": "Think about a mistake you made. What specifically was wrong?",
        "duration_seconds": 60
    },
    {
        "type": "why_question",
        "prompt": "Why does this work? What would happen if something was different?",
        "duration_seconds": 90
    },
    {
        "type": "teach_back",
        "prompt": "Pretend you're the teacher. What would you tell someone who's confused?",
        "duration_seconds": 180
    },
    {
        "type": "analogy_creation",
        "prompt": "Create an analogy. How is this like something in everyday life?",
        "duration_seconds": 90
    }
]


class ReflectRequest(BaseModel):
    student_id: int
    concept_id: int
    instruction: str
    context: dict
    mastery_score: Optional[float] = None
    confidence_level: Optional[str] = None


class ReflectResponse(BaseModel):
    reflection_tasks: List[dict]
    next_review_days: int
    spaced_repetition_ready: bool
    session_complete: bool


@app.get("/")
def root():
    return {"service": "reflection", "status": "running"}


@app.post("/reflect")
def reflect(request: ReflectRequest) -> ReflectResponse:
    mastery = request.mastery_score or 0
    confidence = request.confidence_level or "low"
    
    if mastery >= 75 and confidence == "high":
        spaced_repetition_ready = True
        if mastery >= 90:
            next_review = REVIEW_INTERVALS["mastered"]
        else:
            next_review = REVIEW_INTERVALS["understood"]
        session_complete = True
        reflection_tasks = [
            REFLECTION_TASKS[3],  # teach_back
            REFLECTION_TASKS[4]  # analogy_creation
        ]
    elif mastery >= 40:
        spaced_repetition_ready = False
        next_review = REVIEW_INTERVALS["partial"]
        session_complete = False
        reflection_tasks = [
            REFLECTION_TASKS[0],  # self_explanation
            REFLECTION_TASKS[2]   # why_question
        ]
    else:
        spaced_repetition_ready = False
        next_review = REVIEW_INTERVALS["introduced"]
        session_complete = False
        reflection_tasks = [
            REFLECTION_TASKS[0],  # self_explanation
        ]
    
    return ReflectResponse(
        reflection_tasks=reflection_tasks,
        next_review_days=next_review,
        spaced_repetition_ready=spaced_repetition_ready,
        session_complete=session_complete
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)