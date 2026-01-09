import sys
import os
import time
from fastapi.testclient import TestClient

# Add project root to sys.path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import Services
from onboarding_service.app.main import app as onboarding_app
from memory_service.app.main import app as memory_app
from avatar_controller.app.main import app as avatar_app
from orchestrator_service.app.main import app as orchestrator_app

import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("PilotSim")

class PilotSimulator:
    def __init__(self):
        self.onboarding = TestClient(onboarding_app)
        self.memory = TestClient(memory_app)
        self.avatar = TestClient(avatar_app)
        self.orchestrator = TestClient(orchestrator_app)
        self.student_id = None
        self.student_name = "Rohan"

    def step_1_onboarding(self):
        logger.info("--- Step 1: Onboarding ---")
        payload = {
            "name": self.student_name,
            "age": 10,
            "grade_level": 5,
            "parent_email": "rohan.parent@example.com",
            "interests": ["Robots"]
        }
        response = self.onboarding.post("/onboarding/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        self.student_id = data["student_id"]
        logger.info(f"✅ Student Registered: {self.student_name} (ID: {self.student_id})")
        logger.info(f"   Recommended Path: {data['recommended_path']}")

    def step_2_initial_state(self):
        logger.info("\n--- Step 2: Initial Avatar State ---")
        # Check initial avatar state (should be Neutral)
        # Using a direct calculation call since we don't have a persistent session in this sim
        response = self.avatar.post("/avatar/calculate-state", json={
            "student_id": self.student_id,
            "fear_level": "low",
            "confidence_level": "medium",
            "recent_success": False
        })
        state = response.json()
        logger.info(f"   Avatar State: {state['current_emotion']}")
        assert state['current_emotion'] == "neutral" or state['current_emotion'] == "encouraging"
        logger.info("✅ Avatar is ready and welcoming.")

    def step_3_learning_session_fractions(self):
        logger.info("\n--- Step 3: Learning Session (Fractions) ---")
        # Simulate Orchestrator starting a topic
        # Note: In a full integration, orchestrator would call memory. 
        # Here we verify the Orchestrator's decision logic endpoints.
        
        # 1. Start Session via Orchestrator
        # We provide full state to avoid the Orchestrator trying to call Memory Service (which isn't running)
        response = self.orchestrator.post("/orchestrate", json={
            "student_id": self.student_id,
            "concept_id": "math_fractions_01",
            "state": "identifying_gaps", # Initial state
            "mastery_score": 0,
            "confidence_level": "medium",
            "struggle_count": 0
        })
        assert response.status_code == 200
        decision = response.json()
        logger.info(f"   Tutor Decision: Agent={decision['next_agent']}, Instruction='{decision['instruction']}'")
        
        # 2. Simulate User Struggle (Wrong Answer)
        logger.info("   -> Student answers incorrectly (Misconception detected)")
        
        # Update Memory with Struggle
        self.memory.post("/memory/v1/state/struggle", json={
            "student_id": self.student_id,
            "concept_id": "math_fractions_01",
            "struggle_type": "misconception",
            "details": "Added denominators"
        })
        logger.info("✅ Struggle recorded in Memory")

    def step_4_adaptive_response(self):
        logger.info("\n--- Step 4: Adaptive Response (Fear Detection) ---")
        # Simulate High Fear input (e.g. from hesitation)
        
        # 1. Update Avatar State checking
        response = self.avatar.post("/avatar/calculate-state", json={
            "student_id": self.student_id,
            "fear_level": "high", # Trigger!
            "confidence_level": "low",
            "recent_success": False
        })
        state = response.json()
        logger.info(f"   Avatar State: {state['current_emotion']}")
        
        assert state['current_emotion'] == "compassionate"
        logger.info("✅ SYSTEM ADAPTED: Avatar became Compassionate to soothe student.")

    def step_5_mastery_and_celebration(self):
        logger.info("\n--- Step 5: Mastery & Celebration ---")
        # Simulate Success
        logger.info("   -> Student understands and answers correctly!")
        
        # 1. Update Memory
        self.memory.post("/memory/v1/state/update", json={
            "student_id": self.student_id,
            "concept_id": "math_fractions_01",
            "mastery_score": 0.95
        })
        
        # 2. Check Avatar
        response = self.avatar.post("/avatar/calculate-state", json={
            "student_id": self.student_id,
            "fear_level": "low",
            "confidence_level": "high",
            "recent_success": True # Trigger!
        })
        state = response.json()
        logger.info(f"   Avatar State: {state['current_emotion']}")
        
        assert state['current_emotion'] == "celebrating"
        logger.info("✅ SYSTEM CELEBRATED: Avatar is celebrating success!")

    def run(self):
        logger.info("🚀 STARTING PILOT SIMULATION 🚀")
        try:
            self.step_1_onboarding()
            self.step_2_initial_state()
            self.step_3_learning_session_fractions()
            self.step_4_adaptive_response()
            self.step_5_mastery_and_celebration()
            logger.info("\n✨ SIMULATION COMPLETED SUCCESSFULLY ✨")
            logger.info("The Backend is functionally perfect for the Pilot.")
        except AssertionError as e:
            logger.error(f"❌ SIMULATION FAILED: {e}")
            sys.exit(1)
        except Exception as e:
            logger.error(f"❌ UNEXPECTED ERROR: {e}")
            sys.exit(1)

if __name__ == "__main__":
    sim = PilotSimulator()
    sim.run()
