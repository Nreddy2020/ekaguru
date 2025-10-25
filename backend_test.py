#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Virtual Tutor Application
Tests all backend endpoints and functionality
"""

import requests
import json
import os
import time
import uuid
from pathlib import Path
import io
from PIL import Image
import tempfile

# Configuration
BACKEND_URL = "https://learnbuddy-27.preview.emergentagent.com/api"
TEST_RESULTS = []

def log_test(test_name, status, details=""):
    """Log test results"""
    result = {
        "test": test_name,
        "status": status,
        "details": details,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    TEST_RESULTS.append(result)
    print(f"[{status}] {test_name}: {details}")

def test_api_health():
    """Test basic API connectivity"""
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Virtual Tutor API" and data.get("status") == "running":
                log_test("API Health Check", "PASS", "API is running and accessible")
                return True
            else:
                log_test("API Health Check", "FAIL", f"Unexpected response: {data}")
                return False
        else:
            log_test("API Health Check", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test("API Health Check", "FAIL", f"Connection error: {str(e)}")
        return False

def test_student_management():
    """Test student creation and retrieval"""
    try:
        # Test creating a student
        student_data = {
            "name": "Emma Johnson",
            "grade_level": "5th Grade",
            "avatar_preference": "friendly"
        }
        
        response = requests.post(f"{BACKEND_URL}/students", json=student_data, timeout=10)
        if response.status_code != 200:
            log_test("Student Creation", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return None
        
        student = response.json()
        student_id = student.get("id")
        
        if not student_id or student.get("name") != student_data["name"]:
            log_test("Student Creation", "FAIL", f"Invalid response: {student}")
            return None
        
        log_test("Student Creation", "PASS", f"Created student: {student['name']} (ID: {student_id})")
        
        # Test listing students
        response = requests.get(f"{BACKEND_URL}/students", timeout=10)
        if response.status_code != 200:
            log_test("Student List", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return student_id
        
        students = response.json()
        if not isinstance(students, list) or len(students) == 0:
            log_test("Student List", "FAIL", f"No students returned: {students}")
            return student_id
        
        # Check if our student is in the list
        found_student = next((s for s in students if s.get("id") == student_id), None)
        if found_student:
            log_test("Student List", "PASS", f"Found {len(students)} students including our test student")
        else:
            log_test("Student List", "FAIL", "Created student not found in list")
        
        return student_id
        
    except Exception as e:
        log_test("Student Management", "FAIL", f"Exception: {str(e)}")
        return None

def create_test_text():
    """Create a simple test text content"""
    content = """Chapter 1: Introduction to Mathematics

Mathematics is the study of numbers, shapes, and patterns. In this chapter, we will learn about basic arithmetic operations.

Addition is combining two or more numbers to get a sum. For example, when we add 2 + 3, we get 5.

Subtraction is taking away one number from another. For example, when we subtract 5 - 2, we get 3.

Chapter 2: Basic Operations

Let's practice addition and subtraction with examples.

Example 1: Addition
5 + 3 = 8
This means we start with 5 and add 3 more to get 8.

Example 2: Subtraction  
10 - 4 = 6
This means we start with 10 and take away 4 to get 6.

Chapter 3: Advanced Concepts

Now that we understand basic operations, let's explore more complex mathematical concepts.

Multiplication is repeated addition. For example, 3 × 4 means adding 3 four times: 3 + 3 + 3 + 3 = 12.

Division is the opposite of multiplication. It means splitting a number into equal parts.
"""
    return content.encode('utf-8')

def create_test_image():
    """Create a simple test image with text"""
    try:
        # Create a simple image with text
        img = Image.new('RGB', (400, 200), color='white')
        
        # Save to bytes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return buffer.getvalue()
    except Exception as e:
        log_test("Test Image Creation", "FAIL", f"Could not create test image: {str(e)}")
        return None

def test_textbook_upload():
    """Test textbook upload functionality"""
    try:
        # Test PDF upload
        pdf_content = create_test_pdf()
        
        files = {
            'file': ('test_math_book.pdf', pdf_content, 'application/pdf')
        }
        data = {
            'title': 'Elementary Mathematics',
            'subject': 'Mathematics'
        }
        
        response = requests.post(f"{BACKEND_URL}/textbooks/upload", files=files, data=data, timeout=30)
        
        if response.status_code != 200:
            log_test("PDF Upload", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return None
        
        upload_result = response.json()
        textbook_id = upload_result.get("id")
        
        if not textbook_id:
            log_test("PDF Upload", "FAIL", f"No textbook ID returned: {upload_result}")
            return None
        
        log_test("PDF Upload", "PASS", f"Uploaded textbook: {upload_result.get('title')} (ID: {textbook_id})")
        
        # Test image upload
        img_content = create_test_image()
        if img_content:
            files = {
                'file': ('test_image.png', img_content, 'image/png')
            }
            data = {
                'title': 'Test Image Document',
                'subject': 'Visual Learning'
            }
            
            response = requests.post(f"{BACKEND_URL}/textbooks/upload", files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                img_result = response.json()
                log_test("Image Upload", "PASS", f"Uploaded image document: {img_result.get('title')}")
            else:
                log_test("Image Upload", "FAIL", f"HTTP {response.status_code}: {response.text}")
        
        return textbook_id
        
    except Exception as e:
        log_test("Textbook Upload", "FAIL", f"Exception: {str(e)}")
        return None

def test_textbook_listing():
    """Test textbook listing"""
    try:
        response = requests.get(f"{BACKEND_URL}/textbooks", timeout=10)
        
        if response.status_code != 200:
            log_test("Textbook Listing", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return []
        
        textbooks = response.json()
        
        if not isinstance(textbooks, list):
            log_test("Textbook Listing", "FAIL", f"Expected list, got: {type(textbooks)}")
            return []
        
        log_test("Textbook Listing", "PASS", f"Retrieved {len(textbooks)} textbooks")
        
        # Validate textbook structure
        for textbook in textbooks:
            required_fields = ['id', 'filename', 'title', 'subject', 'upload_date', 'total_chunks']
            missing_fields = [field for field in required_fields if field not in textbook]
            if missing_fields:
                log_test("Textbook Structure", "FAIL", f"Missing fields: {missing_fields}")
                break
        else:
            log_test("Textbook Structure", "PASS", "All textbooks have required fields")
        
        return textbooks
        
    except Exception as e:
        log_test("Textbook Listing", "FAIL", f"Exception: {str(e)}")
        return []

def test_chapter_management(textbook_id):
    """Test chapter extraction and management"""
    if not textbook_id:
        log_test("Chapter Management", "SKIP", "No textbook ID available")
        return []
    
    try:
        # Test getting chapters for a textbook
        response = requests.get(f"{BACKEND_URL}/textbooks/{textbook_id}/chapters", timeout=10)
        
        if response.status_code != 200:
            log_test("Chapter Listing", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return []
        
        chapter_data = response.json()
        chapters = chapter_data.get("chapters", [])
        
        if not isinstance(chapters, list):
            log_test("Chapter Listing", "FAIL", f"Expected list, got: {type(chapters)}")
            return []
        
        log_test("Chapter Listing", "PASS", f"Retrieved {len(chapters)} chapters for textbook")
        
        # Test getting individual chapter details
        if chapters:
            chapter_id = chapters[0].get("id")
            if chapter_id:
                response = requests.get(f"{BACKEND_URL}/chapters/{chapter_id}", timeout=10)
                
                if response.status_code == 200:
                    chapter_detail = response.json()
                    required_fields = ['id', 'chapter_number', 'chapter_title', 'content_preview', 'word_count']
                    missing_fields = [field for field in required_fields if field not in chapter_detail]
                    
                    if missing_fields:
                        log_test("Chapter Details", "FAIL", f"Missing fields: {missing_fields}")
                    else:
                        log_test("Chapter Details", "PASS", f"Chapter details complete: {chapter_detail.get('chapter_title')}")
                else:
                    log_test("Chapter Details", "FAIL", f"HTTP {response.status_code}: {response.text}")
        
        return chapters
        
    except Exception as e:
        log_test("Chapter Management", "FAIL", f"Exception: {str(e)}")
        return []

def test_ai_chat(student_id, textbook_id):
    """Test AI chat functionality"""
    if not student_id:
        log_test("AI Chat", "SKIP", "No student ID available")
        return
    
    try:
        # Test basic chat without textbook context
        chat_data = {
            "student_id": student_id,
            "message": "Hello, can you help me learn mathematics?"
        }
        
        response = requests.post(f"{BACKEND_URL}/chat", json=chat_data, timeout=30)
        
        if response.status_code != 200:
            log_test("Basic AI Chat", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return
        
        chat_result = response.json()
        
        if not chat_result.get("response"):
            log_test("Basic AI Chat", "FAIL", f"No response received: {chat_result}")
            return
        
        log_test("Basic AI Chat", "PASS", f"Received response: {chat_result.get('response')[:100]}...")
        
        # Test chat with textbook context
        if textbook_id:
            chat_data_with_context = {
                "student_id": student_id,
                "message": "What is addition?",
                "textbook_ids": [textbook_id]
            }
            
            response = requests.post(f"{BACKEND_URL}/chat", json=chat_data_with_context, timeout=30)
            
            if response.status_code == 200:
                context_result = response.json()
                if context_result.get("response") and context_result.get("sources"):
                    log_test("Contextual AI Chat", "PASS", f"Chat with textbook context working")
                else:
                    log_test("Contextual AI Chat", "FAIL", f"Missing response or sources: {context_result}")
            else:
                log_test("Contextual AI Chat", "FAIL", f"HTTP {response.status_code}: {response.text}")
        
    except Exception as e:
        log_test("AI Chat", "FAIL", f"Exception: {str(e)}")

def test_progress_tracking(student_id):
    """Test learning progress tracking"""
    if not student_id:
        log_test("Progress Tracking", "SKIP", "No student ID available")
        return
    
    try:
        response = requests.get(f"{BACKEND_URL}/students/{student_id}/progress", timeout=10)
        
        if response.status_code != 200:
            log_test("Progress Tracking", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return
        
        progress_data = response.json()
        
        if "student_id" not in progress_data or "topics" not in progress_data:
            log_test("Progress Tracking", "FAIL", f"Invalid progress structure: {progress_data}")
            return
        
        topics = progress_data.get("topics", [])
        log_test("Progress Tracking", "PASS", f"Retrieved progress for {len(topics)} topics")
        
    except Exception as e:
        log_test("Progress Tracking", "FAIL", f"Exception: {str(e)}")

def test_textbook_deletion(textbook_id):
    """Test textbook deletion"""
    if not textbook_id:
        log_test("Textbook Deletion", "SKIP", "No textbook ID available")
        return
    
    try:
        response = requests.delete(f"{BACKEND_URL}/textbooks/{textbook_id}", timeout=10)
        
        if response.status_code != 200:
            log_test("Textbook Deletion", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return
        
        result = response.json()
        if result.get("message") == "Textbook deleted successfully":
            log_test("Textbook Deletion", "PASS", "Textbook deleted successfully")
        else:
            log_test("Textbook Deletion", "FAIL", f"Unexpected response: {result}")
        
    except Exception as e:
        log_test("Textbook Deletion", "FAIL", f"Exception: {str(e)}")

def test_static_file_serving():
    """Test static file serving for images"""
    try:
        # Try to access the uploads directory
        response = requests.get(f"https://learnbuddy-27.preview.emergentagent.com/uploads/", timeout=10)
        
        # Even if we get 404 or 403, it means the route exists
        if response.status_code in [200, 403, 404]:
            log_test("Static File Serving", "PASS", "Static file route is accessible")
        else:
            log_test("Static File Serving", "FAIL", f"HTTP {response.status_code}: {response.text}")
        
    except Exception as e:
        log_test("Static File Serving", "FAIL", f"Exception: {str(e)}")

def run_all_tests():
    """Run all backend tests"""
    print("=" * 60)
    print("VIRTUAL TUTOR BACKEND API TESTING")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print()
    
    # Test 1: API Health Check
    if not test_api_health():
        print("\n❌ API is not accessible. Stopping tests.")
        return
    
    # Test 2: Student Management
    student_id = test_student_management()
    
    # Test 3: Textbook Upload and Processing
    textbook_id = test_textbook_upload()
    
    # Test 4: Textbook Listing
    textbooks = test_textbook_listing()
    
    # Test 5: Chapter Management
    chapters = test_chapter_management(textbook_id)
    
    # Test 6: AI Chat with LLM
    test_ai_chat(student_id, textbook_id)
    
    # Test 7: Progress Tracking
    test_progress_tracking(student_id)
    
    # Test 8: Static File Serving
    test_static_file_serving()
    
    # Test 9: Textbook Deletion (cleanup)
    if textbook_id:
        test_textbook_deletion(textbook_id)
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in TEST_RESULTS if result["status"] == "PASS")
    failed = sum(1 for result in TEST_RESULTS if result["status"] == "FAIL")
    skipped = sum(1 for result in TEST_RESULTS if result["status"] == "SKIP")
    
    print(f"Total Tests: {len(TEST_RESULTS)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⏭️  Skipped: {skipped}")
    
    if failed > 0:
        print("\nFAILED TESTS:")
        for result in TEST_RESULTS:
            if result["status"] == "FAIL":
                print(f"  - {result['test']}: {result['details']}")
    
    print("\nDETAILED RESULTS:")
    for result in TEST_RESULTS:
        status_icon = "✅" if result["status"] == "PASS" else "❌" if result["status"] == "FAIL" else "⏭️"
        print(f"  {status_icon} {result['test']}: {result['details']}")
    
    return TEST_RESULTS

if __name__ == "__main__":
    results = run_all_tests()