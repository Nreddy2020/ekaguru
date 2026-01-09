import os
import sys

# Ensure we can import the app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_verification():
    print("Starting Knowledge Memory Service Verification...")

    # 1. Create Student, Subject, Topic, Concept (Directly via DB for setup)
    db = TestingSessionLocal()
    from app import models
    import uuid
    
    student_id = uuid.uuid4()
    student = models.Student(id=student_id, name="Test Student", age=10, grade="5")
    db.add(student)

    subject_id = uuid.uuid4()
    subject = models.Subject(id=subject_id, name="Math")
    db.add(subject)

    topic_id = uuid.uuid4()
    topic = models.Topic(id=topic_id, subject_id=subject_id, name="Fractions")
    db.add(topic)

    concept_id = uuid.uuid4()
    concept = models.Concept(id=concept_id, topic_id=topic_id, name="Numerator", difficulty_level=1)
    db.add(concept)
    
    db.commit()
    print("Database initialized with seed data")

    # 2. Test Concept Update
    print("\n-> Testing POST /memory/concept/update")
    payload = {
        "student_id": str(student_id),
        "concept_id": str(concept_id),
        "mastery_score": 50,
        "confidence_level": "medium",
        "state": "introduced",
        "struggle_increment": 0
    }
    response = client.post("/memory/concept/update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["new_state"] == "introduced"
    print(f"Concept update successful: {data}")

    # 3. Test Student Snapshot
    print(f"\n-> Testing GET /memory/student/{student_id}/topic/{topic_id}")
    response = client.get(f"/memory/student/{student_id}/topic/{topic_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["topic"] == "Fractions"
    assert len(data["concepts"]) == 1
    assert data["concepts"][0]["name"] == "Numerator"
    assert data["concepts"][0]["state"] == "introduced"
    print("Student snapshot retrieved successfully")

    # 4. Test Learning Event
    print("\n-> Testing POST /memory/event")
    event_payload = {
        "student_id": str(student_id),
        "concept_id": str(concept_id),
        "agent": "diagnose",
        "event_type": "asked",
        "response_quality": 80,
        "confidence_detected": "high"
    }
    response = client.post("/memory/event", json=event_payload)
    assert response.status_code == 200
    print("Learning event logged successfully")
    
    print("\nVerification PASSED")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
