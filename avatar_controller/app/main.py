from fastapi import FastAPI, Body
from .models import AvatarState, VoiceConfig
from .engine import AvatarEngine
from datetime import datetime

app = FastAPI(title="Avatar & Voice Controller")

# In-memory storage for demo
VOICE_CONFIGS = {}

@app.post("/avatar/calculate-state", response_model=AvatarState)
def calculate_avatar_state(
    student_id: str = Body(...),
    fear_level: str = Body("low"),
    confidence_level: str = Body("medium"),
    recent_success: bool = Body(False)
):
    """
    Determine the avatar's current emotion based on cognitive state
    """
    emotion = AvatarEngine.determine_emotion(fear_level, confidence_level, recent_success)
    
    return AvatarState(
        student_id=student_id,
        current_emotion=emotion,
        is_speaking=False, # Default
        last_interaction=datetime.now().isoformat()
    )

@app.get("/avatar/voice/params/{emotion}")
def get_voice_params(emotion: str):
    return AvatarEngine.get_speech_style(emotion)

@app.post("/avatar/voice/config")
def update_voice_config(config: VoiceConfig):
    VOICE_CONFIGS[config.student_id] = config
    return {"status": "updated", "config": config}
