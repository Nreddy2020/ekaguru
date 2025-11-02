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
from google import genai 
from google.genai.types import UserContent, Part
import json
import re
import PyPDF2
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
from docx import Document
import io
import base64
from openai import OpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads' / 'images'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Initialize embedding model
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Initialize OpenAI client for TTS
openai_client = OpenAI(api_key=os.environ.get('GOOGLE_LLM_KEY'))

# PostgreSQL connection
def get_db_connection():
    return psycopg2.connect(
        dbname=os.environ.get('POSTGRES_DB', 'virtual_tutor'),
        user=os.environ.get('POSTGRES_USER', 'postgres'),
        password=os.environ.get('POSTGRES_PASSWORD', 'postgres'),
        host=os.environ.get('POSTGRES_HOST', 'postgres'),
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
def split_and_save_image(img: Image.Image, textbook_id: str, base_index: int, total_pages: int) -> List[str]:
    """Splits a single image into two and saves them sequentially."""
    
    # Only split if width is much greater than height (indicates two pages side-by-side)
    width, height = img.size
    if width > 1.5 * height:
        logging.info("Detected double-page image. Splitting into two.")
        
        # Split point is the vertical center
        left_half = img.crop((0, 0, width // 2, height))
        right_half = img.crop((width // 2, 0, width, height))
        
        paths = []
        
        # Save left half (Page 1)
        image_filename_left = f"{textbook_id}_page_{base_index}.jpg"
        image_path_left = UPLOADS_DIR / image_filename_left
        left_half.save(image_path_left, 'JPEG', quality=90)
        paths.append(f"/uploads/images/{image_filename_left}")
        
        # Save right half (Page 2)
        if base_index + 1 <= total_pages: # Prevent saving if it exceeds hypothetical max
            image_filename_right = f"{textbook_id}_page_{base_index + 1}.jpg"
            image_path_right = UPLOADS_DIR / image_filename_right
            right_half.save(image_path_right, 'JPEG', quality=90)
            paths.append(f"/uploads/images/{image_filename_right}")
            
        return paths
    
    # Save as single page (standard case)
    image_filename = f"{textbook_id}_page_{base_index}.jpg"
    image_path = UPLOADS_DIR / image_filename
    img.save(image_path, 'JPEG', quality=90)
    return [f"/uploads/images/{image_filename}"]

def extract_and_save_images_from_pdf(pdf_content: bytes, textbook_id: str) -> List[str]:
    """Extract pages from PDF, handling multi-page splits, and save them at high resolution."""
    all_images_paths = []
    
    try:
        pdf_images = convert_from_bytes(pdf_content, dpi=300)
        current_idx = 1
        
        for img in pdf_images:
            # Check if image is a double-page spread and split it
            saved_paths = split_and_save_image(img, textbook_id, current_idx, current_idx + 1)
            all_images_paths.extend(saved_paths)
            
            # Increment index based on how many pages were actually saved (1 or 2)
            current_idx += len(saved_paths)
            
        logging.info(f"Extracted and saved {len(all_images_paths)} single-page assets from PDF.")
    except Exception as e:
        logging.error(f"Error extracting images from PDF: {e}")
    
    return all_images_paths

def save_image_file(image_content: bytes, textbook_id: str, filename: str) -> str:
    """Save an image file (used for single image uploads)"""
    try:
        img = Image.open(io.BytesIO(image_content))
        
        # For single image upload, we assume it's one page unless split is needed
        saved_paths = split_and_save_image(img, textbook_id, 1, 2)
        
        if len(saved_paths) > 1:
            logging.warning("Single image upload was split into two pages. Only returning the first page path.")
        
        return saved_paths[0]
        
    except Exception as e:
        logging.error(f"Error saving image: {e}")
        return None

def extract_text_from_pdf(file_content: bytes) -> tuple:
    """Extract text from PDF file and return (text, page_texts)"""
    try:
        # Try to extract text directly
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        page_texts = []
        
        for i, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n===PAGE {i+1}===\n" + page_text + "\n"
                page_texts.append((i+1, page_text))
        
        # If no text extracted, try OCR (for scanned PDFs)
        if len(text.strip()) < 100:
            logging.info("PDF appears to be scanned, using OCR...")
            images = convert_from_bytes(file_content)
            text = ""
            page_texts = []
            for i, image in enumerate(images):
                logging.info(f"Processing page {i+1} with OCR...")
                page_text = pytesseract.image_to_string(image)
                text += f"\n===PAGE {i+1}===\n" + page_text + "\n"
                page_texts.append((i+1, page_text))
        
        return text.strip(), page_texts
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

def process_file_content(file_content: bytes, filename: str) -> tuple:
    """Process file content based on file type. Returns (text, page_texts)"""
    file_ext = filename.lower().split('.')[-1]
    
    # PDF files
    if file_ext == 'pdf':
        return extract_text_from_pdf(file_content)  # Returns (text, page_texts)
    
    # Image files
    elif file_ext in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif', 'webp']:
        text = extract_text_from_image(file_content)
        return text, None
    
    # Word documents
    elif file_ext in ['docx', 'doc']:
        if file_ext == 'doc':
            raise HTTPException(status_code=400, detail="Please convert .doc files to .docx format")
        text = extract_text_from_docx(file_content)
        return text, None
    
    # Text files
    elif file_ext in ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'c', 'cpp']:
        try:
            text = file_content.decode('utf-8')
            return text.strip(), None
        except UnicodeDecodeError:
            # Try other encodings
            for encoding in ['latin-1', 'iso-8859-1', 'cp1252']:
                try:
                    text = file_content.decode(encoding)
                    return text.strip(), None
                except:
                    continue
            raise HTTPException(status_code=400, detail="Unable to decode text file")
    
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file_ext}. Supported types: PDF, images (JPG, PNG, etc.), Word documents (.docx), and text files."
        )

def extract_table_of_contents(page_texts: List[tuple]) -> List[Dict[str, Any]]:
    """
    Extract Table of Contents from the first few pages.
    Returns list of {chapter_number, chapter_title, page_number}
    """
    toc_entries = []
    toc_found = False
    
    # Check first 10 pages for TOC
    for page_num, page_text in page_texts[:10]:
        lines = page_text.split('\n')
        
        # Look for TOC markers
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            
            # Detect TOC start
            if any(marker in line_lower for marker in ['table of contents', 'contents', 'index']):
                toc_found = True
                logging.info(f"Found TOC on page {page_num}")
                
                # Parse TOC entries (look for patterns like "Chapter 1 ... 5" or "Unit 1: Title ... 10")
                for j in range(i+1, min(i+50, len(lines))):
                    toc_line = lines[j].strip()
                    if not toc_line or len(toc_line) < 5:
                        continue
                    
                    # Match patterns like:
                    # "Chapter 1: Title ........ 5"
                    # "Unit 1 Title 10"
                    # "1. Title ..... 15"
                    # Modified to prioritize UNIT/CHAPTER for better accuracy on textbook structure
                    toc_pattern = r'((?:Unit|Chapter|Ch\.?|Lesson)\s*(\d+)[:\.]?\s*([^.\d]{5,80}).*?)(\d+)'
                    match = re.search(toc_pattern, toc_line, re.IGNORECASE)
                    
                    if match:
                        chapter_num = int(match.group(2))
                        chapter_title = match.group(3).strip()
                        page_ref = int(match.group(4))
                        
                        # Clean title - remove dot leaders
                        chapter_title = re.sub(r'\.{2,}', '', chapter_title).strip()
                        
                        toc_entries.append({
                            'chapter_number': chapter_num,
                            'chapter_title': chapter_title,
                            'page_number': page_ref
                        })
                        logging.info(f"TOC entry: Ch{chapter_num} - {chapter_title} (page {page_ref})")
                
                if toc_entries:
                    break
        
        if toc_found and toc_entries:
            break
    
    return toc_entries

def extract_chapters_from_pdf_pages(page_texts: List[tuple], toc_entries: List[Dict] = None) -> List[Dict[str, Any]]:
    """
    Extract chapters from PDF pages using TOC information to define boundaries (FIXED LOGIC).
    """
    chapters = []
    current_chapter_num = 0
    chapter_content = []
    
    # Sort TOC entries by page number
    if toc_entries:
        toc_entries.sort(key=lambda x: x['page_number'])
    
    # Create a mapping of start page to chapter info
    page_to_chapter = {entry['page_number']: entry for entry in toc_entries}
    
    for page_num, page_text in page_texts:
        lines = page_text.split('\n')
        
        # 1. CHECK FOR NEW CHAPTER START (based on TOC page number)
        is_new_chapter_start = page_num in page_to_chapter
        
        if is_new_chapter_start:
            # Save the previous chapter before starting a new one
            if current_chapter_num > 0 and chapter_content:
                # Assuming the previous chapter structure was set up correctly
                prev_chapter = next((ch for ch in chapters if ch.get('chapter_number') == current_chapter_num), None)
                if prev_chapter:
                    content = '\n'.join(chapter_content)
                    prev_chapter['content'] = content
                    prev_chapter['word_count'] = len(content.split())
                    prev_chapter['content_preview'] = content[:800] + ('...' if len(content) > 800 else '')
                    logging.info(f"Closed chapter: {current_chapter_num}")
                
            # Start new chapter based on TOC data
            toc_entry = page_to_chapter[page_num]
            current_chapter_num = toc_entry['chapter_number']
            
            # Initialize new chapter structure (only needed once per chapter number)
            existing_chapter = next((ch for ch in chapters if ch.get('chapter_number') == current_chapter_num), None)
            if not existing_chapter:
                chapters.append({
                    'chapter_number': current_chapter_num,
                    'chapter_title': toc_entry['chapter_title'],
                    'page_number': page_num,
                    'content': '',
                    'word_count': 0,
                    'content_preview': ''
                })
            
            chapter_content = [] # Reset content buffer for the new chapter
            logging.info(f"Started new chapter: {current_chapter_num} on page {page_num}")
            
            
        # 2. Add content to the current chapter
        if current_chapter_num > 0:
            # Add all lines of the current page to the content buffer
            # Filter out short lines that might be page headers/footers
            chapter_content.extend([line.strip() for line in lines if len(line.strip()) > 5])

    # 3. Save the very last chapter after the loop finishes
    if current_chapter_num > 0 and chapter_content:
        # Save the final chunk of content to the last active chapter
        last_chapter = next((ch for ch in chapters if ch.get('chapter_number') == current_chapter_num), None)
        if last_chapter:
            content = '\n'.join(chapter_content)
            last_chapter['content'] = content
            last_chapter['word_count'] = len(content.split())
            last_chapter['content_preview'] = content[:800] + ('...' if len(content) > 800 else '')
            logging.info(f"Closed final chapter: {current_chapter_num}")

    return [ch for ch in chapters if ch.get('content') and ch.get('content').strip()]

def extract_chapters_from_text(text: str, page_texts: List[tuple] = None) -> List[Dict[str, Any]]:
    """
    Main chapter extraction function with improved logic.
    First extracts TOC, then uses it to guide chapter extraction.
    """
    chapters = []

    # If we have page texts (from PDF), use the better extraction method
    if page_texts and len(page_texts) > 0:
        logging.info(f"Extracting chapters from {len(page_texts)} pages using page-based method")

        # Step 1: Extract Table of Contents
        toc_entries = extract_table_of_contents(page_texts)

        # Step 2: Add TOC as first "chapter" if found
        if toc_entries:
            toc_text = "Table of Contents\n\n"
            for entry in toc_entries:
                toc_text += f"Chapter {entry['chapter_number']}: {entry['chapter_title']} (Page {entry['page_number']})\n"

            chapters.append({
                'chapter_number': 0,
                'chapter_title': 'Table of Contents',
                'content': toc_text,
                'word_count': len(toc_text.split()),
                'content_preview': toc_text[:500]
            })
            logging.info(f"Added TOC as Chapter 0 with {len(toc_entries)} entries")

        # Step 3: Extract actual chapters using page-based method
        extracted_chapters = extract_chapters_from_pdf_pages(page_texts, toc_entries)
        chapters.extend(extracted_chapters)

        if chapters:
            return chapters

    # Fallback: use text-based extraction (for non-PDF files)
    logging.info("Using text-based chapter extraction (fallback)")

    # Enhanced chapter patterns
    patterns = [
        r'(?:^|\n)(?:UNIT|Unit)\s+(\d+)[:\.]?\s*([^\n]{3,100})',
        r'(?:^|\n)(?:CHAPTER|Chapter)\s+(\d+)[:\.]?\s*([^\n]{3,100})',
        r'(?:^|\n)(?:LESSON|Lesson)\s+(\d+)[:\.]?\s*([^\n]{3,100})',
        r'(?:^|\n)(?:Ch\.|CH\.)\s+(\d+)[:\.]?\s*([^\n]{3,100})',
    ]

    lines = text.split('\n')
    current_chapter = None
    chapter_content = []

    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped or len(line_stripped) < 3:
            continue

        # Check for chapter header
        is_chapter = False
        for pattern in patterns:
            match = re.match(pattern, line_stripped, re.IGNORECASE)
            if match:
                # Save previous chapter
                if current_chapter and chapter_content:
                    content = '\n'.join(chapter_content)
                    if len(content.strip()) > 50:
                        current_chapter['content'] = content
                        current_chapter['word_count'] = len(content.split())
                        current_chapter['content_preview'] = content[:500] + ('...' if len(content) > 500 else '')
                        chapters.append(current_chapter)

                # Start new chapter
                chapter_num = int(match.group(1))
                chapter_title = match.group(2).strip()
                chapter_title = re.sub(r'\.{2,}', '', chapter_title).strip()

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
            chapter_content.append(line_stripped)

    # Save last chapter
    if current_chapter and chapter_content:
        content = '\n'.join(chapter_content)
        if len(content.strip()) > 50:
            current_chapter['content'] = content
            current_chapter['word_count'] = len(content.split())
            current_chapter['content_preview'] = content[:500] + ('...' if len(content) > 500 else '')
            chapters.append(current_chapter)

    # If no chapters found, create one with all content
    if not chapters:
        chapters.append({
            'chapter_number': 1,
            'chapter_title': 'Complete Content',
            'content': text,
            'word_count': len(text.split()),
            'content_preview': text[:500] + ('...' if len(text) > 500 else '')
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
    """Generate response using LLM with enhanced, structured prompts for deep learning."""
    api_key = os.environ.get('GOOGLE_LLM_KEY')

    # Base persona enforces Req 3, 8
    base_system_message = f"""You are a warm, caring, and patient mother-figure tutor helping {student_name}.
    Speak to {student_name} with love and encouragement, like a caring mother helping her child learn.
    Always be enthusiastic, gentle, and use phrases like 'my dear', 'sweetheart', and 'that's a wonderful question'.
    Your goal is to foster deep conceptual understanding (Req 6) and keep the student engaged (Req 8).
    """

    if response_type == 'explanation':
        # EXPLANATION PROMPT FOR DEEP LEARNING (Req 6, 7, 9, 10)
        system_message = base_system_message + f"""
        Your explanation must be highly memorable, connecting the concept to **real-world scenarios/analogs** (Req 7).
        Your explanation must progress from **simple sentences to fluent, detailed explanations** (Req 10).
        Conclude by fostering implementation (Req 9).
        """

        user_prompt = f"""Based on this textbook content:
        {context}

        Please explain the concept requested by the student: "{query}".

        Structure your explanation into these parts:
        1. **Simple Analogy (Req 10)**: A super simple way to think about it.
        2. **Detailed Explanation (Req 10)**: A clear explanation based on the textbook.
        3. **Real-World Use Case (Req 7)**: An example showing where this concept is used in real life.
        4. **Your Turn (Req 9)**: A final sentence asking the student to explain it back in their own words or write a summary."""

    elif response_type == 'deep_dive':
        # DEEP DIVE PROMPT (Req 3, 7, 8)
        system_message = base_system_message + """
        You are providing a Deep Dive session. Use captivating facts, advanced analogies, and cross-topic connections to ensure profound, lasting understanding (Req 6).
        """

        user_prompt = f"""Provide a deep dive into the current topic: "{query}". Use advanced concepts and fascinating facts related to the topic to deepen the student's knowledge."""

    else:  # quiz (or default) - Used for challenging questions (Req 4, 5)
        # QUIZ PROMPT FOR COMPLEX QUESTIONS (Req 4)
        system_message = base_system_message + """
        You are now a challenging quiz master. Generate a single, complex multiple-choice question that tests conceptual understanding and critical thinking (Req 4).
        Your output MUST be a strict JSON object so the backend can automatically grade it.
        """

        user_prompt = f"""Based on the context {context}, generate ONE challenging multiple-choice question that goes beyond basic facts to test conceptual understanding of: "{query}".

        Output MUST be a single JSON string in this format:
        {{
            "question": "[Your Question Here]",
            "options": ["A) [Option A]", "B) [Option B]", "C) [Option C]", "D) [Option D]"],
            "correct_answer": "[A, B, C, or D]",
            "topic_area": "[Topic of the question]"
        }}
        """

    # --- LLM API CALL (using google-genai SDK) ---
    try:
        # **NOTE: Using google.genai objects based on previous resolution**
        client = genai.Client(api_key=api_key)

        contents = [
            genai.types.Content(role='system', parts=[Part.from_text(system_message)]),
            genai.types.Content(role='user', parts=[Part.from_text(user_prompt)])
        ]

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents
        )
        return response.text
    except Exception as e:
        logging.error(f"LLM Error: {e}")
        return f"I am sorry, sweetheart, I couldn't process your request right now. Let's try again in a moment!"

# FILE: backend/server.py (ADD THIS NEW PLACEHOLDER API ROUTE for Req 5)
@api_router.get("/students/{student_id}/metrics")
async def get_student_metrics(student_id: str):
    """
    Get student's real-time mastery and fluency metrics (Placeholder for Req 5).
    """
    # NOTE: Real implementation requires calculating these in the DB/business logic

    # Placeholder Logic: Simulate metric progression based on time/attempts
    mastery = min(0.95, (len(student_id) % 10) * 0.1 + 0.5)
    accuracy = min(0.85, (len(student_id) % 8) * 0.1 + 0.3)
    fluency = min(0.9, (len(student_id) % 9) * 0.1 + 0.4)

    return {
        "mastery": mastery, # Overall conceptual understanding
        "accuracy": accuracy, # Quiz/assessment correctness
        "fluency": fluency  # Progress from simple to complex explanations (Req 10)
    }

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
        text, page_texts = process_file_content(content, file.filename)

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
            # NOTE: Image processing now handles multi-page splitting internally
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

        # Extract chapters from text (pass page_texts for better extraction)
        chapters = extract_chapters_from_text(text, page_texts)
        logging.info(f"Extracted {len(chapters)} chapters from textbook")

        # Store chapters
        for idx, chapter in enumerate(chapters):
            chapter_id = str(uuid.uuid4())
            # Assign images to chapters (distribute evenly)
            chapter_images = []
            if images:
                # Assign images sequentially based on chapter boundaries defined by TOC
                # NOTE: The current implementation divides images equally. A more robust solution
                # would use image filenames to match page numbers, but we proceed with simple distribution.
                images_per_chapter = len(images) // len(chapters)
                start_idx = idx * images_per_chapter
                end_idx = start_idx + images_per_chapter if idx < len(chapters) - 1 else len(images)
                chapter_images = images[start_idx:end_idx]

            cur.execute("""
                INSERT INTO chapters (id, textbook_id, chapter_number, chapter_title,
                                     chapter_summary, content_preview, word_count, created_at, images)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (chapter_id, textbook_id, chapter['chapter_number'], chapter['chapter_title'],
                  '', chapter['content_preview'], chapter['word_count'], datetime.now(timezone.utc),
                  json.dumps(chapter_images)))

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

@api_router.delete("/textbooks/{textbook_id}")
async def delete_textbook(textbook_id: str):
    """Delete a textbook and all associated data"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Get images to delete from filesystem
        cur.execute("""
            SELECT images FROM chapters WHERE textbook_id = %s
        """, (textbook_id,))

        chapters = cur.fetchall()

        # Delete image files
        for chapter in chapters:
            if chapter['images']:
                # images is already a list (JSONB), no need to parse
                images = chapter['images'] if isinstance(chapter['images'], list) else json.loads(chapter['images'])
                for img_path in images:
                    try:
                        file_path = ROOT_DIR / img_path.lstrip('/')
                        if file_path.exists():
                            file_path.unlink()
                    except Exception as e:
                        logging.error(f"Error deleting image: {e}")

        # Delete from database (cascades to chapters, chunks, etc.)
        cur.execute("DELETE FROM textbooks WHERE id = %s", (textbook_id,))

        conn.commit()
        cur.close()
        conn.close()

        return {"message": "Textbook deleted successfully"}
    except Exception as e:
        logging.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/learning/update-progress")
async def update_learning_progress(student_id: str, chapter_id: str, completion_percentage: float):
    """Update chapter completion progress"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Check if progress exists
    cur.execute("""
        SELECT * FROM learning_progress
        WHERE student_id = %s AND chapter_id = %s
    """, (student_id, chapter_id))

    existing = cur.fetchone()

    status = 'in_progress'
    if completion_percentage >= 100:
        status = 'completed'

    if existing:
        # Update
        cur.execute("""
            UPDATE learning_progress
            SET completion_percentage = %s, status = %s,
                completed_at = CASE WHEN %s >= 100 THEN %s ELSE completed_at END
            WHERE id = %s
        """, (completion_percentage, status, completion_percentage,
              datetime.now(timezone.utc), existing['id']))
    else:
        # Create new
        cur.execute("""
            INSERT INTO learning_progress
            (id, student_id, chapter_id, status, started_at, completion_percentage)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), student_id, chapter_id, status,
              datetime.now(timezone.utc), completion_percentage))

    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Progress updated", "status": status}

@api_router.get("/chapter/{chapter_id}")
async def get_chapter_details(chapter_id: str):
    """Get full chapter details with images"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        SELECT c.*, t.title as textbook_title, t.subject, t.id as textbook_id
        FROM chapters c
        JOIN textbooks t ON c.textbook_id = t.id
        WHERE c.id = %s
    """, (chapter_id,))

    chapter = cur.fetchone()
    cur.close()
    conn.close()

    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    # Handle images - JSONB is already parsed as list
    images = chapter['images'] if isinstance(chapter['images'], list) else (json.loads(chapter['images']) if chapter['images'] else [])

    return {
        "id": chapter['id'],
        "textbook_id": chapter['textbook_id'],
        "chapter_number": chapter['chapter_number'],
        "chapter_title": chapter['chapter_title'],
        "chapter_summary": chapter.get('chapter_summary', ''),
        "content_preview": chapter['content_preview'],
        "word_count": chapter['word_count'],
        "textbook_title": chapter['textbook_title'],
        "subject": chapter['subject'],
        "images": images
    }

@api_router.get("/chapters/{chapter_id}")
async def get_chapter_details_alt(chapter_id: str):
    """Alternative endpoint for chapter details (backwards compatibility)"""
    return await get_chapter_details(chapter_id)

@api_router.get("/textbooks/{textbook_id}/chapters")
async def get_textbook_chapters(textbook_id: str):
    """Get all chapters from a textbook with images"""
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
                "chapter_summary": ch.get('chapter_summary', ''),
                "content_preview": ch['content_preview'],
                "word_count": ch['word_count'],
                "textbook_title": ch['textbook_title'],
                "subject": ch['subject'],
                "images": ch['images'] if isinstance(ch['images'], list) else (json.loads(ch['images']) if ch['images'] else [])
            } for ch in chapters
        ]
    }

@api_router.get("/textbooks/{textbook_id}/pages")
async def get_textbook_all_pages(textbook_id: str):
    """
    Get all image assets for a textbook, ordered sequentially by chapter and page.
    This provides the full book sequence for the frontend viewer.
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Select all chapter images, ordered by chapter_number
    # The image path array (JSONB) already holds the page sequence for each chapter
    cur.execute("""
        SELECT images
        FROM chapters
        WHERE textbook_id = %s
        ORDER BY c.chapter_number
    """, (textbook_id,))

    results = cur.fetchall()
    cur.close()
    conn.close()

    all_pages = []

    for row in results:
        # Since row['images'] is stored as JSONB, it is returned as a list
        # We need to handle potential stringified JSON if the database type is ambiguous, but assume list
        images = row['images'] if isinstance(row['images'], list) else (json.loads(row['images']) if row['images'] else [])
        all_pages.extend(images)

    if not all_pages:
        raise HTTPException(status_code=404, detail="Textbook or its processed pages not found.")

    return {
        "textbook_id": textbook_id,
        "total_pages": len(all_pages),
        "page_paths": all_pages # List of paths like ['/uploads/images/id_page_1.jpg', ...]
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
async def interactive_chat(student_id: str, chapter_id: Optional[str] = None, action: str = "greet", word: Optional[str] = None):
    """Interactive learning chat with warm, motherly tutor"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Get student info
    cur.execute("SELECT * FROM students WHERE id = %s", (student_id,))
    student = cur.fetchone()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    api_key = os.environ.get('EMERGENT_LLM_KEY')

    if action == "greet":
        system_message = f"""You are a warm, caring, and patient mother-figure tutor.
        Speak to {student['name']} with love and encouragement, like a caring mother helping her child learn.
        Use warm, affectionate language. Be enthusiastic about learning!
        Ask what they'd like to learn today in a gentle, encouraging way."""

        user_prompt = f"Greet {student['name']} warmly as a loving mother would, and ask what they want to learn."

    elif action == "explain_word" and word:
        system_message = f"""You are a patient, loving mother explaining things to {student['name']}.
        Explain the word "{word}" in simple, clear terms that a child can understand.
        Use examples from everyday life. Be warm and encouraging."""

        user_prompt = f"Explain what '{word}' means in a simple, loving way with an example."

    elif action == "suggest_chapter" and chapter_id:
        # Get chapter info with images
        cur.execute("""
            SELECT c.*, t.title as textbook_title
            FROM chapters c
            JOIN textbooks t ON c.textbook_id = t.id
            WHERE c.id = %s
        """, (chapter_id,))
        chapter = cur.fetchone()

        system_message = f"""You are a loving mother-figure tutor for {student['name']}.
        Introduce Chapter {chapter['chapter_number']}: {chapter['chapter_title']} with warmth and enthusiasm.
        Speak like you're telling an exciting story to your child.
        Make them feel excited and safe to learn. Use phrases like "my dear", "sweetheart", "let's discover together"."""

        user_prompt = f"Introduce this chapter with motherly warmth: {chapter['chapter_title']}. Make it sound like an adventure!"

    elif action == "explain_with_images" and chapter_id:
        # Get chapter with images
        cur.execute("""
            SELECT c.*, t.title as textbook_title
            FROM chapters c
            JOIN textbooks t ON c.textbook_id = t.id
            WHERE c.id = %s
        """, (chapter_id,))
        chapter = cur.fetchone()

        system_message = f"""You are a loving mother teaching {student['name']}.
        Explain this chapter's content step by step, like you're showing pictures in a storybook.
        Be patient, warm, and use simple language. Encourage questions.
        Reference "the images we're looking at" to make it feel like you're going through a picture book together."""

        user_prompt = f"Explain the content of '{chapter['chapter_title']}' warmly, as if showing pictures to your child."

    elif action == "check_understanding":
        system_message = f"""You are a gentle, encouraging mother checking if {student['name']} understood.
        Ask in a kind, non-threatening way. Make them feel safe to say if they don't understand.
        Use phrases like "Tell mama what you learned", "Can you explain it back to me, sweetie?"
        Be proud and encouraging of any attempt they make."""

        user_prompt = "Gently ask if they understood, in a warm motherly way."
    
    elif action == "deep_dive" and word:
        # DEEP DIVE PROMPT (Req 3, 7, 8)
        system_message = f"""You are a loving mother providing a Deep Dive session to {student['name']}. 
        Use captivating facts, advanced analogies, and cross-topic connections to ensure profound, lasting understanding (Req 6).
        """
        
        user_prompt = f"""Provide a deep dive into the current topic: "{word}". Use advanced concepts and fascinating facts related to the topic to deepen the student's knowledge."""

    else:
        return {"response": "Hello my dear! Ready to learn together?", "response_type": "greeting"}

    try:
        # **NOTE: Using google.genai objects based on previous resolution**
        client = genai.Client(api_key=os.environ.get('GOOGLE_LLM_KEY'))

        contents = [
            genai.types.Content(role='system', parts=[Part.from_text(system_message)]),
            genai.types.Content(role='user', parts=[Part.from_text(user_prompt)])
        ]

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents
        )
        response_text = response.text

        # Save to chat history
        cur.execute("""
            INSERT INTO chat_history (id, student_id, message, role, timestamp, response_type)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), student_id, response_text, 'assistant',
              datetime.now(timezone.utc), action))

        conn.commit()
        cur.close()
        conn.close()

        return {
            "response": response_text,
            "response_type": action,
            "action": action
        }
    except Exception as e:
        logging.error(f"Interactive chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# TTS Request Model
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    voice: Optional[str] = Field(default="nova", description="Voice: nova, shimmer, coral, sage, fable")
    speed: Optional[float] = Field(default=1.0, ge=0.25, le=4.0)

@api_router.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech using OpenAI TTS with female voice.
    Returns audio stream for real-time playback.
    """
    try:
        logging.info(f"Generating speech: voice={request.voice}, text_length={len(request.text)}")

        # Call OpenAI TTS API with streaming
        response = openai_client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice=request.voice,
            input=request.text,
            response_format="mp3",
            speed=request.speed
        )

        # Return streaming response
        def audio_stream():
            for chunk in response.iter_bytes(chunk_size=1024):
                if chunk:
                    yield chunk

        return StreamingResponse(
            audio_stream(),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename=speech.mp3",
                "Cache-Control": "no-cache"
            }
        )

    except Exception as e:
        logging.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate speech: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

# Serve static uploaded images
app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

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
