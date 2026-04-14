from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="Transfer Agent", version="1.0.0")

TRANSFER_TYPES = [
    "teach_back",
    "near_transfer",
    "far_transfer",
    "creative"
]

CONCEPT_TRANSFER_TASKS = {
    "velocity": {
        "near_transfer": [
            "A car travels 60km in 2 hours. What is its velocity?",
            "A runner covers 400m in 50 seconds. What is velocity in m/s?"
        ],
        "far_transfer": [
            "How is velocity like the rate of money earned per hour?",
            "How is velocity similar to population growth rate?"
        ],
        "creative": [
            "Design an experiment to measure the velocity of water in a river.",
            "Create a game where velocity is important."
        ]
    },
    "force": {
        "near_transfer": [
            "A 2kg object accelerates at 3 m/s². What force is needed?",
            "If F=ma, what happens to force if mass doubles?"
        ],
        "far_transfer": [
            "How is force like push in relationships?",
            "How is acceleration like learning rate?"
        ],
        "creative": [
            "Design a machine that uses the smallest force possible.",
            "Create a safety system based on Newton's laws."
        ]
    },
    "mass": {
        "near_transfer": [
            "A force of 10N gives 2 m/s² acceleration. What is the mass?",
            "On Moon, weight is 1/6 of Earth. What is mass?"
        ],
        "far_transfer": [
            "How is mass like the size of a company?",
            "How is mass similar to knowledge in your brain?"
        ],
        "creative": [
            "Design a way to measure mass without gravity.",
            "Create an analogy for mass in a video game."
        ]
    },
    "gravity": {
        "near_transfer": [
            "What is weight on Earth (g=10)?",
            "How does weight change on a planet with 2g?"
        ],
        "far_transfer": [
            "How is gravity like friendship - stronger when closer?",
            "How is gravity similar to electric force?"
        ],
        "creative": [
            "Design a building that works in zero gravity.",
            "Create a game about escaping gravity."
        ]
    }
}


class TransferRequest(BaseModel):
    student_id: int
    concept_id: int
    instruction: str
    context: dict
    mastery_score: Optional[float] = None


class TransferResponse(BaseModel):
    transfer_type: str
    task: str
    passed: Optional[bool] = None
    feedback: str
    ready_for_check: bool


@app.get("/")
def root():
    return {"service": "transfer", "status": "running"}


@app.post("/transfer")
def transfer(request: TransferRequest) -> TransferResponse:
    mastery = request.mastery_score or 0
    
    if mastery < 40:
        transfer_type = "near_transfer"
        ready = False
    elif mastery < 70:
        transfer_type = "near_transfer"
        ready = True
    elif mastery < 90:
        transfer_type = "far_transfer"
        ready = True
    else:
        transfer_type = "creative"
        ready = True
    
    concept_names = {
        1: "velocity", 2: "force", 3: "mass", 4: "energy",
        5: "gravity", 6: "friction", 7: "acceleration", 8: "momentum"
    }
    
    concept_key = concept_names.get(request.concept_id, "general")
    tasks = CONCEPT_TRANSFER_TASKS.get(concept_key, {}).get(transfer_type, [
        f"Apply {concept_key} to a new situation.",
        f"How would you teach {concept_key} to someone else?"
    ])
    
    task = tasks[0] if tasks else "Explain this concept to someone else."
    
    return TransferResponse(
        transfer_type=transfer_type,
        task=task,
        feedback="",
        ready_for_check=ready
    )


@app.post("/transfer/check")
def check_transfer(request: TransferRequest) -> TransferResponse:
    mastery = request.mastery_score or 0
    
    if mastery >= 90:
        passed = True
        feedback = "Excellent! You truly understand this concept."
    elif mastery >= 70:
        passed = True
        feedback = "Good transfer! You can apply this knowledge."
    elif mastery >= 50:
        passed = False
        feedback = "Getting there. Try more diverse applications."
    else:
        passed = False
        feedback = "Need more practice before transfer."
    
    return TransferResponse(
        transfer_type=request.context.get("transfer_type", "unknown"),
        task="",
        passed=passed,
        feedback=feedback,
        ready_for_check=True
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)