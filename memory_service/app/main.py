from fastapi import FastAPI
from .database import Base, engine
from .routers import concept, student, event, analytics

app = FastAPI(title="Knowledge Memory Service")

# Include routers
app.include_router(concept.router, prefix="/memory/concept", tags=["Concept"])
app.include_router(student.router, prefix="/memory/student", tags=["Student"])
app.include_router(event.router, prefix="/memory/event", tags=["Event"])
app.include_router(analytics.router, prefix="/memory/analytics", tags=["Analytics"])

# Create tables on startup
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
