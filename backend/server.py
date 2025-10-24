from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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
import PyPDF2
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
from docx import Document
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads' / 'images'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

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
            total_chunks INTEGER DEFAULT 0,
            total_chapters INTEGER DEFAULT 0
        )
    """)
    
    # Create chapters table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chapters (
            id VARCHAR(255) PRIMARY KEY,
            textbook_id VARCHAR(255) REFERENCES textbooks(id) ON DELETE CASCADE,
            chapter_number INTEGER,
            chapter_title VARCHAR(500),
            chapter_summary TEXT,
            content_preview TEXT,
            word_count INTEGER,
            created_at TIMESTAMP,
            images JSONB DEFAULT '[]'::jsonb
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
    
    # Create learning_progress table (tracks chapter completion)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS learning_progress (
            id VARCHAR(255) PRIMARY KEY,
            student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
            chapter_id VARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
            status VARCHAR(50) DEFAULT 'not_started',
            completion_percentage FLOAT DEFAULT 0.0,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            quiz_score FLOAT DEFAULT 0.0
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
def extract_and_save_images_from_pdf(pdf_content: bytes, textbook_id: str) -> List[str]:
    """Extract images from PDF and save them"""
    images_paths = []
    try:
        # Convert PDF pages to images
        pdf_images = convert_from_bytes(pdf_content, dpi=150)
        
        for idx, img in enumerate(pdf_images):
            # Save each page as image
            image_filename = f"{textbook_id}_page_{idx+1}.jpg"
            image_path = UPLOADS_DIR / image_filename
            img.save(image_path, 'JPEG', quality=85)
            images_paths.append(f"/uploads/images/{image_filename}")
            
        logging.info(f"Extracted {len(images_paths)} images from PDF")
    except Exception as e:
        logging.error(f"Error extracting images from PDF: {e}")
    
    return images_paths

def save_image_file(image_content: bytes, textbook_id: str, filename: str) -> str:
    """Save an image file"""
    try:
        img = Image.open(io.BytesIO(image_content))
        image_filename = f"{textbook_id}_{filename}"
        image_path = UPLOADS_DIR / image_filename
        img.save(image_path, 'JPEG', quality=85)
        return f"/uploads/images/{image_filename}"
    except Exception as e:
        logging.error(f"Error saving image: {e}")
        return None

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        # Try to extract text directly
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        # If no text extracted, try OCR (for scanned PDFs)
        if len(text.strip()) < 100:
            logging.info("PDF appears to be scanned, using OCR...")
            images = convert_from_bytes(file_content)
            text = ""
            for i, image in enumerate(images):
                logging.info(f"Processing page {i+1} with OCR...")
                page_text = pytesseract.image_to_string(image)
                text += page_text + "\n"
        
        return text.strip()
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_image(file_content: bytes) -> str:
    """Extract text from image using OCR"""
    try:
        image = Image.open(io.BytesIO(file_content))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        logging.error(f"Error extracting text from image: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from image: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from Word document"""
    try:
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        logging.error(f"Error extracting text from DOCX: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from Word document: {str(e)}")

def process_file_content(file_content: bytes, filename: str) -> str:
    """Process file content based on file type"""
    file_ext = filename.lower().split('.')[-1]
    
    # PDF files
    if file_ext == 'pdf':
        return extract_text_from_pdf(file_content)
    
    # Image files
    elif file_ext in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif', 'webp']:
        return extract_text_from_image(file_content)
    
    # Word documents
    elif file_ext in ['docx', 'doc']:
        if file_ext == 'doc':
            raise HTTPException(status_code=400, detail="Please convert .doc files to .docx format")
        return extract_text_from_docx(file_content)
    
    # Text files
    elif file_ext in ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'c', 'cpp']:
        try:
            text = file_content.decode('utf-8')
            return text.strip()
        except UnicodeDecodeError:
            # Try other encodings
            for encoding in ['latin-1', 'iso-8859-1', 'cp1252']:
                try:
                    text = file_content.decode(encoding)
                    return text.strip()
                except:
                    continue
            raise HTTPException(status_code=400, detail="Unable to decode text file")
    
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file_ext}. Supported types: PDF, images (JPG, PNG, etc.), Word documents (.docx), and text files."
        )

def extract_chapters_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract chapters from text based on common patterns"""
    chapters = []
    
    # Common chapter patterns
    patterns = [
        r'Chapter\s+(\d+)[:\s]+([^\n]+)',
        r'CHAPTER\s+(\d+)[:\s]+([^\n]+)',
        r'Ch\.\s+(\d+)[:\s]+([^\n]+)',
        r'(\d+)\.\s+([A-Z][^\n]+)',  # Numbered sections
    ]
    
    lines = text.split('\n')
    current_chapter = None
    chapter_content = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Check if this line matches a chapter pattern
        is_chapter = False
        for pattern in patterns:
            match = re.match(pattern, line)
            if match:
                # Save previous chapter if exists
                if current_chapter and chapter_content:
                    current_chapter['content'] = '\n'.join(chapter_content)
                    current_chapter['word_count'] = len(current_chapter['content'].split())
                    current_chapter['content_preview'] = current_chapter['content'][:300] + '...'
                    chapters.append(current_chapter)
                
                # Start new chapter
                chapter_num = int(match.group(1)) if match.group(1).isdigit() else len(chapters) + 1
                chapter_title = match.group(2).strip()
                
                current_chapter = {
                    'chapter_number': chapter_num,
                    'chapter_title': chapter_title,
                    'content': '',
                    'word_count': 0
                }
                chapter_content = []
                is_chapter = True
                break
        
        if not is_chapter and current_chapter:
            chapter_content.append(line)
    
    # Save last chapter
    if current_chapter and chapter_content:
        current_chapter['content'] = '\n'.join(chapter_content)
        current_chapter['word_count'] = len(current_chapter['content'].split())
        current_chapter['content_preview'] = current_chapter['content'][:300] + '...'
        chapters.append(current_chapter)
    
    # If no chapters found, create one chapter with all content
    if not chapters:
        chapters.append({
            'chapter_number': 1,
            'chapter_title': 'Complete Content',
            'content': text,
            'word_count': len(text.split()),
            'content_preview': text[:300] + '...'
        })
    
    return chapters

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
    """Upload and process a textbook (supports PDF, images, Word docs, and text files)"""
    try:
        # Read file content
        content = await file.read()
        
        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
        
        # Process file based on type
        logging.info(f"Processing file: {file.filename}")
        text = process_file_content(content, file.filename)
        
        if not text or len(text) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Insufficient text extracted from file. Please ensure the file contains readable text."
            )
        
        logging.info(f"Extracted {len(text)} characters from {file.filename}")
        
        # Extract images based on file type
        images = []
        file_ext = file.filename.lower().split('.')[-1]
        
        if file_ext == 'pdf':
            images = extract_and_save_images_from_pdf(content, str(uuid.uuid4()))
        elif file_ext in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif', 'webp']:
            image_path = save_image_file(content, str(uuid.uuid4()), file.filename)
            if image_path:
                images = [image_path]
        
        logging.info(f"Extracted {len(images)} images from file")
        
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
        
        # Extract chapters from text
        chapters = extract_chapters_from_text(text)
        logging.info(f"Extracted {len(chapters)} chapters from textbook")
        
        # Store chapters
        for chapter in chapters:
            chapter_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO chapters (id, textbook_id, chapter_number, chapter_title, 
                                     chapter_summary, content_preview, word_count, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (chapter_id, textbook_id, chapter['chapter_number'], chapter['chapter_title'],
                  '', chapter['content_preview'], chapter['word_count'], datetime.now(timezone.utc)))
            
            # Chunk the chapter content
            chapter_chunks = chunk_text(chapter['content'])
            for idx, chunk in enumerate(chapter_chunks):
                embedding = embedding_model.encode(chunk)
                chunk_id = str(uuid.uuid4())
                
                cur.execute("""
                    INSERT INTO text_chunks (id, textbook_id, chunk_text, chunk_index, embedding, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (chunk_id, textbook_id, chunk, idx, embedding.tolist(), 
                       json.dumps({
                           "chunk_size": len(chunk.split()),
                           "file_type": file.filename.split('.')[-1].lower(),
                           "chapter_id": chapter_id,
                           "chapter_number": chapter['chapter_number'],
                           "chapter_title": chapter['chapter_title']
                       })))
        
        # Update total chapters and chunks
        total_chunks = sum(len(chunk_text(ch['content'])) for ch in chapters)
        cur.execute("""
            UPDATE textbooks SET total_chapters = %s, total_chunks = %s WHERE id = %s
        """, (len(chapters), total_chunks, textbook_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "id": textbook_id,
            "filename": file.filename,
            "title": title or file.filename,
            "subject": subject or 'General',
            "total_chunks": total_chunks,
            "total_chapters": len(chapters),
            "chapters": [{"number": ch['chapter_number'], "title": ch['chapter_title']} for ch in chapters],
            "characters_extracted": len(text),
            "message": "Textbook uploaded and processed successfully"
        }
    except HTTPException:
        raise
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

@api_router.get("/textbooks/{textbook_id}/chapters")
async def get_textbook_chapters(textbook_id: str):
    """Get all chapters from a textbook"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT c.*, t.title as textbook_title, t.subject
        FROM chapters c
        JOIN textbooks t ON c.textbook_id = t.id
        WHERE c.textbook_id = %s
        ORDER BY c.chapter_number
    """, (textbook_id,))
    
    chapters = cur.fetchall()
    cur.close()
    conn.close()
    
    return {
        "textbook_id": textbook_id,
        "chapters": [
            {
                "id": ch['id'],
                "chapter_number": ch['chapter_number'],
                "chapter_title": ch['chapter_title'],
                "content_preview": ch['content_preview'],
                "word_count": ch['word_count'],
                "textbook_title": ch['textbook_title'],
                "subject": ch['subject']
            } for ch in chapters
        ]
    }

@api_router.post("/learning/start-chapter")
async def start_chapter(student_id: str, chapter_id: str):
    """Start learning a chapter"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if progress exists
    cur.execute("""
        SELECT * FROM learning_progress 
        WHERE student_id = %s AND chapter_id = %s
    """, (student_id, chapter_id))
    
    existing = cur.fetchone()
    
    if existing:
        # Update status
        cur.execute("""
            UPDATE learning_progress 
            SET status = 'in_progress', started_at = %s
            WHERE id = %s
        """, (datetime.now(timezone.utc), existing['id']))
    else:
        # Create new progress
        cur.execute("""
            INSERT INTO learning_progress 
            (id, student_id, chapter_id, status, started_at, completion_percentage)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), student_id, chapter_id, 'in_progress', 
              datetime.now(timezone.utc), 0.0))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Chapter started successfully"}

@api_router.get("/students/{student_id}/learning-path")
async def get_learning_path(student_id: str):
    """Get recommended learning path for student"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get all textbooks with chapters
    cur.execute("""
        SELECT t.id, t.title, t.subject, t.total_chapters,
               c.id as chapter_id, c.chapter_number, c.chapter_title,
               lp.status, lp.completion_percentage
        FROM textbooks t
        LEFT JOIN chapters c ON t.id = c.textbook_id
        LEFT JOIN learning_progress lp ON c.id = lp.chapter_id AND lp.student_id = %s
        ORDER BY t.title, c.chapter_number
    """, (student_id,))
    
    results = cur.fetchall()
    cur.close()
    conn.close()
    
    # Organize by textbook
    textbooks = {}
    for row in results:
        if row['id'] not in textbooks:
            textbooks[row['id']] = {
                "textbook_id": row['id'],
                "title": row['title'],
                "subject": row['subject'],
                "total_chapters": row['total_chapters'],
                "chapters": []
            }
        
        if row['chapter_id']:
            textbooks[row['id']]['chapters'].append({
                "chapter_id": row['chapter_id'],
                "chapter_number": row['chapter_number'],
                "chapter_title": row['chapter_title'],
                "status": row['status'] or 'not_started',
                "completion_percentage": row['completion_percentage'] or 0.0
            })
    
    return {
        "student_id": student_id,
        "textbooks": list(textbooks.values())
    }

@api_router.post("/chat/interactive")
async def interactive_chat(student_id: str, chapter_id: Optional[str] = None, action: str = "greet"):
    """Interactive learning chat with proactive tutor"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get student info
    cur.execute("SELECT * FROM students WHERE id = %s", (student_id,))
    student = cur.fetchone()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    if action == "greet":
        # Welcome message
        system_message = f"""You are an enthusiastic, friendly virtual tutor. 
        Greet {student['name']} warmly and ask what they'd like to learn today.
        Be encouraging and make learning exciting!"""
        
        user_prompt = f"Greet the student and ask what subject or topic they want to explore."
        
    elif action == "suggest_chapter" and chapter_id:
        # Get chapter info
        cur.execute("""
            SELECT c.*, t.title as textbook_title 
            FROM chapters c
            JOIN textbooks t ON c.textbook_id = t.id
            WHERE c.id = %s
        """, (chapter_id,))
        chapter = cur.fetchone()
        
        system_message = f"""You are an engaging virtual tutor for {student['name']}.
        Introduce Chapter {chapter['chapter_number']}: {chapter['chapter_title']} from {chapter['textbook_title']}.
        Make it sound interesting and exciting. Ask if they're ready to start learning!"""
        
        user_prompt = f"Introduce this chapter enthusiastically: {chapter['chapter_title']}"
        
    elif action == "check_understanding":
        system_message = f"""You are a caring tutor checking if {student['name']} understood the topic.
        Ask them friendly questions to verify their understanding.
        Be encouraging regardless of their answer."""
        
        user_prompt = "Check if the student understood what we just learned. Ask them a simple question."
    
    else:
        return {"response": "Hello! Ready to learn?", "response_type": "greeting"}
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=user_prompt))
        
        # Save to chat history
        cur.execute("""
            INSERT INTO chat_history (id, student_id, message, role, timestamp, response_type)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), student_id, response, 'assistant', 
              datetime.now(timezone.utc), action))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "response": response,
            "response_type": action,
            "action": action
        }
    except Exception as e:
        logging.error(f"Interactive chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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