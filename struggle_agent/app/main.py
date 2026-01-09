from fastapi import FastAPI
from .models import StruggleRequest, StruggleResponse
from .engine import select_task

app = FastAPI(title="Guided Struggle Agent")

@app.post("/struggle", response_model=StruggleResponse)
def generate_struggle_task(req: StruggleRequest):
    task = select_task(req)
    return task
