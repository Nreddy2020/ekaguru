from .models import OrchestratorDecision

def _observe():
    return OrchestratorDecision(
        next_state="observe",
        next_agent="curiosity-agent",
        instruction="Trigger curiosity using real-life example",
        tone="friendly",
        depth="light"
    )

def _diagnose():
    return OrchestratorDecision(
        next_state="diagnose",
        next_agent="diagnosis-agent",
        instruction="Analyze concept understanding",
        tone="neutral",
        depth="analysis"
    )

def _explain(reason=""):
    return OrchestratorDecision(
        next_state="explain",
        next_agent="teaching-agent",
        instruction=f"Rebuild concept: {reason}",
        tone="gentle",
        depth="basic"
    )

def _struggle():
    return OrchestratorDecision(
        next_state="struggle",
        next_agent="struggle-agent",
        instruction="Provide slightly harder guided problem",
        tone="encouraging",
        depth="medium"
    )

    return OrchestratorDecision(
        next_state="reflect",
        next_agent="reflection-agent",
        instruction="Ask student to explain in own words",
        tone="calm",
        depth="deep"
    )

# Correction: The logic was simple python dict return in the prompt, but here we use the Pydantic model.

# Re-writing helper functions to properly instantiate the model.
def _reflect_model():
    return OrchestratorDecision(
        next_state="reflect",
        next_agent="reflection-agent",
        instruction="Ask student to explain in own words",
        tone="calm",
        depth="deep"
    )

def decide_next(signal: dict) -> OrchestratorDecision:
    mastery = signal.get("mastery_score", 0)
    confidence = signal.get("confidence_level", "low")
    state = signal.get("state", "unknown")
    struggle = signal.get("struggle_count", 0)

    # START / UNKNOWN
    if state == "unknown":
        return _observe()

    # MISCONCEPTION
    if state == "misconception":
        return _explain(reason="clear misconception")

    # PARTIAL UNDERSTANDING
    if state == "partial":
        if struggle >= 2:
            return _explain(reason="too much struggle")
        return _struggle()

    # UNDERSTOOD but LOW CONFIDENCE
    if state == "understood" and confidence == "low":
        return _struggle()

    # UNDERSTOOD + CONFIDENT
    if state in ["understood", "mastered"] and confidence == "high":
        return _reflect_model()

    # FALLBACK
    return _diagnose()
