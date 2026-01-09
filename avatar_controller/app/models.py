from pydantic import BaseModel
from typing import Optional

class AvatarState(BaseModel):
    student_id: str
    current_emotion: str  # neutral, happy, thinking, celebrating, compassionate, concerned
    is_speaking: bool
    last_interaction: str

class VoiceConfig(BaseModel):
    student_id: str
    voice_id: str
    pitch: float = 1.0
    rate: float = 1.0
    volume: float = 1.0
