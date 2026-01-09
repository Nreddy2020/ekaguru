import yaml
import os
import sys

def check_file(path):
    if not os.path.exists(path):
        print(f"❌ Missing file: {path}")
        return False
    
    try:
        with open(path, 'r') as f:
            list(yaml.safe_load_all(f))
        print(f"✅ Valid YAML: {path}")
        return True
    except Exception as e:
        print(f"❌ Invalid YAML: {path} - {e}")
        return False

def verify_openshift():
    print("🚀 VERIFYING OPENSHIFT ARTIFACTS 🚀")
    print("====================================")
    
    files = [
        "openshift/routes.yaml",
        "openshift/scc.yaml"
    ]
    
    success = all([check_file(f) for f in files])
    
    if success:
        print("\n✅ OpenShift Manifests are VALID.")
        print("   - Ready for 'oc apply -f openshift/'")
        sys.exit(0)
    else:
        print("\n⚠️  Validation Failed.")
        sys.exit(1)

if __name__ == "__main__":
    verify_openshift()
