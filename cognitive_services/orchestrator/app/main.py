from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import httpx
from .fsm import fsm, CognitiveState

app = FastAPI(title="Orchestrator Service", version="1.0.0")

MEMORY_SERVICE_URL = "http://localhost:8000"
DIAGNOSIS_SERVICE_URL = "http://localhost:8002"
TEACHING_SERVICE_URL = "http://localhost:8003"
STRUGGLE_SERVICE_URL = "http://localhost:8004"
REFLECTION_SERVICE_URL = "http://localhost:8005"
TRANSFER_SERVICE_URL = "http://localhost:8007"


class OrchestrateRequest(BaseModel):
    student_id: int
    concept_id: int
    response: Optional[str] = None
    current_state: Optional[str] = "unknown"


class OrchestrateResponse(BaseModel):
    student_id: int
    concept_id: int
    current_state: str
    next_state: str
    next_agent: str
    instruction: str
    agent_response: dict


async def call_memory(endpoint: str, data: dict):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{MEMORY_SERVICE_URL}{endpoint}", json=data, timeout=30.0)
            return response.json()
        except Exception as e:
            return {"error": str(e)}


async def call_agent(url: str, data: dict):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=data, timeout=30.0)
            return response.json()
        except Exception as e:
            return {"error": str(e)}


@app.get("/")
def root():
    return {"service": "orchestrator", "status": "running"}


@app.post("/orchestrate")
async def orchestrate(request: OrchestrateRequest) -> OrchestrateResponse:
    context = {
        "student_id": request.student_id,
        "concept_id": request.concept_id,
    }

    state_data = await call_memory(f"/memory/state/{request.student_id}/{request.concept_id}", {})
    
    if "error" not in state_data:
        context["state"] = state_data.get("state", "unknown")
        context["mastery_score"] = state_data.get("mastery_score", 0)
        context["confidence_level"] = state_data.get("confidence_level", "low")
        context["struggle_count"] = state_data.get("struggle_count", 0)
    else:
        context["state"] = "unknown"
        context["mastery_score"] = 0
        context["confidence_level"] = "low"
        context["struggle_count"] = 0

    if request.current_state:
        context["state"] = request.current_state

    if request.response:
        context["response"] = request.response

        diagnosis = await call_agent(f"{DIAGNOSIS_SERVICE_URL}/diagnose", {
            "student_id": request.student_id,
            "concept_id": request.concept_id,
            "response": request.response
        })

        if "error" not in diagnosis:
            context["diagnosis"] = diagnosis.get("diagnosis", "unknown")
            context["misconceptions"] = diagnosis.get("misconceptions", [])
        else:
            context["diagnosis"] = "unknown"

    current_state = context.get("state", "unknown")
    decision = fsm.get_next_state(current_state, context)

    next_state = decision["next_state"]
    next_agent = decision["next_agent"]
    instruction = decision["instruction"]

    agent_response = {}
    agent_url = None

    if next_agent == "curiosity-agent":
        agent_url = f"{TEACHING_SERVICE_URL}/teach"
    elif next_agent == "diagnosis-agent":
        agent_url = f"{DIAGNOSIS_SERVICE_URL}/diagnose"
    elif next_agent == "teaching-agent":
        agent_url = f"{TEACHING_SERVICE_URL}/teach"
    elif next_agent == "struggle-agent":
        agent_url = f"{STRUGGLE_SERVICE_URL}/struggle"
    elif next_agent == "reflection-agent":
        agent_url = f"{REFLECTION_SERVICE_URL}/reflect"
    elif next_agent == "transfer-agent":
        agent_url = f"{TRANSFER_SERVICE_URL}/transfer"
    elif next_agent == "memory-service":
        await call_memory("/memory/state", {
            "student_id": request.student_id,
            "concept_id": request.concept_id,
            "state": next_state.value if isinstance(next_state, CognitiveState) else next_state,
            "mastery_score": context.get("mastery_score", 0),
            "confidence_level": context.get("confidence_level", "low"),
            "struggle_count": context.get("struggle_count", 0),
            "version": state_data.get("version", 0) + 1
        })
        agent_response = {"status": "state_updated"}

    if agent_url:
        agent_response = await call_agent(agent_url, {
            "student_id": request.student_id,
            "concept_id": request.concept_id,
            "instruction": instruction,
            "context": context
        })

    return OrchestrateResponse(
        student_id=request.student_id,
        concept_id=request.concept_id,
        current_state=current_state,
        next_state=next_state.value if isinstance(next_state, CognitiveState) else next_state,
        next_agent=next_agent,
        instruction=instruction,
        agent_response=agent_response
    )


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)