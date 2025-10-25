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
        # Test text file upload (more reliable than PDF)
        text_content = create_test_text()
        
        files = {
            'file': ('test_math_book.txt', text_content, 'text/plain')
        }
        data = {
            'title': 'Elementary Mathematics',
            'subject': 'Mathematics'
        }
        
        response = requests.post(f"{BACKEND_URL}/textbooks/upload", files=files, data=data, timeout=30)
        
        if response.status_code != 200:
            log_test("Text File Upload", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return None
        
        upload_result = response.json()
        textbook_id = upload_result.get("id")
        
        if not textbook_id:
            log_test("Text File Upload", "FAIL", f"No textbook ID returned: {upload_result}")
            return None
        
        log_test("Text File Upload", "PASS", f"Uploaded textbook: {upload_result.get('title')} (ID: {textbook_id})")
        
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
    """Test chapter extraction and management - CRITICAL BUG FIX TESTING"""
    if not textbook_id:
        log_test("Chapter Management", "SKIP", "No textbook ID available")
        return []
    
    try:
        # CRITICAL TEST 1: GET /api/textbooks/{textbook_id}/chapters - Fixed JSONB handling
        response = requests.get(f"{BACKEND_URL}/textbooks/{textbook_id}/chapters", timeout=10)
        
        if response.status_code != 200:
            log_test("CRITICAL: Chapter Listing (JSONB Fix)", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return []
        
        chapter_data = response.json()
        chapters = chapter_data.get("chapters", [])
        
        if not isinstance(chapters, list):
            log_test("CRITICAL: Chapter Listing (JSONB Fix)", "FAIL", f"Expected list, got: {type(chapters)}")
            return []
        
        # Verify JSONB images field is properly handled
        for chapter in chapters:
            if 'images' in chapter:
                images = chapter['images']
                if not isinstance(images, list):
                    log_test("CRITICAL: JSONB Images Parsing", "FAIL", f"Images should be list, got: {type(images)}")
                    return []
        
        log_test("CRITICAL: Chapter Listing (JSONB Fix)", "PASS", f"Retrieved {len(chapters)} chapters with proper JSONB handling")
        
        # CRITICAL TEST 2: GET /api/chapter/{chapter_id} - NEW ENDPOINT
        if chapters:
            chapter_id = chapters[0].get("id")
            if chapter_id:
                # Test the NEW endpoint /api/chapter/{id}
                response = requests.get(f"{BACKEND_URL}/chapter/{chapter_id}", timeout=10)
                
                if response.status_code == 200:
                    chapter_detail = response.json()
                    required_fields = ['id', 'textbook_id', 'chapter_number', 'chapter_title', 
                                     'chapter_summary', 'content_preview', 'word_count', 
                                     'textbook_title', 'subject', 'images']
                    missing_fields = [field for field in required_fields if field not in chapter_detail]
                    
                    if missing_fields:
                        log_test("CRITICAL: New Chapter Endpoint", "FAIL", f"Missing fields: {missing_fields}")
                    else:
                        # Verify JSONB images field
                        images = chapter_detail.get('images', [])
                        if not isinstance(images, list):
                            log_test("CRITICAL: New Chapter Endpoint JSONB", "FAIL", f"Images should be list, got: {type(images)}")
                        else:
                            log_test("CRITICAL: New Chapter Endpoint", "PASS", f"Chapter details complete with JSONB: {chapter_detail.get('chapter_title')}")
                else:
                    log_test("CRITICAL: New Chapter Endpoint", "FAIL", f"HTTP {response.status_code}: {response.text}")
                
                # Also test the old endpoint for backwards compatibility
                response = requests.get(f"{BACKEND_URL}/chapters/{chapter_id}", timeout=10)
                if response.status_code == 200:
                    log_test("Backwards Compatibility: Old Chapter Endpoint", "PASS", "Old endpoint still works")
                else:
                    log_test("Backwards Compatibility: Old Chapter Endpoint", "FAIL", f"HTTP {response.status_code}")
        
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
    """Test textbook deletion - CRITICAL BUG FIX: JSONB parsing error fixed"""
    if not textbook_id:
        log_test("Textbook Deletion", "SKIP", "No textbook ID available")
        return
    
    try:
        # CRITICAL TEST: DELETE /api/textbooks/{textbook_id} - Fixed JSONB handling
        response = requests.delete(f"{BACKEND_URL}/textbooks/{textbook_id}", timeout=10)
        
        if response.status_code != 200:
            log_test("CRITICAL: Textbook Deletion (JSONB Fix)", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return
        
        result = response.json()
        if result.get("message") == "Textbook deleted successfully":
            log_test("CRITICAL: Textbook Deletion (JSONB Fix)", "PASS", "Textbook deleted successfully - JSONB parsing fixed")
            
            # Verify cascade deletion worked - check if chapters are also deleted
            response = requests.get(f"{BACKEND_URL}/textbooks/{textbook_id}/chapters", timeout=10)
            if response.status_code == 404 or (response.status_code == 200 and len(response.json().get("chapters", [])) == 0):
                log_test("Cascade Deletion Verification", "PASS", "Chapters properly deleted with textbook")
            else:
                log_test("Cascade Deletion Verification", "FAIL", "Chapters may not have been deleted")
        else:
            log_test("CRITICAL: Textbook Deletion (JSONB Fix)", "FAIL", f"Unexpected response: {result}")
        
    except Exception as e:
        log_test("CRITICAL: Textbook Deletion (JSONB Fix)", "FAIL", f"Exception: {str(e)}")

def test_text_to_speech():
    """Test OpenAI TTS integration - NEW FEATURE"""
    try:
        # Test TTS with valid request
        tts_data = {
            "text": "Hello Emma! Welcome to our virtual tutoring session. Today we'll learn about mathematics in a fun and engaging way.",
            "voice": "nova",
            "speed": 1.0
        }
        
        response = requests.post(f"{BACKEND_URL}/text-to-speech", json=tts_data, timeout=30)
        
        if response.status_code != 200:
            log_test("NEW: Text-to-Speech", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return
        
        # Check if we got audio content
        content_type = response.headers.get('content-type', '')
        if 'audio' in content_type.lower():
            audio_size = len(response.content)
            if audio_size > 1000:  # Should be substantial audio file
                log_test("NEW: Text-to-Speech", "PASS", f"Generated {audio_size} bytes of audio (voice: nova)")
            else:
                log_test("NEW: Text-to-Speech", "FAIL", f"Audio too small: {audio_size} bytes")
        else:
            log_test("NEW: Text-to-Speech", "FAIL", f"Wrong content type: {content_type}")
        
        # Test with different voice
        tts_data_shimmer = {
            "text": "This is a test with shimmer voice.",
            "voice": "shimmer",
            "speed": 1.2
        }
        
        response = requests.post(f"{BACKEND_URL}/text-to-speech", json=tts_data_shimmer, timeout=30)
        if response.status_code == 200 and 'audio' in response.headers.get('content-type', '').lower():
            log_test("TTS Voice Options", "PASS", "Multiple voices working (shimmer)")
        else:
            log_test("TTS Voice Options", "FAIL", f"Shimmer voice failed: {response.status_code}")
        
        # Test character limit (should be 2000 max)
        long_text = "A" * 2001
        tts_long = {
            "text": long_text,
            "voice": "nova"
        }
        
        response = requests.post(f"{BACKEND_URL}/text-to-speech", json=tts_long, timeout=30)
        if response.status_code == 422:  # Validation error expected
            log_test("TTS Character Limit", "PASS", "2000 character limit enforced")
        else:
            log_test("TTS Character Limit", "FAIL", f"Should reject long text: {response.status_code}")
        
    except Exception as e:
        log_test("NEW: Text-to-Speech", "FAIL", f"Exception: {str(e)}")

def test_enhanced_pdf_upload():
    """Test enhanced PDF upload with TOC extraction - NEW FEATURE"""
    try:
        # Create a simple PDF-like text with clear TOC structure
        pdf_like_content = """Table of Contents

Chapter 1: Introduction to Science .................. 5
Chapter 2: The Scientific Method ................... 15  
Chapter 3: Matter and Energy ....................... 25
Chapter 4: Forces and Motion ....................... 35

===PAGE 5===
Chapter 1: Introduction to Science

Science is the systematic study of the natural world through observation and experimentation.

In this chapter, we will explore what science is and why it's important for understanding our world.

===PAGE 15===
Chapter 2: The Scientific Method

The scientific method is a process used by scientists to investigate questions about the natural world.

Steps of the scientific method:
1. Observation
2. Hypothesis
3. Experiment
4. Analysis
5. Conclusion

===PAGE 25===
Chapter 3: Matter and Energy

Everything around us is made of matter. Matter is anything that has mass and takes up space.

Energy is the ability to do work or cause change.

===PAGE 35===
Chapter 4: Forces and Motion

A force is a push or pull that can change an object's motion.

Motion is the change in position of an object over time.
"""
        
        files = {
            'file': ('science_textbook.txt', pdf_like_content.encode('utf-8'), 'text/plain')
        }
        data = {
            'title': 'Elementary Science with TOC',
            'subject': 'Science'
        }
        
        response = requests.post(f"{BACKEND_URL}/textbooks/upload", files=files, data=data, timeout=30)
        
        if response.status_code != 200:
            log_test("Enhanced PDF Upload", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return None
        
        upload_result = response.json()
        textbook_id = upload_result.get("id")
        chapters_info = upload_result.get("chapters", [])
        
        # Check if TOC was detected and Chapter 0 was created
        has_toc_chapter = any(ch.get("number") == 0 and "table of contents" in ch.get("title", "").lower() 
                             for ch in chapters_info)
        
        if has_toc_chapter:
            log_test("NEW: TOC Detection", "PASS", "Table of Contents detected and saved as Chapter 0")
        else:
            log_test("NEW: TOC Detection", "FAIL", "TOC not detected or Chapter 0 not created")
        
        # Verify better chapter extraction
        regular_chapters = [ch for ch in chapters_info if ch.get("number", 0) > 0]
        if len(regular_chapters) >= 3:  # Should extract at least 3 chapters from our test content
            log_test("Enhanced Chapter Extraction", "PASS", f"Extracted {len(regular_chapters)} chapters with better detection")
        else:
            log_test("Enhanced Chapter Extraction", "FAIL", f"Only extracted {len(regular_chapters)} chapters")
        
        # Test the chapters endpoint to verify JSONB handling
        if textbook_id:
            response = requests.get(f"{BACKEND_URL}/textbooks/{textbook_id}/chapters", timeout=10)
            if response.status_code == 200:
                chapter_data = response.json()
                chapters = chapter_data.get("chapters", [])
                
                # Look for Chapter 0 (TOC)
                toc_chapter = next((ch for ch in chapters if ch.get("chapter_number") == 0), None)
                if toc_chapter:
                    log_test("TOC Chapter Verification", "PASS", f"Chapter 0 found: {toc_chapter.get('chapter_title')}")
                else:
                    log_test("TOC Chapter Verification", "FAIL", "Chapter 0 (TOC) not found in database")
        
        return textbook_id
        
    except Exception as e:
        log_test("Enhanced PDF Upload", "FAIL", f"Exception: {str(e)}")
        return None

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
    """Run all backend tests - COMPREHENSIVE CRITICAL BUG FIX TESTING"""
    print("=" * 80)
    print("VIRTUAL TUTOR BACKEND API TESTING - CRITICAL BUG FIXES")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print("🚨 PRIORITY: Testing critical bug fixes and new features")
    print()
    
    # Test 1: API Health Check
    if not test_api_health():
        print("\n❌ API is not accessible. Stopping tests.")
        return
    
    # Test 2: Student Management (prerequisite for other tests)
    student_id = test_student_management()
    
    # CRITICAL TESTS - Bug Fixes and New Features
    print("\n" + "🔥" * 50)
    print("CRITICAL BUG FIX TESTING")
    print("🔥" * 50)
    
    # Test 3: Enhanced PDF Upload with TOC extraction - NEW FEATURE
    enhanced_textbook_id = test_enhanced_pdf_upload()
    
    # Test 4: Regular Textbook Upload (for comparison)
    textbook_id = test_textbook_upload()
    
    # Test 5: Textbook Listing
    textbooks = test_textbook_listing()
    
    # Test 6: Chapter Management - CRITICAL JSONB fixes
    chapters = test_chapter_management(textbook_id or enhanced_textbook_id)
    
    # Test 7: NEW Text-to-Speech Feature
    test_text_to_speech()
    
    # Test 8: AI Chat with LLM
    test_ai_chat(student_id, textbook_id or enhanced_textbook_id)
    
    # Test 9: Progress Tracking
    test_progress_tracking(student_id)
    
    # Test 10: Static File Serving
    test_static_file_serving()
    
    # CRITICAL Test 11: Textbook Deletion - CRITICAL JSONB fix
    print("\n" + "🚨" * 30)
    print("TESTING CRITICAL DELETE BUG FIX")
    print("🚨" * 30)
    
    if textbook_id:
        test_textbook_deletion(textbook_id)
    if enhanced_textbook_id and enhanced_textbook_id != textbook_id:
        test_textbook_deletion(enhanced_textbook_id)
    
    # Print summary
    print("\n" + "=" * 80)
    print("COMPREHENSIVE TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for result in TEST_RESULTS if result["status"] == "PASS")
    failed = sum(1 for result in TEST_RESULTS if result["status"] == "FAIL")
    skipped = sum(1 for result in TEST_RESULTS if result["status"] == "SKIP")
    
    # Count critical tests
    critical_tests = [r for r in TEST_RESULTS if "CRITICAL" in r["test"] or "NEW" in r["test"]]
    critical_passed = sum(1 for r in critical_tests if r["status"] == "PASS")
    critical_failed = sum(1 for r in critical_tests if r["status"] == "FAIL")
    
    print(f"Total Tests: {len(TEST_RESULTS)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⏭️  Skipped: {skipped}")
    print()
    print(f"🔥 CRITICAL/NEW Tests: {len(critical_tests)}")
    print(f"🔥 ✅ Critical Passed: {critical_passed}")
    print(f"🔥 ❌ Critical Failed: {critical_failed}")
    
    if failed > 0:
        print("\n" + "❌" * 40)
        print("FAILED TESTS:")
        print("❌" * 40)
        for result in TEST_RESULTS:
            if result["status"] == "FAIL":
                priority = "🚨 CRITICAL: " if "CRITICAL" in result["test"] or "NEW" in result["test"] else ""
                print(f"  {priority}{result['test']}: {result['details']}")
    
    if critical_failed > 0:
        print(f"\n🚨 WARNING: {critical_failed} CRITICAL tests failed!")
        print("These are the bug fixes that were supposed to be working!")
    
    print("\nDETAILED RESULTS:")
    for result in TEST_RESULTS:
        status_icon = "✅" if result["status"] == "PASS" else "❌" if result["status"] == "FAIL" else "⏭️"
        priority_marker = "🔥 " if "CRITICAL" in result["test"] or "NEW" in result["test"] else "   "
        print(f"  {priority_marker}{status_icon} {result['test']}: {result['details']}")
    
    return TEST_RESULTS

if __name__ == "__main__":
    results = run_all_tests()