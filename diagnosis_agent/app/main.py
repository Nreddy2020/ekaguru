from fastapi import FastAPI, BackgroundTasks
from .models import DiagnosisRequest, DiagnosisResult
from .logic import diagnose
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Diagnosis Agent")

MEMORY_SERVICE_URL = os.getenv("MEMORY_SERVICE_URL", "http://127.0.0.1:8000")

async def update_memory(result: DiagnosisResult, student_id: str):
    async with httpx.AsyncClient() as client:
        # 1. Update Concept State
        update_payload = {
            "student_id": student_id,
            "concept_id": result.concept_id,
            "mastery_score": result.mastery_score,
            "confidence_level": result.confidence_level,
            "state": result.diagnosis,
            "struggle_increment": 1 if result.diagnosis in ["misconception", "partial"] else 0
        }
        try:
            await client.post(f"{MEMORY_SERVICE_URL}/memory/concept/update", json=update_payload)
        except Exception as e:
            print(f"Failed to update memory: {e}")

        # 2. Log Learning Event
        event_payload = {
            "student_id": student_id,
            "concept_id": result.concept_id,
            "agent": "diagnosis-agent",
            "event_type": "diagnosed",
            "response_quality": result.mastery_score,
            "confidence_detected": result.confidence_level
        }
        try:
            await client.post(f"{MEMORY_SERVICE_URL}/memory/event", json=event_payload)
        except Exception as e:
            print(f"Failed to log event: {e}")

@app.post("/diagnose", response_model=DiagnosisResult)
async def run_diagnosis(req: DiagnosisRequest, background_tasks: BackgroundTasks):
    result = diagnose(
        student_id=req.student_id,
        concept_id=req.concept_id,
        answer=req.student_answer,
        response_time=req.response_time
    )
    
    # Trigger side effects in background to keep diagnosis fast
    background_tasks.add_task(update_memory, result, req.student_id)
    
    return result
