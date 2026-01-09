from app.engine import generate_transfer_tasks
from app.models import TransferRequest
import unittest

class TestTransferEnhancements(unittest.TestCase):
    
    def test_far_transfer_scenario(self):
        req = TransferRequest(
            student_id="s1", 
            concept_id="fractions_mastery", 
            mastery_score=85, # Trigger Far Transfer
            confidence_level="high",
            age=10
        )
        response = generate_transfer_tasks(req)
        
        # Check logic
        far_task = next((t for t in response.transfer_tasks if t.type == "far_transfer"), None)
        self.assertIsNotNone(far_task)
        print(f"DEBUG Scenario: {far_task.prompt}")
        
        # Verify scenario keywords
        keywords = ["cooking", "music", "sports"]
        found = any(k in far_task.prompt.lower() for k in keywords)
        self.assertTrue(found, "No valid scenario found")
        print("✅ Test Far Transfer Scenario Passed")

if __name__ == '__main__':
    unittest.main()
