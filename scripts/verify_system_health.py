import os
import sys
import importlib

# Add project root to path
PROJECT_ROOT = "e:/Ekaguru"
sys.path.append(PROJECT_ROOT)

SERVICES = [
    {"name": "Memory Service", "path": "memory_service/app", "main": "main.py"},
    {"name": "Orchestrator", "path": "orchestrator_service/app", "main": "main.py"},
    {"name": "Diagnosis Agent", "path": "diagnosis_agent/app", "main": "main.py"},
    {"name": "Teaching Agent", "path": "teaching_agent/app", "main": "main.py"},
    {"name": "Struggle Agent", "path": "struggle_agent/app", "main": "main.py"},
    {"name": "Reflection Agent", "path": "reflection_agent/app", "main": "main.py"},
    {"name": "Transfer Agent", "path": "transfer_agent/app", "main": "main.py"},
    {"name": "School Service", "path": "school_service", "main": "main.py"},
    {"name": "Gamification Service", "path": "gamification_service", "main": "main.py"},
    {"name": "Ingestion Service", "path": "services/ingestion/app", "main": "main.py"},
]

FRONTEND_PATHS = [
    "parent_dashboard/frontend/src/App.tsx",
    "parent_dashboard/frontend/src/pages/TeacherDashboard.tsx",
    "parent_dashboard/frontend/src/components/teacher/CurriculumUpload.tsx",
]

def check_file_exists(path):
    full_path = os.path.join(PROJECT_ROOT, path)
    if os.path.exists(full_path):
        return True, "✅ Found"
    return False, "❌ Missing"

def check_python_syntax(path):
    full_path = os.path.join(PROJECT_ROOT, path)
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            compile(f.read(), full_path, 'exec')
        return True, "✅ Syntax OK"
    except Exception as e:
        return False, f"❌ Syntax Error: {e}"

def main():
    print("🏥 Ekaguru System Health Check")
    print("==============================\n")
    
    all_passed = True

    print("Checking Backend Services:")
    print("--------------------------")
    for service in SERVICES:
        file_path = os.path.join(service["path"], service["main"])
        exists, msg = check_file_exists(file_path)
        syntax_ok = False
        syntax_msg = "Skipped"
        
        if exists:
            syntax_ok, syntax_msg = check_python_syntax(file_path)
            
        status = "🟢 HEALTHY" if exists and syntax_ok else "🔴 CRITICAL"
        if status == "🔴 CRITICAL": all_passed = False
            
        print(f"[{status}] {service['name']:<20} | File: {msg:<10} | Syntax: {syntax_msg}")

    print("\nChecking Frontend Components:")
    print("---------------------------")
    for path in FRONTEND_PATHS:
        exists, msg = check_file_exists(path)
        status = "🟢 FOUND" if exists else "🔴 MISSING"
        if not exists: all_passed = False
        print(f"[{status}] {os.path.basename(path):<25} | {msg}")

    print("\n==============================")
    if all_passed:
        print("✅ SYSTEM READY FOR FLIGHT. All core components are present and valid.")
        sys.exit(0)
    else:
        print("❌ SYSTEM ISSUES DETECTED. See above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
