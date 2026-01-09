from fastapi import FastAPI
from .models import TeachingRequest, TeachingPlan
from .engine import build_teaching_plan

app = FastAPI(title="Teaching Agent")

@app.post("/teach", response_model=TeachingPlan)
def teach(req: TeachingRequest):
    plan = build_teaching_plan(req)
    return plan
