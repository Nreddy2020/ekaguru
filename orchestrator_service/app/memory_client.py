import httpx
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
import time
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.last_failure_time = 0
        self.state = "CLOSED" # CLOSED, OPEN, HALF_OPEN

    def record_success(self):
        self.failures = 0
        self.state = "CLOSED"

    def record_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(f"Circuit Breaker OPENED after {self.failures} failures")

    def allow_request(self):
        if self.state == "CLOSED":
            return True
        
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
                logger.info("Circuit Breaker HALF_OPEN - probing service")
                return True
            return False
        
        # HALF_OPEN - allow 1 request (simplified)
        return True

class MemoryClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.circuit_breaker = CircuitBreaker()
        self.client = httpx.Client(timeout=5.0)

    @retry(
        stop=stop_after_attempt(3), 
        wait=wait_fixed(1),
        retry=retry_if_exception_type(httpx.RequestError)
    )
    def _call_api(self, student_id: str, concept_id: str) -> Optional[Dict[str, Any]]:
        if not self.circuit_breaker.allow_request():
            logger.warning("Circuit Breaker is OPEN. Skipping call.")
            raise CircuitBreakerOpenException("Memory Service Circuit Breaker is OPEN")

        url = f"{self.base_url}/memory/student/{student_id}/concept/{concept_id}"
        try:
            response = self.client.get(url)
            
            # If 404, it just means no state yet, which is valid (not a failure)
            if response.status_code == 404:
                self.circuit_breaker.record_success()
                return None
                
            response.raise_for_status()
            
            self.circuit_breaker.record_success()
            return response.json()
            
        except httpx.RequestError as e:
            self.circuit_breaker.record_failure()
            logger.error(f"Memory Service call failed: {str(e)}")
            raise e
        except httpx.HTTPStatusError as e:
            # 5xx errors are failures, 4xx (except 404 handled above) might be application errors
            if 500 <= e.response.status_code < 600:
                self.circuit_breaker.record_failure()
            logger.error(f"Memory Service returned error: {e.response.status_code}")
            raise e

    def get_student_state(self, student_id: str, concept_id: str) -> Dict[str, Any]:
        try:
            data = self._call_api(student_id, concept_id)
            if not data:
                return {"state": "unknown", "mastery_score": 0, "confidence_level": "unknown"}
            return data
        except CircuitBreakerOpenException:
            # Fallback
            return {"state": "unknown", "error": "circuit_breaker_open"}
        except Exception as e:
            # Fallback
            logger.error(f"Final error fetching state: {e}")
            return {"state": "unknown", "error": str(e)}
