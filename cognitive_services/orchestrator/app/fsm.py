from enum import Enum


class CognitiveState(str, Enum):
    UNKNOWN = "unknown"
    OBSERVE = "observe"
    DIAGNOSE = "diagnose"
    MISCONCEPTION = "misconception"
    PARTIAL = "partial"
    UNDERSTOOD = "understood"
    STRUGGLE = "struggle"
    EXPLAIN = "explain"
    REFLECT = "reflect"
    TRANSFER = "transfer"
    MASTERED = "mastered"


class StateMachine:
    def __init__(self):
        self.transitions = {
            CognitiveState.UNKNOWN: self._handle_unknown,
            CognitiveState.OBSERVE: self._handle_observe,
            CognitiveState.DIAGNOSE: self._handle_diagnose,
            CognitiveState.MISCONCEPTION: self._handle_misconception,
            CognitiveState.PARTIAL: self._handle_partial,
            CognitiveState.UNDERSTOOD: self._handle_understood,
            CognitiveState.STRUGGLE: self._handle_struggle,
            CognitiveState.EXPLAIN: self._handle_explain,
            CognitiveState.REFLECT: self._handle_reflect,
            CognitiveState.TRANSFER: self._handle_transfer,
            CognitiveState.MASTERED: self._handle_mastered,
        }

    def _handle_unknown(self, context: dict) -> dict:
        return {
            "next_state": CognitiveState.OBSERVE,
            "next_agent": "curiosity-agent",
            "instruction": "Observe the concept through examples"
        }

    def _handle_observe(self, context: dict) -> dict:
        return {
            "next_state": CognitiveState.DIAGNOSE,
            "next_agent": "diagnosis-agent",
            "instruction": "Diagnose student's current understanding"
        }

    def _handle_diagnose(self, context: dict) -> dict:
        diagnosis = context.get("diagnosis", "unknown")
        if diagnosis == "misconception":
            return {
                "next_state": CognitiveState.EXPLAIN,
                "next_agent": "teaching-agent",
                "instruction": "Address misconception directly"
            }
        elif diagnosis == "partial":
            struggle_count = context.get("struggle_count", 0)
            if struggle_count >= 2:
                return {
                    "next_state": CognitiveState.EXPLAIN,
                    "next_agent": "teaching-agent",
                    "instruction": "Too much struggle - provide direct explanation"
                }
            else:
                return {
                    "next_state": CognitiveState.STRUGGLE,
                    "next_agent": "struggle-agent",
                    "instruction": "Guide through productive struggle"
                }
        else:
            return {
                "next_state": CognitiveState.UNDERSTOOD,
                "next_agent": "reflection-agent",
                "instruction": "Ready for reflection"
            }

    def _handle_misconception(self, context: dict) -> dict:
        return {
            "next_state": CognitiveState.EXPLAIN,
            "next_agent": "teaching-agent",
            "instruction": "Rebuild concept from first principles"
        }

    def _handle_partial(self, context: dict) -> dict:
        struggle_count = context.get("struggle_count", 0)
        confidence = context.get("confidence_level", "low")

        if struggle_count >= 2:
            return {
                "next_state": CognitiveState.EXPLAIN,
                "next_agent": "teaching-agent",
                "instruction": "Provide more scaffolding"
            }
        else:
            return {
                "next_state": CognitiveState.STRUGGLE,
                "next_agent": "struggle-agent",
                "instruction": "Continue guided practice"
            }

    def _handle_understood(self, context: dict) -> dict:
        confidence = context.get("confidence_level", "low")
        mastery = context.get("mastery_score", 0)

        if confidence == "high" and mastery >= 75:
            return {
                "next_state": CognitiveState.REFLECT,
                "next_agent": "reflection-agent",
                "instruction": "Deepen understanding through reflection"
            }
        else:
            return {
                "next_state": CognitiveState.STRUGGLE,
                "next_agent": "struggle-agent",
                "instruction": "Build more confidence"
            }

    def _handle_struggle(self, context: dict) -> dict:
        mastery = context.get("mastery_score", 0)
        struggle_count = context.get("struggle_count", 0)

        if mastery >= 75:
            return {
                "next_state": CognitiveState.REFLECT,
                "next_agent": "reflection-agent",
                "instruction": "Ready for reflection"
            }
        else:
            return {
                "next_state": CognitiveState.PARTIAL,
                "next_agent": "diagnosis-agent",
                "instruction": "Re-assess understanding"
            }

    def _handle_explain(self, context: dict) -> dict:
        return {
            "next_state": CognitiveState.UNDERSTOOD,
            "next_agent": "reflection-agent",
            "instruction": "Process new understanding"
        }

    def _handle_reflect(self, context: dict) -> dict:
        mastery = context.get("mastery_score", 0)

        if mastery >= 75:
            return {
                "next_state": CognitiveState.TRANSFER,
                "next_agent": "transfer-agent",
                "instruction": "Test true understanding"
            }
        else:
            return {
                "next_state": CognitiveState.STRUGGLE,
                "next_agent": "struggle-agent",
                "instruction": "More practice needed"
            }

    def _handle_transfer(self, context: dict) -> dict:
        passed = context.get("transfer_passed", False)

        if passed:
            return {
                "next_state": CognitiveState.MASTERED,
                "next_agent": "memory-service",
                "instruction": "Mark as mastered"
            }
        else:
            return {
                "next_state": CognitiveState.STRUGGLE,
                "next_agent": "struggle-agent",
                "instruction": "Try different transfer approach"
            }

    def _handle_mastered(self, context: dict) -> dict:
        return {
            "next_state": CognitiveState.MASTERED,
            "next_agent": "memory-service",
            "instruction": "Concept mastered - schedule review"
        }

    def get_next_state(self, current_state: str, context: dict) -> dict:
        state = CognitiveState(current_state)
        handler = self.transitions.get(state)

        if not handler:
            return {
                "next_state": CognitiveState.UNKNOWN,
                "next_agent": "diagnosis-agent",
                "instruction": "Unknown state - restart"
            }

        return handler(context)


fsm = StateMachine()