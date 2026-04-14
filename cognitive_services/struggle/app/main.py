from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="Struggle Agent", version="1.0.0")

DIFFICULTY_TIERS = {
    "worked_example": {
        "hint_level": 1,
        "description": "I do - watched solution",
        "scaffolding": "high"
    },
    "guided": {
        "hint_level": 2,
        "description": "We do - prompted practice",
        "scaffolding": "medium"
    },
    "independent": {
        "description": "You do - independent practice",
        "scaffolding": "low"
    }
}

HINTS = {
    "velocity": [
        "Think about which direction the object is moving.",
        "Remember - velocity includes direction, not just speed.",
        "If the object turns, its velocity changes even if speed is constant.",
        "The answer involves thinking about the path taken vs straight-line distance."
    ],
    "force": [
        "Consider what happens to motion when nothing pushes.",
        "Think about the tendency to keep moving.",
        "Remember Galileo's insight about the ball.",
        "The key is what happens AFTER the push stops."
    ],
    "mass": [
        "Think about where gravity doesn't pull the same.",
        "Consider how much 'stuff' vs how hard Earth pulls.",
        "The balance test - what weighs more?",
        "Mass is property, weight is measurement."
    ],
    "gravity": [
        "What would happen if you doubled the distance?",
        "Think about the force between two objects.",
        "The force gets weaker with distance squared.",
        "Every mass attracts every other mass."
    ],
    "acceleration": [
        "How quickly does speed change?",
        "Think about the rate of change.",
        "Zero acceleration doesn't mean zero speed.",
        "Constant velocity means zero acceleration."
    ]
}


class StruggleRequest(BaseModel):
    student_id: int
    concept_id: int
    instruction: str
    context: dict
    mastery_level: Optional[float] = None


class StruggleResponse(BaseModel):
    difficulty: str
    hint_level: int
    hint: str
    next_action: str
    available_hints: int


@app.get("/")
def root():
    return {"service": "struggle", "status": "running"}


@app.post("/struggle")
def struggle(request: StruggleRequest) -> StruggleResponse:
    mastery = request.mastery_level or 50
    
    if mastery < 40:
        difficulty = "worked_example"
        hint_level = 1
    elif mastery < 70:
        difficulty = "guided"
        hint_level = 2
    else:
        difficulty = "independent"
        hint_level = 3
    
    concept_names = {
        1: "velocity", 2: "force", 3: "mass", 4: "energy",
        5: "gravity", 6: "friction", 7: "acceleration", 8: "momentum"
    }
    
    concept_key = concept_names.get(request.concept_id, "general")
    hints = HINTS.get(concept_key, ["Think about the problem step by step."])
    
    context_struggle = request.context.get("struggle_count", 0)
    hint_index = min(context_struggle, len(hints) - 1)
    hint = hints[hint_index] if hint_index < len(hints) else hints[-1]
    
    available_hints = len(hints) - hint_index
    
    return StruggleResponse(
        difficulty=difficulty,
        hint_level=hint_level,
        hint=hint,
        next_action="attempt" if difficulty == "independent" else "guided_attempt",
        available_hints=available_hints
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)