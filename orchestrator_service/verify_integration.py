from fastapi.testclient import TestClient
from app.main import app, memory_client
from app.memory_client import MemoryClient
from app import models
import unittest
from unittest.mock import MagicMock, patch
import httpx
import time

client = TestClient(app)

class TestOrchestratorIntegration(unittest.TestCase):
    
    def setUp(self):
        # Reset circuit breaker
        memory_client.circuit_breaker.record_success()

    @patch('httpx.Client.get')
    def test_signal_with_state_no_call(self, mock_get):
        # If state provided, should not call Memory Service
        payload = {
            "student_id": "123",
            "concept_id": "abc",
            "state": "misconception",
            "mastery_score": 20,
            "confidence_level": "high"
        }
        response = client.post("/orchestrate", json=payload)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify decision for misconception is to EXPLAIN
        self.assertEqual(data['next_state'], "explain")
        self.assertIn("clear misconception", data['instruction'])
        
        # Verify mocked GET was NOT called
        mock_get.assert_not_called()
        print("✅ Test 1 Passed: Signal with state -> No Memory Call")

    @patch('httpx.Client.get')
    def test_signal_missing_state_fetches_memory(self, mock_get):
        # Mock Memory Service Response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "state": "introduced",
            "mastery_score": 10,
            "confidence_level": "low"
        }
        mock_get.return_value = mock_response

        # Payload without state
        payload = {
            "student_id": "123",
            "concept_id": "abc",
            "state": None 
        }
        response = client.post("/orchestrate", json=payload)
        
        self.assertEqual(response.status_code, 200)
        
        # Verify mocked GET WAS called
        mock_get.assert_called_once()
        print("✅ Test 2 Passed: Missing state -> Fetched from Memory Service")

    @patch('httpx.Client.get')
    def test_circuit_breaker(self, mock_get):
        # Simulate failures
        mock_get.side_effect = httpx.RequestError("Connection refused")
        
        # Threshold is 3 failures
        
        # Fail 1
        res = memory_client.get_student_state("s1", "c1")
        self.assertIn("error", res)
        
        # Fail 2
        res = memory_client.get_student_state("s1", "c1")
        self.assertIn("error", res)
            
        # Fail 3 -> Open Circuit
        res = memory_client.get_student_state("s1", "c1")
        self.assertIn("error", res)
            
        # Check State
        self.assertEqual(memory_client.circuit_breaker.state, "OPEN")
        print("✅ Test 3 Passed: Circuit Breaker Opened after failures")
        
        # Fail 4 - Should be blocked immediately (no mock call)
        mock_get.reset_mock()
        res = memory_client.get_student_state("s1", "c1")
        self.assertEqual(res.get("error"), "circuit_breaker_open")
            
        mock_get.assert_not_called()
        print("✅ Test 4 Passed: Circuit Breaker blocked request")

if __name__ == '__main__':
    unittest.main()
