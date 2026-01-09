from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import uuid

app = FastAPI(title="Ekaguru Onboarding Service", version="1.0.0")

# --- Models ---
class StudentProfile(BaseModel):
    name: str
    age: int
    grade_level: int
    parent_email: str
    interests: List[str] = []

class OnboardingResponse(BaseModel):
    student_id: str
    message: str
    recommended_path: str

# --- In-Memory Store (Mock DB) ---
students_db = {}

# --- Endpoints ---

@app.post("/onboarding/register", response_model=OnboardingResponse)
def register_student(profile: StudentProfile):
    """
    Register a new student for the Pilot Program.
    Assigns a unique ID and determining initial curriculum path.
    """
    student_id = f"student_{uuid.uuid4().hex[:8]}"
    students_db[student_id] = profile.dict()
    
    # Simple logic for curriculum assignment
    if profile.grade_level >= 4:
        path = "Photosynthesis (Science) & Fractions (Math)"
    else:
        path = "Basic Arithmetic & Plants"
        
    return OnboardingResponse(
        student_id=student_id,
        message=f"Welcome {profile.name}! Your pilot program is ready.",
        recommended_path=path
    )

@app.get("/onboarding/status/{student_id}")
def get_status(student_id: str):
    if student_id not in students_db:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"status": "active", "profile": students_db[student_id]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
