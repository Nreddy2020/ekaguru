from .models import ReflectionRequest, ReflectionResponse, ReflectionTask, MemoryStateUpdate
from datetime import datetime, timedelta

class ReflectionPromptGenerator:
    @staticmethod
    def get_self_explanation_prompt(concept_id: str) -> str:
        PROMPTS = {
            "fractions": "Imagine you have a chocolate bar. Explain how you would share it with friends using fractions.",
            "decimals": "Explain how 0.5 is related to 1/2. Use money (cents) as an example.",
            "algebra": "Why do we use letters like 'x' in match? What do they stand for?"
        }
        # Fallback
        return PROMPTS.get(concept_id.split('_')[0], "Explain this concept in your own words, as if teaching a friend.")

    @staticmethod
    def get_why_prompt(concept_id: str) -> str:
        WHY_PROMPTS = {
            "fractions": "Why does the slice get smaller when the bottom number gets bigger?",
            "decimals": "Why is 0.1 bigger than 0.09?",
            "algebra": "Why do we need to balance the equation on both sides?"
        }
        return WHY_PROMPTS.get(concept_id.split('_')[0], "Why does this concept work the way it does?")

def calculate_next_review(mastery_score: int, confidence_level: str, struggle_count: int) -> str:
    """Calculate next review date based on spaced repetition principles"""
    
    # Base intervals by mastery
    if mastery_score < 40:
        base_days = 1  # Introduced
    elif mastery_score < 60:
        base_days = 2  # Partial
    elif mastery_score < 80:
        base_days = 7  # Understood
    else:
        base_days = 21  # Mastered
    
    # Adjust for struggle
    if struggle_count > 2:
        base_days = max(1, base_days // 2)  # Shorten interval
    
    # Adjust for confidence
    if confidence_level == "high":
        base_days = int(base_days * 1.5)  # Extend interval
    elif confidence_level == "low":
        base_days = max(1, base_days // 2)  # Shorten interval
    
    next_review = datetime.now() + timedelta(days=base_days)
    return next_review.strftime("%Y-%m-%d")

def generate_reflection(req: ReflectionRequest) -> ReflectionResponse:
    """Generate reflection tasks and schedule next review"""
    
    tasks = []
    
    # 1. Always include self-explanation (best predictor of deep learning)
    prompt = ReflectionPromptGenerator.get_self_explanation_prompt(req.concept_id)
    tasks.append(ReflectionTask(
        type="self_explanation",
        prompt=prompt
    ))
    
    # 2. If there was struggle, include error reflection
    if req.struggle_count > 1:
        tasks.append(ReflectionTask(
            type="error_recall",
            prompt="What was confusing about this earlier? What helped you understand it?"
        ))
    
    # 3. For higher mastery, add causal reasoning
    if req.mastery_score >= 60:
        why_prompt = ReflectionPromptGenerator.get_why_prompt(req.concept_id)
        tasks.append(ReflectionTask(
            type="why_question",
            prompt=why_prompt
        ))
    
    # 4. For mastered concepts, add teach-back
    if req.mastery_score >= 80:
        tasks.append(ReflectionTask(
            type="teach_back",
            prompt="Summarize this concept in one clear sentence."
        ))
    
    # Calculate next review date
    next_review = calculate_next_review(
        req.mastery_score,
        req.confidence_level,
        req.struggle_count
    )
    
    # Determine memory state update
    memory_update = None
    if req.recent_success and req.mastery_score >= 70:
        # Successful reflection after struggle -> upgrade state
        new_mastery = min(100, req.mastery_score + 10)
        new_state = "mastered" if new_mastery >= 85 else "understood"
        memory_update = MemoryStateUpdate(
            state=new_state,
            mastery_score=new_mastery
        )
    
    return ReflectionResponse(
        reflection_tasks=tasks,
        next_review=next_review,
        memory_state_update=memory_update
    )
