from fastapi import FastAPI, HTTPException, UploadFile, File
from typing import List
from .models import School, Teacher, Class, StudentMap, CreateSchoolRequest, CreateClassRequest, AddStudentsRequest
import csv
import io

app = FastAPI(title="Ekaguru School Service", version="1.0.0")

# MOCK DATABASE
schools_db = {}
teachers_db = {}
classes_db = {}
student_map_db = [] # List of associations

@app.post("/schools/register", response_model=School)
def register_school(request: CreateSchoolRequest):
    school = School(
        name=request.name,
        address=request.address,
        license_key="LIC-" + request.name[:3].upper() + "-2026"
    )
    schools_db[school.id] = school
    return school

@app.post("/classes", response_model=Class)
def create_class(request: CreateClassRequest):
    if request.teacher_id not in teachers_db:
         # For simplicity in mock, just allow it or auto-create a mock teacher if needed.
         # Ideally we validate teacher exists.
         pass 

    new_class = Class(
        teacher_id=request.teacher_id,
        name=request.name,
        grade_level=request.grade_level
    )
    classes_db[new_class.id] = new_class
    return new_class

@app.post("/classes/{class_id}/students", response_model=dict)
def add_students(class_id: str, request: AddStudentsRequest):
    if class_id not in classes_db:
        raise HTTPException(status_code=404, detail="Class not found")
    
    count = 0
    for student_id in request.student_ids:
        # Check if already in class to avoid dupes? 
        # For MVP simple append
        mapping = StudentMap(class_id=class_id, student_id=student_id)
        student_map_db.append(mapping)
        count += 1
        
    return {"message": f"Added {count} students to class {classes_db[class_id].name}"}

@app.post("/classes/{class_id}/students/upload")
async def upload_students(class_id: str, file: UploadFile = File(...)):
    if class_id not in classes_db:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")

    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    # Expected CSV columns: name, email
    added_count = 0
    errors = []
    
    for row in reader:
        if 'name' not in row:
             continue # Skip invalid rows
        
        # In a real app, we'd create the student auth record here too.
        # For now, we mock the mapping ID as the name for simplicity or uuid
        student_id = f"student-{row['name'].lower().replace(' ', '-')}"
        
        mapping = StudentMap(class_id=class_id, student_id=student_id)
        student_map_db.append(mapping)
        added_count += 1

    return {
        "message": f"Successfully processed CSV", 
        "students_added": added_count,
        "class_name": classes_db[class_id].name
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "school_service"}
