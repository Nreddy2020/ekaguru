from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_verification():
    print("Starting Diagnosis Agent Verification...")

    # Scenario 1: Fear / Avoidance (Unknown)
    print("\nTesting: 'I don't know' -> Unknown/Fear")
    payload = {
        "student_id": "student-123",
        "concept_id": "concept-123",
        "student_answer": "I don't know",
        "response_time": 2.5
    }
    response = client.post("/diagnose", json=payload)
    data = response.json()
    assert response.status_code == 200
    assert data["diagnosis"] == "unknown"
    assert "fear_avoidance" in data["misconception_tags"]
    print(f"Diagnosed: {data['diagnosis']} (Correct)")

    # Scenario 2: Misconception (Rule-based)
    print("\nTesting: '4 is bigger than 2' -> Misconception")
    payload = {
        "student_id": "student-123",
        "concept_id": "concept-123",
        "student_answer": "3/4 is bigger because 4 is bigger than 2",
        "response_time": 10.0
    }
    response = client.post("/diagnose", json=payload)
    data = response.json()
    assert data["diagnosis"] == "misconception"
    assert "denominator_as_bigger_number" in data["misconception_tags"]
    print(f"Diagnosed: {data['diagnosis']} (Correct)")

    # Scenario 3: Correct / Understood (Mocked Keyword)
    print("\nTesting: 'Divide into parts' -> Understood")
    payload = {
        "student_id": "student-123",
        "concept_id": "concept-123",
        "student_answer": "It means to divide something into equal parts",
        "response_time": 15.0
    }
    response = client.post("/diagnose", json=payload)
    data = response.json()
    assert data["diagnosis"] == "understood"
    print(f"Diagnosed: {data['diagnosis']} (Correct)")

    print("\nVerification PASSED")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
