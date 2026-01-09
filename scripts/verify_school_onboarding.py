from fastapi.testclient import TestClient
from school_service.main import app
import io

client = TestClient(app)

def verify_onboarding():
    print("🚀 VERIFYING SCHOOL ONBOARDING WORKFLOW 🚀")
    print("==========================================")
    
    # 1. Register School
    print("[1] Registering 'Lincoln Elementary'...")
    resp = client.post("/schools/register", json={"name": "Lincoln Elementary", "address": "123 Main St"})
    assert resp.status_code == 200
    school_id = resp.json()["id"]
    print(f"    ✅ Created School ID: {school_id}")

    # 2. Create Class
    print("\n[2] Creating '5th Grade Science'...")
    resp = client.post("/classes", json={
        "teacher_id": "teacher-001", 
        "name": "5th Grade Science", 
        "grade_level": 5
    })
    assert resp.status_code == 200
    class_id = resp.json()["id"]
    print(f"    ✅ Created Class ID: {class_id}")

    # 3. Bulk Upload CSV
    print("\n[3] Uploading Student Roster (CSV)...")
    csv_content = """name,email
Alice Johnson,alice@example.com
Bob Smith,bob@example.com
Charlie Brown,charlie@example.com"""
    
    # helper to convert string to bytes stream
    files = {'file': ('roster.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')}
    
    resp = client.post(f"/classes/{class_id}/students/upload", files=files)
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"    ✅ Upload Success: {data['message']}")
        print(f"    👥 Students Added: {data['students_added']}")
        assert data['students_added'] == 3
    else:
        print(f"    ❌ Upload Failed: {resp.text}")
        exit(1)

    print("\n✅ SCHOOL ONBOARDING VERIFIED")

if __name__ == "__main__":
    verify_onboarding()
