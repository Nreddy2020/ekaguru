from app.engine import select_task
from app.models import StruggleRequest
import unittest

class TestStruggleEnhancements(unittest.TestCase):
    
    def test_hint_scaffolding(self):
        req = StruggleRequest(
            student_id="s1", 
            concept_id="fractions_compare", 
            mastery_score=50, # Competent -> Guided
            confidence_level="low",
            struggle_count=1
        )
        response = select_task(req)
        
        hints = response.hint_policy.hint_levels
        print(f"DEBUG Hints: {hints}")
        
        self.assertEqual(len(hints), 3)
        self.assertIn("Visual Hint", hints[0])
        self.assertIn("Concept Hint", hints[1])
        self.assertIn("Strategy Hint", hints[2])
        print("✅ Test Hint Scaffolding Passed")

if __name__ == '__main__':
    unittest.main()
