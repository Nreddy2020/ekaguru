from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor
from sentence_transformers import SentenceTransformer
import numpy as np
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize embedding model
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# PostgreSQL connection
def get_db_connection():
    return psycopg2.connect(
        dbname=os.environ.get('POSTGRES_DB', 'virtual_tutor'),
        user=os.environ.get('POSTGRES_USER', 'postgres'),
        password=os.environ.get('POSTGRES_PASSWORD', 'postgres'),
        host=os.environ.get('POSTGRES_HOST', 'localhost'),
        port=os.environ.get('POSTGRES_PORT', '5432')
    )

# Initialize database tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create textbooks table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS textbooks (
            id VARCHAR(255) PRIMARY KEY,
            filename VARCHAR(500),
            title VARCHAR(500),
            subject VARCHAR(255),
            upload_date TIMESTAMP,
            total_chunks INTEGER DEFAULT 0
        )
    """)
    
    # Create text_chunks table with vector extension
    cur.execute("""
        CREATE TABLE IF NOT EXISTS text_chunks (
            id VARCHAR(255) PRIMARY KEY,
            textbook_id VARCHAR(255) REFERENCES textbooks(id) ON DELETE CASCADE,
            chunk_text TEXT,
            chunk_index INTEGER,
            embedding vector(384),
            metadata JSONB
        )
    """)
    
    # Create vector index for efficient similarity search
    cur.execute("""
        CREATE INDEX IF NOT EXISTS text_chunks_embedding_idx 
        ON text_chunks USING hnsw (embedding vector_cosine_ops)
    """)
    
    # Create students table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            grade_level VARCHAR(50),
            created_at TIMESTAMP,
            avatar_preference VARCHAR(100) DEFAULT 'default'
        )
    """)
    
    # Create knowledge_state table (tracks what student knows)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_state (
            id VARCHAR(255) PRIMARY KEY,
            student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
            topic VARCHAR(500),
            mastery_level FLOAT DEFAULT 0.0,
            last_tested TIMESTAMP,
            correct_answers INTEGER DEFAULT 0,
            total_attempts INTEGER DEFAULT 0
        )
    """)
    
    # Create chat_history table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id VARCHAR(255) PRIMARY KEY,
            student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
            message TEXT,
            role VARCHAR(50),
            timestamp TIMESTAMP,
            response_type VARCHAR(50)
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    logging.info("Database initialized successfully")

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class TextbookUpload(BaseModel):
    title: str
    subject: str

class TextbookResponse(BaseModel):
    id: str
    filename: str
    title: str
    subject: str
    upload_date: str
    total_chunks: int

class StudentCreate(BaseModel):
    name: str
    grade_level: str
    avatar_preference: Optional[str] = 'default'

class StudentResponse(BaseModel):
    id: str
    name: str
    grade_level: str
    created_at: str
    avatar_preference: str

class ChatMessage(BaseModel):
    student_id: str
    message: str
    textbook_ids: Optional[List[str]] = None

class ChatResponse(BaseModel):
    response: str
    response_type: str
    sources: Optional[List[Dict[str, Any]]] = None

# Helper functions
def chunk_text(text: str, chunk_size: int = 800, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    
    return chunks

def get_student_knowledge(student_id: str, topic: str) -> float:
    """Get student's mastery level for a topic"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT mastery_level FROM knowledge_state 
        WHERE student_id = %s AND topic ILIKE %s
        ORDER BY last_tested DESC LIMIT 1
    """, (student_id, f'%{topic}%'))
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    return result['mastery_level'] if result else 0.0

def update_knowledge_state(student_id: str, topic: str, is_correct: bool):
    """Update student's knowledge state based on interaction"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get or create knowledge state
    cur.execute("""
        SELECT * FROM knowledge_state 
        WHERE student_id = %s AND topic = %s
    """, (student_id, topic))
    
    result = cur.fetchone()
    
    if result:
        # Update existing
        correct = result['correct_answers'] + (1 if is_correct else 0)
        total = result['total_attempts'] + 1
        mastery = correct / total
        
        cur.execute("""
            UPDATE knowledge_state 
            SET mastery_level = %s, last_tested = %s, 
                correct_answers = %s, total_attempts = %s
            WHERE id = %s
        """, (mastery, datetime.now(timezone.utc), correct, total, result['id']))
    else:
        # Create new
        mastery = 1.0 if is_correct else 0.0
        cur.execute("""
            INSERT INTO knowledge_state 
            (id, student_id, topic, mastery_level, last_tested, correct_answers, total_attempts)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), student_id, topic, mastery, 
               datetime.now(timezone.utc), 1 if is_correct else 0, 1))
    
    conn.commit()
    cur.close()
    conn.close()

async def generate_response_with_llm(query: str, context: str, response_type: str, student_name: str) -> str:
    """Generate response using LLM"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    if response_type == 'explanation':
        system_message = f"""You are a friendly, patient virtual tutor helping {student_name}. 
        Your job is to explain concepts clearly and engagingly, like a caring teacher.
        Use the provided context from the textbook to give accurate explanations.
        Keep your responses concise but thorough, and use examples when helpful."""
        
        user_prompt = f"""Based on this textbook content:
        {context}
        
        Please explain to the student: {query}
        
        Remember to be encouraging and make it easy to understand!"""
    else:  # quiz
        system_message = f"""You are a virtual tutor creating quiz questions for {student_name}.
        Your job is to create engaging, challenging questions based on the textbook content.
        Ask one question at a time, provide multiple choice options, and be encouraging."""
        
        user_prompt = f"""Based on this textbook content:
        {context}
        
        Create a quiz question about: {query}
        
        Format: 
        Question: [question]
        A) [option]
        B) [option]
        C) [option]
        D) [option]
        
        Make it engaging and educational!"""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=user_prompt))
        return response
    except Exception as e:
        logging.error(f"LLM Error: {e}")
        return f"I found relevant information: {context[:500]}... Let me help you understand this better!"

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Virtual Tutor API", "status": "running"}

@api_router.post("/textbooks/upload")
async def upload_textbook(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(None),
    subject: str = Form(None)
):
    """Upload and process a textbook"""
    try:
        # Read file content
        content = await file.read()
        text = content.decode('utf-8')
        
        # Create textbook entry
        textbook_id = str(uuid.uuid4())
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO textbooks (id, filename, title, subject, upload_date, total_chunks)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (textbook_id, file.filename, title or file.filename, subject or 'General', 
               datetime.now(timezone.utc), 0))
        
        conn.commit()
        
        # Chunk the text
        chunks = chunk_text(text)
        logging.info(f"Created {len(chunks)} chunks from textbook")
        
        # Generate embeddings and store
        for idx, chunk in enumerate(chunks):
            embedding = embedding_model.encode(chunk)
            chunk_id = str(uuid.uuid4())
            
            cur.execute("""
                INSERT INTO text_chunks (id, textbook_id, chunk_text, chunk_index, embedding, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (chunk_id, textbook_id, chunk, idx, embedding.tolist(), 
                   json.dumps({"chunk_size": len(chunk.split())})))
        
        # Update total chunks
        cur.execute("""
            UPDATE textbooks SET total_chunks = %s WHERE id = %s
        """, (len(chunks), textbook_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "id": textbook_id,
            "filename": file.filename,
            "title": title or file.filename,
            "subject": subject or 'General',
            "total_chunks": len(chunks),
            "message": "Textbook uploaded and processed successfully"
        }
    except Exception as e:
        logging.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/textbooks", response_model=List[TextbookResponse])
async def list_textbooks():
    """List all uploaded textbooks"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT * FROM textbooks ORDER BY upload_date DESC")
    textbooks = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return [
        TextbookResponse(
            id=t['id'],
            filename=t['filename'],
            title=t['title'],
            subject=t['subject'],
            upload_date=t['upload_date'].isoformat(),
            total_chunks=t['total_chunks']
        ) for t in textbooks
    ]

@api_router.post("/students", response_model=StudentResponse)
async def create_student(student: StudentCreate):
    """Create a new student profile"""
    student_id = str(uuid.uuid4())
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO students (id, name, grade_level, created_at, avatar_preference)
        VALUES (%s, %s, %s, %s, %s)
    """, (student_id, student.name, student.grade_level, 
           datetime.now(timezone.utc), student.avatar_preference))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return StudentResponse(
        id=student_id,
        name=student.name,
        grade_level=student.grade_level,
        created_at=datetime.now(timezone.utc).isoformat(),
        avatar_preference=student.avatar_preference
    )

@api_router.get("/students", response_model=List[StudentResponse])
async def list_students():
    """List all students"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT * FROM students ORDER BY created_at DESC")
    students = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return [
        StudentResponse(
            id=s['id'],
            name=s['name'],
            grade_level=s['grade_level'],
            created_at=s['created_at'].isoformat(),
            avatar_preference=s['avatar_preference']
        ) for s in students
    ]

@api_router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Handle chat interaction with adaptive learning"""
    try:
        # Get student info
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT * FROM students WHERE id = %s", (message.student_id,))
        student = cur.fetchone()
        
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Generate query embedding
        query_embedding = embedding_model.encode(message.message)
        
        # Search for relevant chunks
        textbook_filter = ""
        params = [query_embedding.tolist()]
        
        if message.textbook_ids:
            textbook_filter = "AND textbook_id = ANY(%s)"
            params.append(message.textbook_ids)
        
        cur.execute(f"""
            SELECT tc.chunk_text, tc.textbook_id, t.title, t.subject,
                   1 - (tc.embedding <=> %s::vector) as similarity
            FROM text_chunks tc
            JOIN textbooks t ON tc.textbook_id = t.id
            {textbook_filter}
            ORDER BY tc.embedding <=> %s::vector
            LIMIT 5
        """, params + [query_embedding.tolist()])
        
        results = cur.fetchall()
        
        if not results:
            return ChatResponse(
                response="I don't have information about that topic yet. Could you upload a textbook or ask about something else?",
                response_type="no_context",
                sources=[]
            )
        
        # Extract topic from query (simple approach)
        topic = message.message[:100]
        
        # Get student's knowledge level
        mastery = get_student_knowledge(message.student_id, topic)
        
        # Decide response type based on mastery
        if mastery < 0.5:
            response_type = "explanation"
        else:
            response_type = "quiz"
        
        # Combine context from top chunks
        context = "\n\n".join([r['chunk_text'] for r in results[:3]])
        
        # Generate response with LLM
        response_text = await generate_response_with_llm(
            message.message, context, response_type, student['name']
        )
        
        # Save chat history
        cur.execute("""
            INSERT INTO chat_history (id, student_id, message, role, timestamp, response_type)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), message.student_id, message.message, 
               'user', datetime.now(timezone.utc), response_type))
        
        cur.execute("""
            INSERT INTO chat_history (id, student_id, message, role, timestamp, response_type)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), message.student_id, response_text, 
               'assistant', datetime.now(timezone.utc), response_type))
        
        conn.commit()
        cur.close()
        conn.close()
        
        sources = [
            {
                "textbook": r['title'],
                "subject": r['subject'],
                "similarity": float(r['similarity'])
            } for r in results[:3]
        ]
        
        return ChatResponse(
            response=response_text,
            response_type=response_type,
            sources=sources
        )
    
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/students/{student_id}/progress")
async def get_student_progress(student_id: str):
    """Get student's learning progress"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT topic, mastery_level, correct_answers, total_attempts, last_tested
        FROM knowledge_state
        WHERE student_id = %s
        ORDER BY last_tested DESC
    """, (student_id,))
    
    progress = cur.fetchall()
    cur.close()
    conn.close()
    
    return {
        "student_id": student_id,
        "topics": [
            {
                "topic": p['topic'],
                "mastery_level": p['mastery_level'],
                "correct_answers": p['correct_answers'],
                "total_attempts": p['total_attempts'],
                "last_tested": p['last_tested'].isoformat() if p['last_tested'] else None
            } for p in progress
        ]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Virtual Tutor API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Virtual Tutor API shutting down")