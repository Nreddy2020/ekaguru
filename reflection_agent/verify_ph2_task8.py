from app.engine import generate_reflection
from app.models import ReflectionRequest
import unittest

class TestReflectionEnhancements(unittest.TestCase):
    
    def test_dynamic_prompts(self):
        req = ReflectionRequest(
            student_id="s1", 
            concept_id="fractions_intro", 
            mastery_score=65,
            confidence_level="medium",
            struggle_count=0,
            recent_success=True
        )
        response = generate_reflection(req)
        
        # Check self-explanation prompt
        self.assertTrue(len(response.reflection_tasks) > 0)
        prompt = response.reflection_tasks[0].prompt
        print(f"DEBUG Prompt: {prompt}")
        
        # Verify it uses the fractions template
        self.assertIn("chocolate bar", prompt.lower())
        print("✅ Test Dynamic Prompts Passed")

    def test_why_questions(self):
        req = ReflectionRequest(
            student_id="s1", 
            concept_id="fractions_compare", 
            mastery_score=85, # Trigger WHY question
            confidence_level="high",
            struggle_count=0,
            recent_success=True
        )
        response = generate_reflection(req)
        
        # Check for Why question
        why_task = next((t for t in response.reflection_tasks if t.type == "why_question"), None)
        self.assertIsNotNone(why_task)
        print(f"DEBUG Why Prompt: {why_task.prompt}")
        self.assertIn("smaller", why_task.prompt) # Assuming template
        print("✅ Test Why Questions Passed")

if __name__ == '__main__':
    unittest.main()
