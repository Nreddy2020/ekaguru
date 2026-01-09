from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_verification():
    print("Starting Reflection Agent Verification...")

    # Case 1: Low Mastery + High Struggle -> Short review interval
    print("\nTesting: Low Mastery (30) + High Struggle (3)")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 30,
        "confidence_level": "low", "struggle_count": 3, "recent_success": True
    }
    res = client.post("/reflect", json=payload)
    data = res.json()
    assert len(data["reflection_tasks"]) >= 2  # self_explanation + error_recall
    assert data["reflection_tasks"][0]["type"] == "self_explanation"
    assert data["reflection_tasks"][1]["type"] == "error_recall"
    print(f"Tasks: {len(data['reflection_tasks'])} (Correct)")
    print(f"Next Review: {data['next_review']}")

    # Case 2: High Mastery (75) + Low Struggle -> Longer interval + Why question
    print("\nTesting: High Mastery (75) + Low Struggle (1)")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 75,
        "confidence_level": "high", "struggle_count": 1, "recent_success": True
    }
    res = client.post("/reflect", json=payload)
    data = res.json()
    assert any(t["type"] == "why_question" for t in data["reflection_tasks"])
    assert data["memory_state_update"] is not None
    assert data["memory_state_update"]["state"] == "mastered"
    print(f"Tasks: {len(data['reflection_tasks'])} (Correct)")
    print(f"Memory Update: {data['memory_state_update']['state']} (Correct)")

    # Case 3: Mastered (85) -> Teach-back task
    print("\nTesting: Mastered (85)")
    payload = {
        "student_id": "s1", "concept_id": "c1", "mastery_score": 85,
        "confidence_level": "high", "struggle_count": 0, "recent_success": True
    }
    res = client.post("/reflect", json=payload)
    data = res.json()
    assert any(t["type"] == "teach_back" for t in data["reflection_tasks"])
    assert data["memory_state_update"]["state"] == "mastered"
    print(f"Tasks: {len(data['reflection_tasks'])} (Correct)")
    print(f"State: {data['memory_state_update']['state']} (Correct)")

    print("\nVerification PASSED")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
