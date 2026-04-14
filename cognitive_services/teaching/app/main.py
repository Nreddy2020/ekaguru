from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="Teaching Agent", version="1.0.0")

TEACHING_LAYERS = [
    "experience",
    "intuition", 
    "story",
    "visual",
    "language",
    "symbol"
]

CONCEPT_TEACHING_PLANS = {
    "velocity": {
        "experience": "Imagine running in a race. When you run fast, you cover more distance in less time.",
        "intuition": "Velocity is not just HOW FAST - it's also WHICH WAY you're going.",
        "story": "The runner who changed direction: Once there was a runner who always ran forward...",
        "visual": "Draw an arrow showing the direction of motion. The length = speed, the arrow = direction.",
        "language": "Velocity is a VECTOR quantity - it has both magnitude (speed) AND direction.",
        "symbol": "v = Δx/Δt (change in position divided by change in time)"
    },
    "force": {
        "experience": "Push a stationary ball. It starts rolling because you pushed it.",
        "intuition": "Force doesn't create motion - it CHANGES motion. A ball already moving keeps going!",
        "story": "Galileo's insight: The ball keeps rolling because nothing stops it - not because a force keeps pushing.",
        "visual": "Show a book sliding. Friction arrow points back, push arrow points forward.",
        "language": "Force causes ACCELERATION, not velocity. F = ma.",
        "symbol": "F = ma (Force = mass × acceleration)"
    },
    "mass": {
        "experience": "A feather is easy to lift. A book is harder. But in space, both float the same!",
        "intuition": "Mass is how much STUFF is in an object. Weight changes, mass doesn't.",
        "story": "The astronaut on the moon: He weighed less but was still the same person.",
        "balance_scale": "Show a balance. More mass = lower the balance goes.",
        "language": "Mass is the property of matter that resists acceleration.",
        "symbol": "m = F/a (mass = force / acceleration)"
    },
    "gravity": {
        "experience": "Drop something - it always falls down. Never up.",
        "intuition": "Gravity pulls everything toward EVERYTHING. Earth is just really big.",
        "story": "Newton's apple: The same gravity that pulled the apple keeps the Moon in orbit.",
        "all_directions": "Show Earth in center, arrows pointing toward center from all sides.",
        "language": "Gravity is a ATTRACTIVE force between masses.",
        "symbol": "F = Gm₁m₂/r²"
    },
    "acceleration": {
        "experience": "A car speeding up from 0 to 60.",
        "intuition": "Acceleration is how QUICKLY speed changes. You can accelerate at different rates.",
        "story": "The drag racer: Starts from rest, gains speed incrementally.",
        "speedometer": "Show speed increasing over time. Steeper line = more acceleration.",
        "language": "Acceleration is the RATE OF CHANGE of velocity.",
        "symbol": "a = Δv/Δt"
    }
}


class TeachRequest(BaseModel):
    student_id: int
    concept_id: int
    instruction: str
    context: dict
    layer: Optional[str] = None


class TeachResponse(BaseModel):
    teaching_plan: List[dict]
    current_layer: str
    next_step: str
    persona: str


@app.get("/")
def root():
    return {"service": "teaching", "status": "running"}


@app.post("/teach")
def teach(request: TeachRequest) -> TeachResponse:
    concept_id = request.concept_id
    
    concept_names = {
        1: "velocity", 2: "force", 3: "mass", 4: "energy",
        5: "gravity", 6: "friction", 7: "acceleration", 8: "momentum"
    }
    
    concept_key = concept_names.get(concept_id, "general")
    teaching_plan_data = CONCEPT_TEACHING_PLANS.get(concept_key, {})
    
    instruction_lower = request.instruction.lower()
    
    if "misconception" in instruction_lower:
        target_layers = ["intuition", "story", "visual", "language", "symbol"]
    elif "first_principles" in instruction_lower:
        target_layers = ["experience", "intuition", "visual", "symbol"]
    else:
        target_layers = ["experience", "intuition", "story", "visual"]
    
    persona = "storyteller"
    if "student" in instruction_lower or "intermediate" in instruction_lower:
        persona = "analyst"
    elif "genius" in instruction_lower or "advanced" in instruction_lower:
        persona = "first_principles"
    
    teaching_plan = []
    for i, layer in enumerate(target_layers):
        content = teaching_plan_data.get(layer, f"Concept: {concept_key}, Layer: {layer}")
        teaching_plan.append({
            "layer": layer,
            "order": i + 1,
            "content": content,
            "persona": persona
        })
    
    current_layer = target_layers[0] if target_layers else "experience"
    
    next_step = "struggle"
    if len(target_layers) > 1:
        next_step = target_layers[1]
    
    return TeachResponse(
        teaching_plan=teaching_plan,
        current_layer=current_layer,
        next_step=next_step,
        persona=persona
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)