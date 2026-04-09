import asyncio
import sys
from unittest.mock import MagicMock, AsyncMock, patch
import os

# Add project root to path
sys.path.append("e:/Ekaguru")

# Mock asyncpg and sentence-transformers BEFORE importing engine
sys.modules["asyncpg"] = MagicMock()
sys.modules["sentence_transformers"] = MagicMock()

from teaching_agent.app.engine import build_teaching_plan
from teaching_agent.app.models import TeachingRequest

async def verify_rag():
    print("🚀 Starting RAG Verification...")

    # Mock DB Connection and Fetch
    # Mock DB Connection Object
    mock_conn_obj = MagicMock()
    # Mock fetch to be awaitable and return data
    mock_conn_obj.fetch = AsyncMock(return_value=[
        {"text": "Photosynthesis occurs in the chloroplasts using chlorophyll.", "similarity": 0.95},
        {"text": "The process releases oxygen as a byproduct.", "similarity": 0.90}
    ])
    mock_conn_obj.close = AsyncMock()

    # Mock asyncpg.connect to be awaitable and return the connection object
    mock_connect_func = AsyncMock(return_value=mock_conn_obj)
    
    with patch("teaching_agent.app.engine.asyncpg.connect", side_effect=mock_connect_func) as mock_connect:
        with patch("teaching_agent.app.engine.get_model") as mock_get_model:
             # Mock embedding model
            mock_model = MagicMock()
            mock_model.encode.return_value.tolist.return_value = [0.1, 0.2, 0.3]
            mock_get_model.return_value = mock_model

            # Create Request
            req = TeachingRequest(
                student_id="student_123",
                concept_id="photosynthesis",
                diagnosis="misconception",
                misconception_tags=["plant_breathing"],
                age=8,
                confidence_level="low",
                fear_detected=False
            )

            print("   👉 Requesting Teaching Plan...")
            plan = await build_teaching_plan(req)

            # Verification
            print("   🔍 analyzing Plan Content...")
            if not plan.teaching_plan:
                 print("❌ Plan is empty!")
            else:
                step_1_content = plan.teaching_plan[0].content
                print(f"      Step 1: {step_1_content}")
                
            assert plan.teaching_plan, "Plan should not be empty"
            assert "From the Book" in plan.teaching_plan[0].content, "❌ RAG Context not injected"
            assert "Photosynthesis occurs" in plan.teaching_plan[0].content, "❌ Specific textbook content missing"
            
            print("\n✅ Verification Successful: RAG Context was retrieved and injected!")

if __name__ == "__main__":
    asyncio.run(verify_rag())
