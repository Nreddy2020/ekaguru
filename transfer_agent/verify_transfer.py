from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_verification():
    print("Starting Knowledge Transfer Agent Verification...")

    # Case 1: Low Mastery (70) -> Teach-back + Near Transfer only
    print("\nTesting: Mastery 70 -> Teach-back + Near Transfer")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 70,
        "confidence_level": "medium", "age": 10
    }
    res = client.post("/transfer", json=payload)
    data = res.json()
    assert len(data["transfer_tasks"]) == 2
    assert data["transfer_tasks"][0]["type"] == "teach_back"
    assert data["transfer_tasks"][1]["type"] == "near_transfer"
    print(f"Tasks: {len(data['transfer_tasks'])} (Correct)")
    
    # Case 2: High Mastery (85) -> Include Far + Predictive
    print("\nTesting: Mastery 85 -> Teach-back + Near + Far + Predictive")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 85,
        "confidence_level": "high", "age": 10
    }
    res = client.post("/transfer", json=payload)
    data = res.json()
    assert len(data["transfer_tasks"]) == 4
    task_types = [t["type"] for t in data["transfer_tasks"]]
    assert "teach_back" in task_types
    assert "near_transfer" in task_types
    assert "far_transfer" in task_types
    assert "predictive" in task_types
    print(f"Tasks: {len(data['transfer_tasks'])} (Correct)")
    
    # Case 3: Mastered (92) -> All transfer types including Creative
    print("\nTesting: Mastery 92 -> All transfer types")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 92,
        "confidence_level": "high", "age": 10
    }
    res = client.post("/transfer", json=payload)
    data = res.json()
    assert len(data["transfer_tasks"]) == 5
    task_types = [t["type"] for t in data["transfer_tasks"]]
    assert "creative" in task_types
    print(f"Tasks: {len(data['transfer_tasks'])} including Creative (Correct)")
    
    print("\nVerification PASSED")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
