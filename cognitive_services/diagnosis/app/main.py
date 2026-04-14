from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="Diagnosis Agent", version="1.0.0")

MISCONCEPTIONS = {
    "velocity": ["velocity equals speed", "velocity is always positive", "faster means higher velocity"],
    "force": ["force causes motion", "heavier objects fall faster", "force is needed to keep moving"],
    "mass": ["mass equals weight", "mass changes with gravity", "bigger objects have more mass"],
    "energy": ["energy is a substance", "energy can be created", "cold objects have no energy"],
    "gravity": ["gravity only works downwards", "gravity stops at atmosphere", "heavier objects pull harder"],
    "friction": ["friction always slows", "no friction in air", "smooth surfaces have no friction"],
    "acceleration": ["acceleration is speed", "acceleration means faster", "constant speed means acceleration"],
    "momentum": ["momentum is speed", "heavier always more momentum", "momentum is conserved always"],
}

FEAR_SIGNALS = [
    "i don't know",
    "i can't",
    "i don't understand",
    "this is hard",
    "i'm not good at this",
    "i give up",
    "skip this",
    "don't know",
    "idk",
]

CONFUSION_SIGNALS = [
    "confused",
    "what do you mean",
    "i don't get it",
    "wait what",
    "huh",
    "which one",
]


class DiagnoseRequest(BaseModel):
    student_id: int
    concept_id: int
    response: str


class DiagnoseResponse(BaseModel):
    diagnosis: str
    misconceptions: List[str]
    confidence_score: float
    fear_detected: bool
    recommendation: str


@app.get("/")
def root():
    return {"service": "diagnosis", "status": "running"}


@app.post("/diagnose")
def diagnose(request: DiagnoseRequest) -> DiagnoseResponse:
    response_lower = request.response.lower()
    
    misconceptions_detected = []
    diagnosis = "unknown"
    confidence_score = 0.5
    fear_detected = False
    recommendation = "continue"
    
    if any(signal in response_lower for signal in FEAR_SIGNALS):
        diagnosis = "fear_avoidance"
        confidence_score = 0.2
        fear_detected = True
        recommendation = "reduce_difficulty"
    elif any(signal in response_lower for signal in CONFUSION_SIGNALS):
        diagnosis = "confusion"
        confidence_score = 0.4
        recommendation = "clarify"
    elif "don't know" in response_lower or "dont know" in response_lower:
        diagnosis = "unknown"
        confidence_score = 0.1
        recommendation = "observe"
    else:
        diagnosis = "partial"
        confidence_score = 0.6
        recommendation = "struggle"
    
    concept_names = {
        1: "velocity", 2: "force", 3: "mass", 4: "energy",
        5: "gravity", 6: "friction", 7: "acceleration", 8: "momentum"
    }
    
    concept_key = concept_names.get(request.concept_id, "general")
    concept_misconceptions = MISCONCEPTIONS.get(concept_key, [])
    
    for misconception in concept_misconceptions:
        if misconception in response_lower:
            misconceptions_detected.append(misconception)
            diagnosis = "misconception"
            confidence_score = 0.3
    
    if diagnosis == "misconception" and misconceptions_detected:
        recommendation = "explain_first_principles"
    elif diagnosis == "fear_avoidance":
        recommendation = "build_confidence"
    
    return DiagnoseResponse(
        diagnosis=diagnosis,
        misconceptions=misconceptions_detected,
        confidence_score=confidence_score,
        fear_detected=fear_detected,
        recommendation=recommendation
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)