from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4
from datetime import datetime, date

class Badge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str # e.g., "Math Wizard"
    description: str
    icon: str # Emoji or URL
    condition: str # Description of how to earn

class UserBadge(BaseModel):
    user_id: str
    badge_id: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)

class LeaderboardEntry(BaseModel):
    user_id: str
    username: str
    score: int
    rank: int

class StreakUpdate(BaseModel):
    user_id: str
    current_streak: int
    last_login: date
