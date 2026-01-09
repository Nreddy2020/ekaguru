from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_verification():
    print("Starting Struggle Agent Verification...")

    # Case 1: Novice (Mastery 20) -> Worked Example
    print("\nTesting: Novice (Mastery 20) -> worked_example")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 20,
        "confidence_level": "low", "struggle_count": 0
    }
    res = client.post("/struggle", json=payload)
    data = res.json()
    assert data["task_type"] == "worked_example"
    print(f"Result: {data['task_type']} (Correct)")

    # Case 2: Competent (Mastery 50) -> Guided
    print("\nTesting: Competent (Mastery 50) -> guided")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 50,
        "confidence_level": "medium", "struggle_count": 0
    }
    res = client.post("/struggle", json=payload)
    data = res.json()
    assert data["task_type"] == "guided"
    assert "hint_policy" in data
    print(f"Result: {data['task_type']} (Correct)")

    # Case 3: Expert (Mastery 80) -> Independent
    print("\nTesting: Expert (Mastery 80) -> independent")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 80,
        "confidence_level": "high", "struggle_count": 0
    }
    res = client.post("/struggle", json=payload)
    data = res.json()
    assert data["task_type"] == "independent"
    print(f"Result: {data['task_type']} (Correct)")

    print("\nVerification PASSED")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
