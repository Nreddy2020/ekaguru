from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

class School(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    license_key: str
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Teacher(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    school_id: str
    name: str
    email: EmailStr
    password_hash: str  # In production, use clustered bcrypt
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Class(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    teacher_id: str
    name: str  # e.g., "Ms. Smith's 5th Grade"
    grade_level: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StudentMap(BaseModel):
    class_id: str
    student_id: str
    joined_at: datetime = Field(default_factory=datetime.utcnow)

# API Request Models
class CreateSchoolRequest(BaseModel):
    name: str
    address: Optional[str] = None

class CreateClassRequest(BaseModel):
    teacher_id: str
    name: str
    grade_level: int

class AddStudentsRequest(BaseModel):
    student_ids: List[str]
