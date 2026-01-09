from .models import StruggleRequest, StruggleResponse, HintPolicy
import random

class HintScaffolder:
    @staticmethod
    def get_hints(concept_id: str, difficulty: str = "medium") -> list:
        # Dictionary of hints by concept (simulating RAG/Knowledge Graph)
        HINT_DB = {
            "fractions": {
                "visual": "Imagine drawing a rectangle for each fraction. Which one has more shaded space?",
                "conceptual": "Remember: The denominator tells you how many pieces the whole is cut into.",
                "procedural": "Compare the bottom numbers. Smaller bottom number = Bigger slices."
            },
            "decimals": {
                "visual": "Think of money. $0.5 is 50 cents. $0.05 is 5 nickels.",
                "conceptual": "The position of the digit matters. Tenths > Hundredths.",
                "procedural": "Line up the decimal points before comparing."
            }
        }
        
        # Default fallback hints
        default_hints = {
            "visual": "Can you draw a picture of the problem?",
            "conceptual": "What is the core rule we learned?",
            "procedural": "Try breaking it down step by step."
        }
        
        # Select hints based on concept
        concept_key = "fractions" if "fraction" in concept_id.lower() else "decimals" if "decimal" in concept_id.lower() else "default"
        selected_hints = HINT_DB.get(concept_key, default_hints)
        
        return [
            f"Visual Hint: {selected_hints['visual']}",
            f"Concept Hint: {selected_hints['conceptual']}",
            f"Strategy Hint: {selected_hints['procedural']}"
        ]

def select_task(req: StruggleRequest) -> StruggleResponse:
    # Logic: "I Do, We Do, You Do" based on mastery
    
    # 1. NOVICE -> WORKED EXAMPLE ("I Do")
    if req.mastery_score < 40:
        return StruggleResponse(
            task_type="worked_example",
            content="Let's look at a solved example first. To compare 1/3 and 1/5, we look at the denominator. 3 is smaller than 5, so 1/3 splits the whole into FEWER pieces, making each piece BIGGER. Thus 1/3 > 1/5.",
            hint_policy=None # No hints needed for reading an example
        )

    # 2. COMPETENT -> GUIDED PRACTICE ("We Do")
    elif req.mastery_score < 70:
        hints = HintScaffolder.get_hints(req.concept_id)
        return StruggleResponse(
            task_type="guided",
            content="Now try this one: Which is larger, 1/4 or 1/6? Remember the pizza rule.",
            hint_policy=HintPolicy(
                max_attempts=3,
                hint_levels=hints
            )
        )

    # 3. EXPERT -> INDEPENDENT PRACTICE ("You Do")
    else:
        return StruggleResponse(
            task_type="independent",
            content="Challenge: Compare 3/8 and 3/5. Explain your reasoning.",
            hint_policy=HintPolicy(
                max_attempts=2,
                hint_levels=[
                    "nudge: The numerators are the same, so look at the parts."
                ]
            )
        )
