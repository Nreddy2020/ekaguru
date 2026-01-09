from app.engine import AvatarEngine
import unittest

class TestAvatarController(unittest.TestCase):
    
    def test_fear_response(self):
        # High fear -> Compassionate
        emotion = AvatarEngine.determine_emotion(fear_level="high", confidence_level="low", recent_success=False)
        self.assertEqual(emotion, "compassionate")
        print("✅ Test Fear Response Passed: High Fear -> Compassionate")

    def test_success_response(self):
        # Success -> Celebrating
        emotion = AvatarEngine.determine_emotion(fear_level="low", confidence_level="high", recent_success=True)
        self.assertEqual(emotion, "celebrating")
        print("✅ Test Success Response Passed: Success -> Celebrating")
        
    def test_voice_modulation(self):
        # Compassionate -> Slower, Lower
        params = AvatarEngine.get_speech_style("compassionate")
        self.assertLess(params["rate"], 1.0)
        self.assertLess(params["pitch"], 1.0)
        print("✅ Test Voice Modulation Passed: Compassionate -> Soothing voice")

if __name__ == '__main__':
    unittest.main()
