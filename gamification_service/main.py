from fastapi import FastAPI, HTTPException
from typing import List
from .models import Badge, UserBadge, LeaderboardEntry, StreakUpdate
from datetime import datetime, date

app = FastAPI(title="Ekaguru Gamification Service", version="1.0.0")

# MOCK DB
badges_db = {
    "b1": Badge(id="b1", name="First Step", description="Complete your first lesson", icon="🦶", condition="lessons >= 1"),
    "b2": Badge(id="b2", name="Math Wizard", description="Master 5 concepts", icon="🧙‍♂️", condition="mastery >= 5"),
    "b3": Badge(id="b3", name="On Fire", description="7-day login streak", icon="🔥", condition="streak >= 7"),
}
user_badges_db = [] # List of UserBadge
user_streaks_db = {} # user_id -> StreakUpdate

@app.get("/badges", response_model=List[Badge])
def list_available_badges():
    return list(badges_db.values())

@app.get("/badges/{user_id}", response_model=List[Badge])
def get_user_badges(user_id: str):
    # Find badges earned by user
    earned_ids = [ub.badge_id for ub in user_badges_db if ub.user_id == user_id]
    return [badges_db[bid] for bid in earned_ids if bid in badges_db]

@app.post("/streaks/checkin/{user_id}", response_model=StreakUpdate)
def checkin_streak(user_id: str):
    today = date.today()
    if user_id not in user_streaks_db:
        # First time
        streak = StreakUpdate(user_id=user_id, current_streak=1, last_login=today)
        user_streaks_db[user_id] = streak
        return streak
    
    current = user_streaks_db[user_id]
    delta = (today - current.last_login).days
    
    if delta == 0:
        return current # Already checked in
    elif delta == 1:
        current.current_streak += 1 # Continued streak
    else:
        current.current_streak = 1 # Broken streak
        
    current.last_login = today
    return current

@app.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard():
    # Mock leaderboard
    return [
        LeaderboardEntry(user_id="u1", username="Alice", score=1250, rank=1),
        LeaderboardEntry(user_id="u2", username="Bob", score=980, rank=2),
        LeaderboardEntry(user_id="u3", username="Charlie", score=850, rank=3),
    ]

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "gamification_service"}
