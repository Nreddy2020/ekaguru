from app.engine import build_teaching_plan
from app.models import TeachingRequest
import unittest

class TestTeachingEnhancements(unittest.TestCase):
    
    def test_analogy_generation(self):
        req = TeachingRequest(
            student_id="s1", 
            concept_id="fractions_intro", 
            diagnosis="unknown",
            misconception_tags=[],
            age=10,
            confidence_level="low"
        )
        plan = build_teaching_plan(req)
        
        # Check if analogy is used in step 1
        step1_content = plan.teaching_plan[0].content
        print(f"DEBUG Step 1 Content: {step1_content}")
        
        # Verify one of the known fraction analogies is present
        known_analogies = ["pizza", "batteries", "fuel", "chocolate"]
        found = any(k in step1_content.lower() for k in known_analogies)
        self.assertTrue(found, "Analogy not found in teaching plan")
        print("✅ Test Analogy Generation Passed")

    def test_socratic_questioning(self):
        req = TeachingRequest(
            student_id="s1", 
            concept_id="fractions_compare", 
            diagnosis="misconception",
            misconception_tags=["denominator_as_bigger_number"],
            age=10,
            confidence_level="medium"
        )
        plan = build_teaching_plan(req)
        
        # Check step 2 for Socratic Question
        step2_content = plan.teaching_plan[1].content
        print(f"DEBUG Step 2 Content: {step2_content}")
        
        self.assertIn("Question:", step2_content)
        self.assertIn("pizza", step2_content.lower()) # Should use the specific question about pizza
        print("✅ Test Socratic Questioning Passed")

    def test_fallback_strategy(self):
        req = TeachingRequest(
            student_id="s1", 
            concept_id="unknown_concept", 
            diagnosis="partial",
            misconception_tags=[],
            age=10,
            confidence_level="low"
        )
        plan = build_teaching_plan(req)
        
        # Validates default fallback
        self.assertTrue(len(plan.teaching_plan) > 0)
        print("✅ Test Fallback Strategy Passed")

if __name__ == '__main__':
    unittest.main()
