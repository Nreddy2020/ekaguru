from .models import AvatarState
import random

class AvatarEngine:
    @staticmethod
    def determine_emotion(fear_level: str, confidence_level: str, recent_success: bool) -> str:
        """
        Map cognitive/emotional state to avatar expression
        """
        # 1. Fear Response (Highest Priority)
        if fear_level == "high":
            return "compassionate" # Soothing look
        elif fear_level == "medium":
            return "concerned" # Attentive
            
        # 2. Success Response
        if recent_success:
            return "celebrating" # Joyful
            
        # 3. Confidence Response
        if confidence_level == "low":
            return "encouraging" # Nodding
        elif confidence_level == "high":
            return "happy" # Pleased
            
        # 4. Default
        return "neutral" # Blink/Idle

    @staticmethod
    def get_speech_style(emotion: str) -> dict:
        """
        Adjust voice parameters based on emotion
        """
        STYLES = {
            "compassionate": {"rate": 0.85, "pitch": 0.95}, # Slower, lower
            "celebrating": {"rate": 1.1, "pitch": 1.1},     # Faster, higher
            "concerned": {"rate": 0.9, "pitch": 1.0},
            "encouraging": {"rate": 1.0, "pitch": 1.05},
            "neutral": {"rate": 1.0, "pitch": 1.0}
        }
        return STYLES.get(emotion, STYLES["neutral"])
