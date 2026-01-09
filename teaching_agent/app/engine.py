from .models import TeachingRequest, TeachingPlan, TeachingStep
import random

# --- Knowledge Base (Simulating LLM/RAG) ---
ANALOGIES = {
    "fractions": [
        "sharing a pizza with friends",
        "batteries charging (bars)",
        "fuel gauge in a car",
        "splitting a chocolate bar"
    ],
    "decimals": [
        "money (cents are parts of a dollar)",
        "digital stopwatch timing",
        "measuring cups"
    ],
    "algebra": [
        "balancing a see-saw",
        "mystery box with a number inside",
        "recipes (scaling up or down)"
    ]
}

SOCRATIC_QUESTIONS = {
    "denominator_as_bigger_number": [
        "If you share a pizza with 2 people vs 10 people, when do you get a bigger slice?",
        "Does a bigger number at the bottom mean more pieces or bigger pieces?",
        "What happens to the size of the slice as we cut the pizza into more parts?"
    ],
    "general": [
        "How would you explain this to a younger friend?",
        "What makes you think that?",
        "Can you draw a picture of what you mean?"
    ]
}

class AnalogyGenerator:
    @staticmethod
    def get_analogy(concept_id: str) -> str:
        # Simple keyword matching for demo
        for key, analogies in ANALOGIES.items():
            if key in concept_id.lower():
                return random.choice(analogies)
        return "sharing a cake" # Default

class SocraticEngine:
    @staticmethod
    def get_questions(misconception_tags: list) -> list:
        questions = []
        for tag in misconception_tags:
            if tag in SOCRATIC_QUESTIONS:
                questions.extend(SOCRATIC_QUESTIONS[tag])
        
        if not questions:
            questions = SOCRATIC_QUESTIONS["general"]
            
        return questions

def build_teaching_plan(req: TeachingRequest) -> TeachingPlan:
    steps = []
    checkpoints = []
    
    analogy = AnalogyGenerator.get_analogy(req.concept_id)
    questions = SocraticEngine.get_questions(req.misconception_tags)
    
    # --- Strategy: Misconception Rebuild (Socratic) ---
    if req.diagnosis == "misconception":
        # Step 1: Validate feelings (Empathy)
        steps.append(TeachingStep(
            step=1,
            mode="experience",
            content=f"It's tricky! A lot of people think that. Let's think about {analogy}."
        ))

        # Step 2: Socratic Challenge (Intuition)
        steps.append(TeachingStep(
            step=2,
            mode="intuition",
            content=f"Question: {questions[0] if questions else 'Why is that?'}"
        ))

        # Step 3: Concrete Proof (Symbol)
        steps.append(TeachingStep(
            step=3,
            mode="symbol",
            content="Let's look at the numbers. 1/2 > 1/4 because 2 parts > 4 parts (size-wise)."
        ))
        
        checkpoints.append("Student acknowledges size difference")

    # --- Strategy: Unknown / New Concept (Analogical) ---
    elif req.diagnosis == "unknown":
        # Step 1: Analogy Hook
        steps.append(TeachingStep(
            step=1, 
            mode="experience", 
            content=f"Imagine {analogy}. That's exactly how this concept works."
        ))
        
        # Step 2: Bridge to Concept
        steps.append(TeachingStep(
            step=2, 
            mode="intuition", 
            content="If you implement this rule, you get fair results every time."
        ))
        
        # Step 3: Formal Definition
        steps.append(TeachingStep(
            step=3, 
            mode="symbol", 
            content="In math, we write this as a fraction or ratio."
        ))
        
        checkpoints.append(f"Student relates concept to {analogy}")

    # --- Default Fallback ---
    else:
        steps.append(TeachingStep(step=1, mode="experience", content=f"Let's explore using {analogy}..."))
        checkpoints.append("Check understanding")

    return TeachingPlan(teaching_plan=steps, checkpoints=checkpoints)
