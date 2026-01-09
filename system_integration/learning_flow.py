import httpx
import asyncio
import json

# Configuration (Ports based on plan)
MEMORY_URL = "http://localhost:8000"
ORCHESTRATOR_URL = "http://localhost:8001"
DIAGNOSIS_URL = "http://localhost:8002"
TEACHING_URL = "http://localhost:8003"
STRUGGLE_URL = "http://localhost:8004"

async def learning_step(student_id: str, concept_id: str, student_answer: str, response_time: float):
    print(f"\n--- New Learning Step for Student {student_id} on Concept {concept_id} ---")
    print(f"Student Answer: '{student_answer}' ({response_time}s)")
    
    async with httpx.AsyncClient() as client:
        # 1. DIAGNOSE
        print("--> 1. Calling Diagnosis Agent...")
        diag_payload = {
            "student_id": student_id,
            "concept_id": concept_id,
            "student_answer": student_answer,
            "response_time": response_time
        }
        try:
            diag_res = await client.post(f"{DIAGNOSIS_URL}/diagnose", json=diag_payload)
            diagnosis = diag_res.json()
            print(f"    Diagnosis: {diagnosis['diagnosis']} (Tags: {diagnosis['misconception_tags']})")
        except Exception as e:
            print(f"    [Error] Diagnosis failed: {e}")
            return

        # Note: Diagnosis Agent already triggered Memory Update in background (as per its implementation).
        # We might need a small delay or ensure consistency, but for this flow we assume eventual consistency or direct calling.
        # In a real sync flow, we might wait or reading logic handles it. 
        # For this prototype, we'll assume the update happened or we trust the diagnosis result is the specific truth for this turn.
        
        # 2. READ MEMORY (To get full context for Orchestrator, e.g. struggle count)
        print("--> 2. Fetching Memory Snapshot...")
        # Note: We need a topic_id for the GET endpoint created earlier '/memory/student/{}/topic/{}'. 
        # But we only have concept_id here. 
        # For simplicity in this skeleton, we might infer topic or just use the diagnosis data + previous knowledge.
        # Let's assume we can GET explicit concept state or rely on what Diagnosis returned + a struggle count tracker.
        # Ideally: GET /memory/student/{id}/concept/{id} (Added in 'Canonical API Contract' but maybe not implemented in Memory Service yet?)
        # Let's check Memory Service implementation...
        # It had `GET /memory/student/{student_id}/topic/{topic_id}`.
        # It did NOT have single concept fetch. 
        # I will implement a helper or assume we use the data we have. 
        # To strictly follow the "Orchestrator reads Memory" rule, I'll assume we pass the diagnosis data + inferred state.
        
        # Let's construct the signal for Orchestrator from Diagnosis output directly for this MVP loop, 
        # plus maybe a mock struggle count if we can't fetch it easily.
        
        signal_payload = {
            "mastery_score": diagnosis["mastery_score"],
            "confidence_level": diagnosis["confidence_level"],
            "state": diagnosis["diagnosis"],
            "struggle_count": 0, # In real app, fetch from DB. accessing diagnosis['mastery_score'] etc.
            "last_event_type": "diagnosis",
            "response_quality": diagnosis["mastery_score"]
        }
        
        print("--> 3. Calling Tutor Orchestrator...")
        try:
            orch_res = await client.post(f"{ORCHESTRATOR_URL}/orchestrate", json=signal_payload)
            decision = orch_res.json()
            print(f"    Decision: {decision['next_agent']} ('{decision['instruction']}')")
        except Exception as e:
            print(f"    [Error] Orchestrator failed: {e}")
            return

        # 4. ACT (Route to Agent)
        if decision["next_agent"] == "teaching-agent":
            print("--> 4. Routing to Teaching Agent...")
            teach_payload = {
                "student_id": student_id, 
                "concept_id": concept_id,
                "diagnosis": diagnosis["diagnosis"],
                "misconception_tags": diagnosis["misconception_tags"],
                "age": 10, # Mock
                "confidence_level": diagnosis["confidence_level"]
            }
            try:
                teach_res = await client.post(f"{TEACHING_URL}/teach", json=teach_payload)
                plan = teach_res.json()
                print("    Teaching Plan Generated:")
                for step in plan["teaching_plan"]:
                    print(f"      - [{step['mode']}] {step['content']}")
            except Exception as e:
                print(f"    [Error] Teaching Agent failed: {e}")

        elif decision["next_agent"] == "struggle-agent":
            print("--> 4. Routing to Struggle Agent...")
            # Ideally fetch struggle count and mastery from memory, but using what we have in diagnosis/signal for MVP
            struggle_payload = {
                "student_id": student_id,
                "concept_id": concept_id,
                "mastery_score": diagnosis["mastery_score"], 
                "confidence_level": diagnosis["confidence_level"],
                "struggle_count": 0 # Fetch real value in prod
            }
            try:
                # STRUGGLE_URL needs to be defined
                struggle_res = await client.post(f"{STRUGGLE_URL}/struggle", json=struggle_payload)
                task = struggle_res.json()
                print(f"    Struggle Task Generated ({task['task_type']}):")
                print(f"      - Question: {task['content']}")
                if task.get('hint_policy'):
                    print(f"      - Hints allowed: {len(task['hint_policy']['hint_levels'])}")
            except Exception as e:
                print(f"    [Error] Struggle Agent failed: {e}")
        
        elif decision["next_agent"] == "reflection-agent":
            print("--> 4. Routing to Reflection Agent (Not implemented yet)...")
            
        else:
             print(f"--> 4. Agent '{decision['next_agent']}' not ready.")

if __name__ == "__main__":
    # Test Run
    asyncio.run(learning_step(
        student_id="student-1", 
        concept_id="concept-A", 
        student_answer="3/4 is bigger because 4 is bigger", 
        response_time=5.0
    ))
