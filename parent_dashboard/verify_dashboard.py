from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_verification():
    print("Starting Parent Dashboard Verification...")

    # Test 1: Get Dashboard Summary
    print("\nTesting: GET /parent/dashboard/{student_id}")
    res = client.get("/parent/dashboard/student-1")
    assert res.status_code == 200
    data = res.json()
    
    # Verify structure
    assert "learning_health" in data
    assert "subjects" in data
    assert "fear_index" in data
    assert "recent_decisions" in data
    
    # Verify learning health
    health = data["learning_health"]
    assert health["understanding"] in ["strong", "improving", "needs_attention"]
    assert health["confidence"] in ["high", "improving", "low"]
    assert health["fear"] in ["low", "medium", "high"]
    print(f"Learning Health: Understanding={health['understanding']}, Fear={health['fear']} (Correct)")
    
    # Verify subjects
    assert len(data["subjects"]) > 0
    subject = data["subjects"][0]
    assert "subject_name" in subject
    assert "mastery_percentage" in subject
    assert "concept_breakdown" in subject
    print(f"Subjects: {len(data['subjects'])} subjects found (Correct)")
    
    # Verify fear index
    fear = data["fear_index"]
    assert fear["level"] in ["low", "medium", "high"]
    assert isinstance(fear["signals_detected"], list)
    assert isinstance(fear["insights"], list)
    print(f"Fear Index: {fear['level']} (Correct)")
    
    # Test 2: Get Subject Details
    print("\nTesting: GET /parent/subject/{student_id}/{subject_name}")
    res = client.get("/parent/subject/student-1/Mathematics")
    assert res.status_code == 200
    data = res.json()
    assert data["subject_name"] == "Mathematics"
    assert 0 <= data["mastery_percentage"] <= 100
    print(f"Subject Mastery: {data['mastery_percentage']}% (Correct)")
    
    # Test 3: Get Fear Index
    print("\nTesting: GET /parent/fear-index/{student_id}")
    res = client.get("/parent/fear-index/student-1")
    assert res.status_code == 200
    data = res.json()
    assert data["level"] in ["low", "medium", "high"]
    print(f"Fear Level: {data['level']} (Correct)")
    
    print("\nVerification PASSED")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
