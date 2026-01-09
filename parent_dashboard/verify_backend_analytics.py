import unittest
from unittest.mock import patch, MagicMock
from app.analytics import calculate_learning_health, get_subject_breakdown, calculate_fear_index
from app.models import LearningHealth, SubjectHealth, FearIndex

class TestDashboardBackend(unittest.TestCase):
    
    @patch('app.analytics.httpx.get')
    def test_learning_health_integration(self, mock_get):
        # Mock Memory Service Response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "understanding": "strong",
            "confidence": "high",
            "fear": "low",
            "retention": "good",
            "growth_trend": "up"
        }
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        # Test client parsing
        health = calculate_learning_health("s1")
        
        self.assertIsInstance(health, LearningHealth)
        self.assertEqual(health.understanding, "strong")
        self.assertEqual(health.growth_trend, "up")
        print("✅ Test Learning Health API Parsing Passed")

    @patch('app.analytics.httpx.get')
    def test_backend_resilience(self, mock_get):
        # Simulate Service Down
        mock_get.side_effect = Exception("Connection Refused")
        
        # Test fallback
        health = calculate_learning_health("s1")
        
        self.assertEqual(health.understanding, "no_data")
        print("✅ Test Resilience Passed")

    @patch('app.analytics.httpx.get')
    def test_fear_index(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "level": "medium",
            "signals_detected": [{"type": "struggle", "count": 3}],
            "insights": ["Struggle detected"]
        }
        mock_get.return_value = mock_response
        
        fear = calculate_fear_index("s1")
        self.assertEqual(fear.level, "medium")
        self.assertEqual(fear.signals_detected[0].count, 3)
        print("✅ Test Fear Index Parsing Passed")

if __name__ == '__main__':
    unittest.main()
