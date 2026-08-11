import os
import sys
import importlib
import io

# Force stdout to use utf-8 to prevent charmap encoding crash on Windows terminals
if sys.stdout and sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except Exception:
        pass

# Add project root to path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(PROJECT_ROOT)

SERVICES = [
    {"name": "NestJS Backend", "path": "universal/backend/src", "main": "main.ts"},
    {"name": "Memory Service", "path": "cognitive_services/memory_service/app", "main": "main.py"},
    {"name": "Orchestrator", "path": "cognitive_services/orchestrator/app", "main": "main.py"},
    {"name": "Diagnosis Agent", "path": "cognitive_services/diagnosis/app", "main": "main.py"},
    {"name": "Teaching Agent", "path": "cognitive_services/teaching/app", "main": "main.py"},
    {"name": "Struggle Agent", "path": "cognitive_services/struggle/app", "main": "main.py"},
    {"name": "Reflection Agent", "path": "cognitive_services/reflection/app", "main": "main.py"},
    {"name": "Transfer Agent", "path": "cognitive_services/transfer/app", "main": "main.py"},
    {"name": "Parent Service", "path": "cognitive_services/parent/app", "main": "main.py"},
]

FRONTEND_PATHS = [
    "universal/frontend/app/page.tsx",
    "universal/frontend/app/layout.tsx",
    "universal/frontend/app/globals.css",
]

def check_file_exists(path):
    full_path = os.path.join(PROJECT_ROOT, path)
    if os.path.exists(full_path):
        return True, "✅ Found"
    return False, "❌ Missing"

def check_python_syntax(path):
    if not path.endswith('.py'):
        return True, "✅ Skipped (Non-Python)"
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
