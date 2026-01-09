from fastapi import FastAPI
from .models import ReflectionRequest, ReflectionResponse
from .engine import generate_reflection

app = FastAPI(title="Reflection & Memory Reinforcement Agent")

@app.post("/reflect", response_model=ReflectionResponse)
def reflect(req: ReflectionRequest):
    response = generate_reflection(req)
    return response
