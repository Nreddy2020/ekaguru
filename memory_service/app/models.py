import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, text, CheckConstraint, UniqueConstraint, func, Uuid as UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

def generate_uuid():
    return uuid.uuid4()

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    age = Column(Integer)
    grade = Column(String)
    parent_id = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, server_default=func.now())

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    
    topics = relationship("Topic", back_populates="subject")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"))
    name = Column(String, nullable=False)
    description = Column(String)

    subject = relationship("Subject", back_populates="topics")
    concepts = relationship("Concept", back_populates="topic")

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id"))
    name = Column(String, nullable=False)
    description = Column(String)
    difficulty_level = Column(Integer, CheckConstraint('difficulty_level BETWEEN 1 AND 5'))

    topic = relationship("Topic", back_populates="concepts")
    misconceptions = relationship("Misconception", back_populates="concept")

class StudentConceptState(Base):
    __tablename__ = "student_concept_state"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    concept_id = Column(UUID(as_uuid=True), ForeignKey("concepts.id"))

    mastery_score = Column(Integer, CheckConstraint('mastery_score BETWEEN 0 AND 100'))
    confidence_level = Column(String, CheckConstraint("confidence_level IN ('low','medium','high')"))
    
    exposure_count = Column(Integer, default=0)
    struggle_count = Column(Integer, default=0)
    
    version = Column(Integer, default=1, nullable=False)

    state = Column(String, CheckConstraint("state IN ('unknown','introduced','partial','misconception','understood','mastered')"))

    last_seen = Column(DateTime)
    next_review = Column(DateTime)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=datetime.now)



    __table_args__ = (
        UniqueConstraint('student_id', 'concept_id', name='unique_student_concept'),
    )

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    aggregate_type = Column(String, nullable=False) # e.g. "student_concept_state"
    aggregate_id = Column(String, nullable=False)   # e.g. "student_id:concept_id"
    event_type = Column(String, nullable=False)     # e.g. "concept_mastered"
    payload = Column(String, nullable=False)        # JSON string
    created_at = Column(DateTime, server_default=func.now())
    processed = Column(Boolean, default=False)

class Misconception(Base):
    __tablename__ = "misconceptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    concept_id = Column(UUID(as_uuid=True), ForeignKey("concepts.id"))
    description = Column(String, nullable=False)

    concept = relationship("Concept", back_populates="misconceptions")

class StudentMisconception(Base):
    __tablename__ = "student_misconceptions"

    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), primary_key=True)
    misconception_id = Column(UUID(as_uuid=True), ForeignKey("misconceptions.id"), primary_key=True)
    detected_at = Column(DateTime, server_default=func.now())
    resolved = Column(Boolean, default=False)

class LearningEvent(Base):
    __tablename__ = "learning_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    concept_id = Column(UUID(as_uuid=True), ForeignKey("concepts.id"))

    agent = Column(String)               # diagnose, teach, struggle, reflect
    event_type = Column(String)          # asked, answered, failed, hinted, explained
    response_quality = Column(Integer)     # 0–100
    confidence_detected = Column(String) # low/medium/high

    created_at = Column(DateTime, server_default=func.now())
