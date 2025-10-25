#!/usr/bin/env python3
"""
Additional API endpoint testing for Virtual Tutor Application
"""

import requests
import json
import time

BACKEND_URL = "https://learnbuddy-27.preview.emergentagent.com/api"

def test_learning_path_and_progress():
    """Test learning path and progress endpoints"""
    try:
        # First create a student
        student_data = {
            "name": "Alex Smith",
            "grade_level": "6th Grade",
            "avatar_preference": "smart"
        }
        
        response = requests.post(f"{BACKEND_URL}/students", json=student_data, timeout=10)
        if response.status_code != 200:
            print(f"❌ Student Creation Failed: {response.status_code}")
            return
        
        student = response.json()
        student_id = student.get("id")
        print(f"✅ Created test student: {student['name']} (ID: {student_id})")
        
        # Test learning path endpoint
        response = requests.get(f"{BACKEND_URL}/students/{student_id}/learning-path", timeout=10)
        if response.status_code == 200:
            learning_path = response.json()
            print(f"✅ Learning Path: Retrieved path with {len(learning_path.get('textbooks', []))} textbooks")
        else:
            print(f"❌ Learning Path Failed: {response.status_code}")
        
        # Test interactive chat endpoint
        response = requests.post(f"{BACKEND_URL}/chat/interactive", 
                               params={"student_id": student_id, "action": "greet"}, 
                               timeout=30)
        if response.status_code == 200:
            chat_result = response.json()
            print(f"✅ Interactive Chat: {chat_result.get('response_type')} - {chat_result.get('response')[:50]}...")
        else:
            print(f"❌ Interactive Chat Failed: {response.status_code}")
        
        return student_id
        
    except Exception as e:
        print(f"❌ Learning Path Test Failed: {str(e)}")
        return None

def test_chapter_learning_endpoints(student_id):
    """Test chapter learning specific endpoints"""
    if not student_id:
        print("⏭️ Skipping chapter learning tests - no student ID")
        return
    
    try:
        # Upload a textbook first
        text_content = """Chapter 1: Science Basics
Science is the study of the natural world through observation and experimentation.

Chapter 2: The Scientific Method
The scientific method is a systematic approach to understanding the world around us."""
        
        files = {
            'file': ('science_book.txt', text_content.encode('utf-8'), 'text/plain')
        }
        data = {
            'title': 'Basic Science',
            'subject': 'Science'
        }
        
        response = requests.post(f"{BACKEND_URL}/textbooks/upload", files=files, data=data, timeout=30)
        if response.status_code != 200:
            print(f"❌ Textbook Upload Failed: {response.status_code}")
            return
        
        textbook = response.json()
        textbook_id = textbook.get("id")
        print(f"✅ Uploaded test textbook: {textbook.get('title')}")
        
        # Get chapters
        response = requests.get(f"{BACKEND_URL}/textbooks/{textbook_id}/chapters", timeout=10)
        if response.status_code != 200:
            print(f"❌ Get Chapters Failed: {response.status_code}")
            return
        
        chapters_data = response.json()
        chapters = chapters_data.get("chapters", [])
        
        if not chapters:
            print("❌ No chapters found")
            return
        
        chapter_id = chapters[0].get("id")
        print(f"✅ Found {len(chapters)} chapters")
        
        # Test start chapter endpoint
        response = requests.post(f"{BACKEND_URL}/learning/start-chapter", 
                               params={"student_id": student_id, "chapter_id": chapter_id}, 
                               timeout=10)
        if response.status_code == 200:
            print("✅ Start Chapter: Successfully started chapter")
        else:
            print(f"❌ Start Chapter Failed: {response.status_code}")
        
        # Test update progress endpoint
        response = requests.post(f"{BACKEND_URL}/learning/update-progress", 
                               params={"student_id": student_id, "chapter_id": chapter_id, "completion_percentage": 50.0}, 
                               timeout=10)
        if response.status_code == 200:
            print("✅ Update Progress: Successfully updated progress")
        else:
            print(f"❌ Update Progress Failed: {response.status_code}")
        
        # Test interactive chat with chapter
        response = requests.post(f"{BACKEND_URL}/chat/interactive", 
                               params={"student_id": student_id, "action": "suggest_chapter", "chapter_id": chapter_id}, 
                               timeout=30)
        if response.status_code == 200:
            print("✅ Interactive Chat with Chapter: Working")
        else:
            print(f"❌ Interactive Chat with Chapter Failed: {response.status_code}")
        
        # Cleanup - delete textbook
        requests.delete(f"{BACKEND_URL}/textbooks/{textbook_id}", timeout=10)
        print("✅ Cleanup: Deleted test textbook")
        
    except Exception as e:
        print(f"❌ Chapter Learning Test Failed: {str(e)}")

def run_additional_tests():
    """Run all additional API tests"""
    print("=" * 60)
    print("ADDITIONAL API ENDPOINT TESTING")
    print("=" * 60)
    
    # Test learning path and progress
    student_id = test_learning_path_and_progress()
    
    # Test chapter learning endpoints
    test_chapter_learning_endpoints(student_id)
    
    print("\n" + "=" * 60)
    print("ADDITIONAL TESTS COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    run_additional_tests()