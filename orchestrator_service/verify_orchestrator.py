from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_verification():
    print("Starting Tutor Orchestrator Service Verification...")

    # Scenario 1: Unknown -> Observe
    print("\nTesting: Unknown state -> Observe")
    payload = {
        "mastery_score": 0,
        "confidence_level": "low",
        "state": "unknown",
        "struggle_count": 0
    }
    response = client.post("/orchestrate", json=payload)
    data = response.json()
    assert response.status_code == 200
    assert data["next_state"] == "observe"
    assert data["next_agent"] == "curiosity-agent"
    print(f"Decided: {data['next_state']} (Correct)")

    # Scenario 2: Misconception -> Explain
    print("\nTesting: Misconception -> Explain")
    payload = {
        "mastery_score": 20,
        "confidence_level": "medium",
        "state": "misconception",
        "struggle_count": 0
    }
    response = client.post("/orchestrate", json=payload)
    data = response.json()
    assert data["next_state"] == "explain"
    assert "misconception" in data["instruction"]
    print(f"Decided: {data['next_state']} (Correct)")

    # Scenario 3: Partial, High Struggle -> Explain
    print("\nTesting: Partial + High Struggle -> Explain")
    payload = {
        "mastery_score": 40,
        "confidence_level": "low",
        "state": "partial",
        "struggle_count": 2
    }
    response = client.post("/orchestrate", json=payload)
    data = response.json()
    assert data["next_state"] == "explain"
    assert "too much struggle" in data["instruction"]
    print(f"Decided: {data['next_state']} (Correct)")

    # Scenario 4: Partial, Low Struggle -> Struggle
    print("\nTesting: Partial + Low Struggle -> Struggle")
    payload = {
        "mastery_score": 50,
        "confidence_level": "medium",
        "state": "partial",
        "struggle_count": 1
    }
    response = client.post("/orchestrate", json=payload)
    data = response.json()
    assert data["next_state"] == "struggle"
    print(f"Decided: {data['next_state']} (Correct)")

    # Scenario 5: Understood + Confident -> Reflect
    print("\nTesting: Understood + Confident -> Reflect")
    payload = {
        "mastery_score": 90,
        "confidence_level": "high",
        "state": "understood",
        "struggle_count": 0
    }
    response = client.post("/orchestrate", json=payload)
    data = response.json()
    assert data["next_state"] == "reflect"
    print(f"Decided: {data['next_state']} (Correct)")

    print("\nVerification PASSED")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
