import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from learning_flow import learning_step

async def run_verification():
    print("Starting Full Cognitive Loop Verification (Mocked Services)...")

    # MOCK RESPONSES
    
    # 1. Diagnosis Response
    mock_diagnosis = {
        "diagnosis": "misconception",
        "mastery_score": 30,
        "confidence_level": "low",
        "misconception_tags": ["denominator_as_bigger_number"],
        "concept_id": "concept-A",
        "recommended_next": "rebuild_concept"
    }

    # 2. Orchestrator Response
    mock_decision = {
        "next_state": "explain",
        "next_agent": "teaching-agent",
        "instruction": "Rebuild using pizza analogy",
        "tone": "gentle",
        "depth": "basic"
    }

    # 3. Teaching Agent Response
    mock_plan = {
        "teaching_plan": [
            {"step": 1, "mode": "experience", "content": "Pizza example..."},
            {"step": 2, "mode": "symbol", "content": "1/2 > 1/4"}
        ],
        "checkpoints": ["Check understanding"]
    }

    # PATCH httpx.AsyncClient.post
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        # Configure side effects based on URL called
        # Configure side effects based on URL called
        def side_effect(*args, **kwargs):
            print(f"[DEBUG] Mock called with args: {str(args)}")
            
            # args[0] might be 'self' if patched on class
            # We look for the first string argument which should be the URL
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
            
            # Use MagicMock for .json() because httpx.Response.json() is synchronous
            if "diagnose" in url:
                mock_resp.json = MagicMock(return_value=mock_diagnosis)
            elif "orchestrate" in url:
                mock_resp.json = MagicMock(return_value=mock_decision)
            elif "teach" in url:
                mock_resp.json = MagicMock(return_value=mock_plan)
            else:
                 print(f"[Mock] Unknown URL: {url}")
                 mock_resp.json = MagicMock(return_value={})
                 
            return mock_resp
        
        mock_post.side_effect = side_effect

        # RUN THE FLOW
        await learning_step(
            student_id="student-1",
            concept_id="concept-A",
            student_answer="3/4 is bigger because 4 is bigger",
            response_time=5.0
        )

        # VERIFY CALLS
        print("\nVerifying Call Sequence:")
        
        # Check Call 1: Diagnosis
        call_args_list = mock_post.call_args_list
        assert len(call_args_list) == 3, f"Expected 3 service calls, got {len(call_args_list)}"
        
        # 1. Diagnosis
        assert "diagnose" in call_args_list[0][0][0]
        print("1. [x] Diagnosis Agent called")
        
        # 2. Orchestrator
        assert "orchestrate" in call_args_list[1][0][0]
        # Check correctness of orchestrator input (derived from diagnosis)
        orch_input = call_args_list[1].kwargs['json']
        assert orch_input['state'] == "misconception"
        print("2. [x] Orchestrator called (Logic: Diagnosis result forwarded)")

        # 3. Teaching
        assert "teach" in call_args_list[2][0][0]
        print("3. [x] Teaching Agent called (Logic: Orchestrator decision followed)")

    print("\nVerification PASSED: Full Cognitive Loop is wired correctly.")

if __name__ == "__main__":
    try:
        asyncio.run(run_verification())
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        import traceback
        traceback.print_exc()
