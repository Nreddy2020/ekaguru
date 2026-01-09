from .models import TransferRequest, TransferResponse, TransferTask, MasteryDecision
from typing import List
import random

class FarTransferScenarioGenerator:
    @staticmethod
    def get_scenario(concept_id: str) -> str:
        SCENARIOS = {
            "fractions": [
                "Cooking: Scaling a recipe for 3 people down to 1 person.",
                "Music: Quarter notes vs eighth notes in a rhythm.",
                "Sports: Win ratios (e.g., winning 1 out of 3 games vs 2 out of 5 games)."
            ],
            "decimals": [
                "Shopping: Comparing prices per ounce at the grocery store.",
                "Running: Comparing race times (10.5s vs 10.05s).",
                "Science: Measuring liquids in a beaker precisely."
            ]
        }
        # Fallback
        base_concept = concept_id.split('_')[0]
        if base_concept in SCENARIOS:
            return random.choice(SCENARIOS[base_concept])
        return "Can you find this same idea in a completely different situation? (e.g., money, cooking, or sports)"

def generate_transfer_tasks(req: TransferRequest) -> TransferResponse:
    """
    Generate knowledge transfer tasks based on mastery level
    Tests: Teach-back, Near Transfer, Far Transfer, Creative Transfer
    """
    
    tasks: List[TransferTask] = []
    
    # 1. ALWAYS include teach-back (most important indicator of understanding)
    tasks.append(TransferTask(
        type="teach_back",
        prompt="Explain this concept in your own words, as if teaching a friend who has never heard of it."
    ))
    
    # 2. Near Transfer (same concept, different surface details)
    # Triggered for mastery >= 70
    if req.mastery_score >= 70:
        tasks.append(TransferTask(
            type="near_transfer",
            prompt="Apply this concept to solve a similar problem with different numbers or objects."
        ))
    
    # 3. Far Transfer (different domain, same underlying principle)
    # Triggered for mastery >= 80
    if req.mastery_score >= 80:
        scenario = FarTransferScenarioGenerator.get_scenario(req.concept_id)
        tasks.append(TransferTask(
            type="far_transfer",
            prompt=f"Far Transfer Challenge: How would you use this concept in the following situation? {scenario}"
        ))
    
    # 4. Predictive Transfer (scientific thinking)
    # Triggered for mastery >= 85
    if req.mastery_score >= 85:
        tasks.append(TransferTask(
            type="predictive",
            prompt="What do you think will happen if we change one part of this concept? Why?"
        ))
    
    # 5. Creative Transfer (ownership of knowledge)
    # Triggered for mastery >= 90
    if req.mastery_score >= 90:
        tasks.append(TransferTask(
            type="creative",
            prompt="Create your own story or problem using this concept. Make it interesting!"
        ))
    
    # Mastery decision is pending until student completes transfer tasks
    mastery_decision = None
    
    return TransferResponse(
        transfer_tasks=tasks,
        mastery_decision=mastery_decision
    )

def evaluate_transfer(req: TransferRequest, student_responses: List[str]) -> MasteryDecision:
    """
    Evaluate transfer task responses and determine mastery state
    
    In production, this would:
    - Use NLP to evaluate clarity of teach-back
    - Check correctness of near/far transfer applications
    - Assess creativity and logical consistency
    
    For now, we use a simplified heuristic
    """
    
    # Mock evaluation logic
    # In reality: NLP analysis + correctness checking
    transfer_quality_score = req.mastery_score  # Placeholder
    
    # Decision rules
    if transfer_quality_score >= 80 and req.confidence_level == "high":
        new_state = "mastered"
        new_mastery = min(100, req.mastery_score + 10)
    elif transfer_quality_score >= 65:
        new_state = "understood"
        new_mastery = req.mastery_score
    else:
        new_state = "partial"
        new_mastery = max(40, req.mastery_score - 10)
    
    return MasteryDecision(
        new_state=new_state,
        new_mastery_score=new_mastery,
        transfer_quality_score=transfer_quality_score
    )
