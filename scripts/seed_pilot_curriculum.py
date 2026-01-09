import requests
import json
import time

# Configuration
MEMORY_SERVICE_URL = "http://localhost:8000"

def seed_concept(concept_data):
    """Seed a concept into the Knowledge Graph (Simulated via Memory Service)"""
    # In a real scenario, this would POST to a /concepts endpoint
    # For MVP, we simulate this by logging the creation or initializing state for a demo student
    print(f"Adding concept: {concept_data['name']} ({concept_data['domain']})")
    
    # We can simulate initialization by creating a struggling state for a test student
    # This prepares the specific "Pilot" scenario
    
    # 1. Fractions (Math)
    if concept_data['name'] == "Fractions":
        print(f"  - Key Misconception: {concept_data['misconceptions'][0]}")
        print("  - Content: 'A fraction represents a part of a whole.'")
        
    # 2. Photosynthesis (Science)
    elif concept_data['name'] == "Photosynthesis":
         print(f"  - Key Misconception: {concept_data['misconceptions'][0]}")
         print("  - Content: 'Plants use sunlight to make food.'")
         
    return True

def run_seeder():
    """Main execution flow"""
    print("🌱 Starting Pilot Curriculum Seeding...")
    
    curriculum = [
        {
            "id": "math_fractions_01",
            "name": "Fractions",
            "domain": "Mathematics",
            "difficulty": "Intermediate",
            "misconceptions": ["Adding denominators directly (1/2 + 1/2 = 2/4)"]
        },
        {
            "id": "science_photo_01",
            "name": "Photosynthesis",
            "domain": "Biology",
            "difficulty": "Intermediate",
            "misconceptions": ["Plants get food from the soil (soil is just nutrients, not food)"]
        }
    ]
    
    for concept in curriculum:
        success = seed_concept(concept)
        if success:
            print(f"✅ seeded {concept['id']}")
            
    print("\n🎉 Pilot Curriculum Ready!")
    print("Next Step: Run 'verify_backend_analytics.py' to simulate student interaction with these topics.")

if __name__ == "__main__":
    run_seeder()
