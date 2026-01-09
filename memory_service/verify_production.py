from fastapi.testclient import TestClient
from app.main import app
from app import models, database
import uuid

# Helper to clear DB
def clear_db():
    print("Creating tables if not exist...")
    print(f"Registered tables: {models.Base.metadata.tables.keys()}")
    models.Base.metadata.create_all(bind=database.engine)
    
    db = database.SessionLocal()
    try:
        db.query(models.StudentConceptState).delete()
        db.query(models.OutboxEvent).delete()
        db.commit()
    except Exception as e:
        print(f"Error clearing DB: {e}")
        db.rollback()
    finally:
        db.close()

client = TestClient(app)

def test_optimistic_locking_and_outbox():
    clear_db()
    
    student_id = str(uuid.uuid4())
    concept_id = str(uuid.uuid4())
    
    print(f"Testing with Student: {student_id}, Concept: {concept_id}")

    # 1. Initial Create
    print("\n[1] Creating initial state...")
    payload = {
        "student_id": student_id,
        "concept_id": concept_id,
        "mastery_score": 50,
        "confidence_level": "medium",
        "state": "introduced",
        "version": None # New record
    }
    
    response = client.post("/memory/concept/update", json=payload)
    if response.status_code != 200:
        print(f"❌ Failed to create: {response.text}")
        return
    
    data = response.json()
    print(f"✅ Created successfully. Version: {data.get('version')}")
    assert data['version'] == 1
    
    # 2. Update Success (Correct Version)
    print("\n[2] Updating with correct version (1)...")
    payload['version'] = 1
    payload['mastery_score'] = 60
    
    response = client.post("/memory/concept/update", json=payload)
    if response.status_code != 200:
        print(f"❌ Failed to update: {response.text}")
        return
        
    data = response.json()
    print(f"✅ Updated successfully. New Version: {data.get('version')}")
    assert data['version'] == 2

    # 3. Optimistic Lock Failure (Wrong Version)
    print("\n[3] Testing Optimistic Lock (Using old version 1)...")
    payload['version'] = 1 # Should fail, current is 2
    
    response = client.post("/memory/concept/update", json=payload)
    if response.status_code == 409:
        print(f"✅ Optimistic Lock worked! Got 409 as expected.")
        print(f"   Message: {response.json()['detail']}")
    else:
        print(f"❌ FAILED. Expected 409, got {response.status_code}")

    # 4. Verify Outbox Event
    print("\n[4] Verifying Outbox Event in DB...")
    db = database.SessionLocal()
    events = db.query(models.OutboxEvent).all()
    count = len(events)
    print(f"✅ Found {count} outbox events.")
    
    if count >= 2: # 1 for create, 1 for update
        print("   Checking latest event payload...")
        last_event = events[-1]
        print(f"   Type: {last_event.event_type}")
        print(f"   Payload: {last_event.payload}")
    else:
        print("❌ Not enough events found!")

    db.close()
    
    # 5. Test FSM Guard (Invalid Transition)
    print("\n[5] Testing FSM Guard (Invalid Transition: introduced -> mastered)...")
    # Reset to known state (create new concept)
    concept_id_2 = str(uuid.uuid4())
    payload_2 = {
        "student_id": student_id,
        "concept_id": concept_id_2,
        "mastery_score": 10,
        "confidence_level": "low",
        "state": "introduced",
        "version": None
    }
    client.post("/memory/concept/update", json=payload_2)
    
    # Try invalid jump
    payload_2['version'] = 1
    payload_2['state'] = "mastered" # Invalid from introduced
    
    response = client.post("/memory/concept/update", json=payload_2)
    if response.status_code == 400:
        print(f"✅ FSM Guard worked! Got 400 as expected.")
        print(f"   Message: {response.json()['detail']}")
    else:
        print(f"❌ FAILED. Expected 400, got {response.status_code}")

if __name__ == "__main__":
    test_optimistic_locking_and_outbox()
