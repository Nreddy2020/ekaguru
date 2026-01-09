import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from learning_flow import learning_step

async def run_verification():
    print("Starting Struggle Integration Verification (Mocked Services)...")

    # MOCK RESPONSES
    
    # 1. Diagnosis: Partial understanding
    mock_diagnosis = {
        "diagnosis": "partial",
        "mastery_score": 50,
        "confidence_level": "medium",
        "misconception_tags": [],
        "concept_id": "concept-B",
        "recommended_next": "struggle"
    }

    # 2. Orchestrator: Decide -> Struggle
    mock_decision = {
        "next_state": "struggle",
        "next_agent": "struggle-agent",
        "instruction": "Provide guided practice",
        "tone": "encouraging",
        "depth": "medium"
    }

    # 3. Struggle Agent: Guided Task
    mock_task = {
        "task_type": "guided",
        "content": "Guided question content...",
        "hint_policy": {
            "max_attempts": 3,
            "hint_levels": ["hint1", "hint2"]
        }
    }

    # PATCH httpx.AsyncClient.post
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        # Side effect to handle different URLs
        def side_effect(*args, **kwargs):
            # Extract URL
            url = ""
            for arg in args:
                if isinstance(arg, str) and ("http" in arg or "localhost" in arg):
                    url = arg
                    break
            if not url:
                url = kwargs.get("url", "")
            
            print(f"[Mock] POST called: {url}")
            mock_resp = AsyncMock()
            mock_resp.status_code = 200
            
            if "diagnose" in url:
                mock_resp.json = MagicMock(return_value=mock_diagnosis)
            elif "orchestrate" in url:
                mock_resp.json = MagicMock(return_value=mock_decision)
            elif "struggle" in url:
                mock_resp.json = MagicMock(return_value=mock_task)
            else:
                 mock_resp.json = MagicMock(return_value={})
                 
            return mock_resp
        
        mock_post.side_effect = side_effect

        # RUN THE FLOW
        await learning_step(
            student_id="student-1",
            concept_id="concept-B",
            student_answer="I think it's about half...",
            response_time=8.0
        )

        # VERIFY CALLS
        call_args_list = mock_post.call_args_list
        # Expect 3 calls: Diagnosis -> Orchestrator -> Struggle
        assert len(call_args_list) == 3, f"Expected 3 service calls, got {len(call_args_list)}"
        
        # Check routing
        assert "struggle" in call_args_list[2][0][0]
        print("3. [x] Struggle Agent called successfully")

    print("\nVerification PASSED: Route to Struggle Agent works.")

if __name__ == "__main__":
    try:
        asyncio.run(run_verification())
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
