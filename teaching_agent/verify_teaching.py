from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_verification():
    print("Starting Teaching Agent Verification...")

    # Scenario 1: Misconception (Denominator)
    print("\nTesting: Misconception (Denominator)")
    payload = {
        "student_id": "student-123",
        "concept_id": "concept-123",
        "diagnosis": "misconception",
        "misconception_tags": ["denominator_as_bigger_number"],
        "age": 10,
        "confidence_level": "medium"
    }
    response = client.post("/teach", json=payload)
    data = response.json()
    assert response.status_code == 200
    plan = data["teaching_plan"]
    assert len(plan) >= 3
    assert plan[0]["mode"] == "experience"
    assert "pizza" in plan[0]["content"].lower()
    print(f"Plan generated: {len(plan)} steps (Correct)")
    print(f"Step 1: {plan[0]['content']}")

    # Scenario 2: Unknown (New Concept)
    print("\nTesting: Unknown Concept")
    payload = {
        "student_id": "student-123",
        "concept_id": "concept-123",
        "diagnosis": "unknown",
        "misconception_tags": [],
        "age": 10,
        "confidence_level": "low"
    }
    response = client.post("/teach", json=payload)
    data = response.json()
    assert response.status_code == 200
    plan = data["teaching_plan"]
    assert len(plan) >= 3
    assert plan[0]["mode"] == "experience"
    assert "chocolate" in plan[0]["content"].lower()
    print(f"Plan generated: {len(plan)} steps (Correct)")
    print(f"Step 1: {plan[0]['content']}")

    print("\nVerification PASSED")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
