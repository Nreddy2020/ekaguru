from app.logic import diagnose
import unittest

class TestDiagnosisEnhancements(unittest.TestCase):
    
    def test_fear_detection(self):
        # Test explicit fear
        result = diagnose("s1", "c1", "I hate math and I'm stupid", 5.0)
        self.assertEqual(result.diagnosis, "unknown")
        self.assertIn("fear_avoidance", result.misconception_tags)
        self.assertIn("emotional_block", result.misconception_tags)
        self.assertEqual(result.recommended_next, "observe")
        print("✅ Test Fear Detection Passed")

    def test_expanded_misconception(self):
        # Test new fraction misconception
        result = diagnose("s1", "c1", "The bigger denominator means it's bigger", 3.0)
        self.assertEqual(result.diagnosis, "misconception")
        self.assertIn("denominator_as_bigger_number", result.misconception_tags)
        self.assertEqual(result.recommended_next, "rebuild_concept")
        print("✅ Test Misconception Passed")

    def test_understanding(self):
        # Test basic understanding
        result = diagnose("s1", "c1", "A fraction is a part of a whole", 10.0)
        self.assertEqual(result.diagnosis, "understood")
        self.assertEqual(result.recommended_next, "reflect")
        print("✅ Test Understanding Passed")
        
    def test_partial_fallback(self):
        # Test fallback
        result = diagnose("s1", "c1", "maybe numbers", 2.0)
        self.assertEqual(result.diagnosis, "partial")
        self.assertEqual(result.recommended_next, "struggle")
        print("✅ Test Partial/Fallback Passed")

if __name__ == '__main__':
    unittest.main()
