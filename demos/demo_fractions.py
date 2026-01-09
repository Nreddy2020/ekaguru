"""
End-to-End Demo: Math (Fractions)
Demonstrates the complete cognitive learning flow from ignorance to mastery
"""

import asyncio
import httpx
from datetime import datetime

# Service URLs
MEMORY_URL = "http://localhost:8000"
ORCHESTRATOR_URL = "http://localhost:8001"
DIAGNOSIS_URL = "http://localhost:8002"
TEACHING_URL = "http://localhost:8003"
STRUGGLE_URL = "http://localhost:8004"
REFLECTION_URL = "http://localhost:8005"
TRANSFER_URL = "http://localhost:8007"

STUDENT_ID = "student-demo-1"
CONCEPT_ID = "fraction-comparison"

async def run_demo():
    print("=" * 80)
    print("🎓 EKAGURU COGNITIVE TUTOR - DEMO A: FRACTIONS")
    print("=" * 80)
    print("\n👧 Student Profile:")
    print("   Age: 10, Grade: 5")
    print("   Fear: Math word problems")
    print("   Concept: Fractions - Comparison")
    print("\n" + "=" * 80)
    
    async with httpx.AsyncClient() as client:
        
        # STEP 0: Memory Check (Initial State)
        print("\n📊 STEP 0: Memory Check (Before Teaching)")
        print("-" * 80)
        print("Initial State: unknown, Mastery: 0, Confidence: low")
        
        # STEP 1: Observation (Curiosity Agent - not implemented, simulated)
        print("\n🔍 STEP 1: Observation & Curiosity")
        print("-" * 80)
        print("Tutor: 'Imagine you and your friend share one pizza.'")
        print("       'If two people share it, then four people share it - who gets more?'")
        print("Child: 'Two people...'")
        print("✓ Curiosity triggered, no correction yet")
        
        # STEP 2: Diagnosis
        print("\n🩺 STEP 2: Diagnosis Agent")
        print("-" * 80)
        print("Tutor: 'Which is bigger: 1/2 or 1/4? Why?'")
        print("Child: '1/4 because 4 is bigger.'")
        
        diag_payload = {
            "student_id": STUDENT_ID,
            "concept_id": CONCEPT_ID,
            "student_answer": "1/4 is bigger because 4 is bigger than 2",
            "response_time": 3.5
        }
        
        try:
            diag_res = await client.post(f"{DIAGNOSIS_URL}/diagnose", json=diag_payload)
            diagnosis = diag_res.json()
            print(f"\n✓ Diagnosis: {diagnosis['diagnosis']}")
            print(f"  Misconception: {diagnosis['misconception_tags']}")
            print(f"  Mastery Score: {diagnosis['mastery_score']}")
            print(f"  Confidence: {diagnosis['confidence_level']}")
        except Exception as e:
            print(f"⚠ Diagnosis service unavailable (mock): {e}")
            diagnosis = {
                "diagnosis": "misconception",
                "misconception_tags": ["denominator_as_bigger_number"],
                "mastery_score": 30,
                "confidence_level": "low"
            }
        
        # STEP 3: Orchestrator Decision
        print("\n🎯 STEP 3: Tutor Orchestrator Decision")
        print("-" * 80)
        
        signal = {
            "mastery_score": diagnosis["mastery_score"],
            "confidence_level": diagnosis["confidence_level"],
            "state": diagnosis["diagnosis"],
            "struggle_count": 0,
            "last_event_type": "diagnosis",
            "response_quality": 30
        }
        
        try:
            orch_res = await client.post(f"{ORCHESTRATOR_URL}/orchestrate", json=signal)
            decision = orch_res.json()
            print(f"✓ Next Agent: {decision['next_agent']}")
            print(f"  Instruction: {decision['instruction']}")
            print(f"  Tone: {decision['tone']}")
        except Exception as e:
            print(f"⚠ Orchestrator service unavailable (mock): {e}")
            decision = {
                "next_agent": "teaching-agent",
                "instruction": "Rebuild fraction concept from experience",
                "tone": "gentle"
            }
        
        # STEP 4: Teaching Agent
        print("\n🧑‍🏫 STEP 4: Teaching Agent (Concept Reconstruction)")
        print("-" * 80)
        
        teach_payload = {
            "student_id": STUDENT_ID,
            "concept_id": CONCEPT_ID,
            "diagnosis": diagnosis["diagnosis"],
            "misconception_tags": diagnosis["misconception_tags"],
            "age": 10,
            "confidence_level": diagnosis["confidence_level"]
        }
        
        try:
            teach_res = await client.post(f"{TEACHING_URL}/teach", json=teach_payload)
            plan = teach_res.json()
            print("✓ Teaching Plan Generated:")
            for step in plan["teaching_plan"]:
                print(f"  [{step['mode'].upper()}] {step['content'][:80]}...")
        except Exception as e:
            print(f"⚠ Teaching service unavailable (mock): {e}")
        
        # STEP 5: Guided Struggle
        print("\n⚔️ STEP 5: Guided Struggle Agent")
        print("-" * 80)
        print("Tutor: 'Which is bigger: 1/2 or 3/8? Think before answering.'")
        print("Child: (hesitates) '1/2?'")
        print("Tutor: 'Why do you think so?'")
        print("Child: 'Because fewer people share.'")
        
        struggle_payload = {
            "student_id": STUDENT_ID,
            "concept_id": CONCEPT_ID,
            "mastery_score": 60,  # Improved after teaching
            "confidence_level": "medium",
            "struggle_count": 1
        }
        
        try:
            struggle_res = await client.post(f"{STRUGGLE_URL}/struggle", json=struggle_payload)
            task = struggle_res.json()
            print(f"\n✓ Struggle Task: {task['task_type']}")
            print(f"  Question: {task['content'][:80]}...")
            print("✓ Success! Confidence improved")
        except Exception as e:
            print(f"⚠ Struggle service unavailable (mock): {e}")
        
        # STEP 6: Reflection
        print("\n🔁 STEP 6: Reflection Agent")
        print("-" * 80)
        print("Tutor: 'Explain what a fraction means in your own words.'")
        print("Child: 'It shows how much you get when something is shared.'")
        
        reflect_payload = {
            "student_id": STUDENT_ID,
            "concept_id": CONCEPT_ID,
            "mastery_score": 75,
            "confidence_level": "medium",
            "struggle_count": 1,
            "recent_success": True
        }
        
        try:
            reflect_res = await client.post(f"{REFLECTION_URL}/reflect", json=reflect_payload)
            reflection = reflect_res.json()
            print(f"\n✓ Reflection Tasks: {len(reflection['reflection_tasks'])} tasks")
            print(f"  Next Review: {reflection['next_review']}")
            if reflection.get('memory_state_update'):
                print(f"  Memory Update: {reflection['memory_state_update']['state']}")
                print(f"  New Mastery: {reflection['memory_state_update']['mastery_score']}")
        except Exception as e:
            print(f"⚠ Reflection service unavailable (mock): {e}")
        
        # STEP 7: Knowledge Transfer
        print("\n🚀 STEP 7: Knowledge Transfer Agent")
        print("-" * 80)
        print("Tutor: 'If 2 out of 5 teams qualify, how is this like fractions?'")
        print("Child: 'It's like 2/5 teams qualified.'")
        
        transfer_payload = {
            "student_id": STUDENT_ID,
            "concept_id": CONCEPT_ID,
            "mastery_score": 85,
            "confidence_level": "high",
            "age": 10
        }
        
        try:
            transfer_res = await client.post(f"{TRANSFER_URL}/transfer", json=transfer_payload)
            transfer = transfer_res.json()
            print(f"\n✓ Transfer Tasks: {len(transfer['transfer_tasks'])} tasks")
            for task in transfer["transfer_tasks"]:
                print(f"  - {task['type']}: {task['prompt'][:60]}...")
            print("\n🎉 Transfer Success!")
        except Exception as e:
            print(f"⚠ Transfer service unavailable (mock): {e}")
        
        # Final Result
        print("\n" + "=" * 80)
        print("🟢 FINAL RESULT")
        print("=" * 80)
        print("✓ State: MASTERED")
        print("✓ Mastery Score: 92")
        print("✓ Confidence: HIGH")
        print("✓ Fear: REDUCED")
        print("✓ Mental model: CORRECTED")
        print("✓ Child can: EXPLAIN & APPLY")
        print("✓ Long-term memory: CREATED")
        print("\n" + "=" * 80)
        print("This is not EdTech. This is Cognitive Skill Engineering.")
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_demo())
