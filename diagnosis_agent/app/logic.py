from .models import DiagnosisResult
import re

# Layer 1: Deterministic Rules (Misconception Dictionary)
KNOWN_MISCONCEPTIONS = {
    # Fractions
    "denominator_as_bigger_number": ["bigger denominator", "4 is bigger than 2", "larger number at bottom", "bigger bottom"],
    "numerator_as_whole": ["top number only", "just the numerator"],
    "adding_denominators": ["add the bottoms", "add denominators"],
    # Decimals
    "longer_decimal_is_larger": ["longer number", "more digits", "0.123 is bigger than 0.2"],
    # Algebra
    "conflating_variable_with_label": ["a is apples", "letter is object"],
}

# Fear/Anxiety Keywords
FEAR_TRIGGERS = [
    "i don't know", "idk", "pass", "skip", "give up",
    "i can't", "too hard", "i'm stupid", "im stupid", "dumb",
    "hate math", "confusing", "scared", "never get this", "hate this"
]

def detect_fear(text: str) -> bool:
    text_lower = text.lower()
    for trigger in FEAR_TRIGGERS:
        if trigger in text_lower:
            return True
    return False

def diagnose(student_id: str, concept_id: str, answer: str, response_time: float) -> DiagnosisResult:
    answer_lower = answer.lower().strip()
    
    # --- Layer 1: Fear / Avoidance Checks ---
    if not answer_lower or detect_fear(answer_lower):
        # High-priority signal: Fear or Disengagement
        return DiagnosisResult(
            concept_id=concept_id,
            diagnosis="unknown", # State effectively unknown due to fear
            mastery_score=0,
            confidence_level="low",
            misconception_tags=["fear_avoidance", "emotional_block"],
            recommended_next="observe" # Orchestrator should switch to Curiosity/Support
        )

    # --- Layer 2: Misconception Pattern Matching (Rule-based) ---
    detected_misconceptions = []
    for tag, patterns in KNOWN_MISCONCEPTIONS.items():
        for pattern in patterns:
            if pattern in answer_lower:
                detected_misconceptions.append(tag)
    
    if detected_misconceptions:
        return DiagnosisResult(
            concept_id=concept_id,
            diagnosis="misconception",
            mastery_score=20, # Low mastery
            confidence_level="medium",  # Often misconceptions are held with confidence
            misconception_tags=detected_misconceptions,
            recommended_next="rebuild_concept" # Orchestrator -> Teaching Agent
        )

    # --- Layer 3: Semantic/LLM Simulation (Simplified) ---
    # Correctness check (Heuristic for demo)
    # Real system: Use LLM or embeddings to verify understanding
    
    # Identifying correct conceptual keywords
    correct_keywords = ["part of", "divide", "share", "fraction", "ratio", "portion"]
    
    is_elaborate = len(answer.split()) > 4 # Length heuristic for explanation quality

    if any(k in answer_lower for k in correct_keywords) or is_elaborate:
        # Heuristic: Good keywords or detailed answer -> Understood
        return DiagnosisResult(
            concept_id=concept_id,
            diagnosis="understood",
            mastery_score=80,
            confidence_level="high",
            misconception_tags=[],
            recommended_next="reflect" # Orchestrator -> Reflection Agent
        )

    # --- Layer 4: Fallback (Partial Understanding) ---
    return DiagnosisResult(
        concept_id=concept_id,
        diagnosis="partial",
        mastery_score=40,
        confidence_level="low",
        misconception_tags=["partial_understanding"],
        recommended_next="struggle" # Orchestrator -> Struggle Agent
    )
