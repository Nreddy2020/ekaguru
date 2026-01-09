import sys
import subprocess
import os
import requests
import time

def check_command(command, name):
    try:
        version = subprocess.check_output(command, shell=True, stderr=subprocess.STDOUT).decode().strip()
        print(f"✅ {name}: {version}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ {name}: Not Found or Error")
        return False

def check_file(path, name):
    if os.path.exists(path):
        print(f"✅ {name}: Found ({path})")
        return True
    else:
        print(f"❌ {name}: Missing ({path})")
        return False

def run_pre_flight_check():
    print("🚀 EKAGURU PRE-FLIGHT CHECK 🚀")
    print("===============================")
    
    # 1. Environment Tools
    print("\n[1] Environment Tools")
    checks = [
        ("node -v", "Node.js"),
        ("npm -v", "NPM"),
        ("python --version", "Python"),
        ("git --version", "Git"),
        ("gh --version", "GitHub CLI")
    ]
    
    tools_ok = all([check_command(cmd, name) for cmd, name in checks])

    # 2. Build Artifacts
    print("\n[2] Build Artifacts")
    artifacts = [
        ("parent_dashboard/frontend/dist/index.html", "Frontend Build (HTML)"),
        ("parent_dashboard/frontend/dist/assets", "Frontend Assets Directory"),
        ("docs/pilot_user_guide.md", "Pilot User Guide")
    ]
    
    builds_ok = all([check_file(os.path.abspath(path), name) for path, name in artifacts])

    # 3. Codebase Integrity
    print("\n[3] Codebase Integrity")
    services = [
        "orchestrator_service",
        "memory_service",
        "teaching_agent",
        "diagnosis_agent",
        "parent_dashboard"
    ]
    
    integrity_ok = True
    for service in services:
        if os.path.exists(service):
             print(f"✅ Service: {service}")
        else:
             print(f"❌ Service: {service} MISSING")
             integrity_ok = False

    print("\n===============================")
    if tools_ok and builds_ok and integrity_ok:
        print("✅ SYSTEM READY FOR LAUNCH")
        sys.exit(0)
    else:
        print("⚠️  SYSTEM HAS ISSUES")
        sys.exit(1)

if __name__ == "__main__":
    run_pre_flight_check()
