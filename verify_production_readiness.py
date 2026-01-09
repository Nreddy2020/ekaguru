import unittest
import os
import yaml
import glob

class TestProductionReadiness(unittest.TestCase):
    
    def test_manifest_validity(self):
        """Verify all Kubernetes YAML files are valid"""
        yaml_files = glob.glob("kubernetes/**/*.yaml", recursive=True)
        print(f"Checking {len(yaml_files)} YAML manifests...")
        
        for file in yaml_files:
            if "Chart.yaml" in file: continue # Helm charts handled separately
            if "templates" in file: continue # Skip Helm templates (Go syntax)
            
            with open(file, "r", encoding="utf-8") as f:
                try:
                    list(yaml.safe_load_all(f))
                except yaml.YAMLError as e:
                    self.fail(f"Invalid YAML in {file}: {e}")
        print("✅ All Kubernetes manifests are valid YAML")

    def test_security_controls(self):
        """Verify critical security controls exist"""
        self.assertTrue(os.path.exists("kubernetes/network-policies.yaml"), "NetworkPolicies missing")
        self.assertTrue(os.path.exists("kubernetes/pod-security.yaml"), "PodSecurity missing")
        print("✅ Security controls present")

    def test_cicd_pipeline(self):
        """Verify CI/CD structure"""
        self.assertTrue(os.path.exists(".github/workflows/ci.yaml"), "CI workflow missing")
        self.assertTrue(os.path.exists("kubernetes/charts/ekaguru-service/Chart.yaml"), "Helm Chart missing")
        print("✅ CI/CD pipeline configured")

    def test_observability(self):
        """Verify observability stack"""
        self.assertTrue(os.path.exists("kubernetes/monitoring/prometheus-config.yaml"), "Prometheus config missing")
        self.assertTrue(os.path.exists("kubernetes/monitoring/grafana-dashboard.yaml"), "Grafana dashboard missing")
        self.assertTrue(os.path.exists("kubernetes/monitoring/loki.yaml"), "Loki config missing")
        print("✅ Observability stack configured")

    def test_cost_controls(self):
        """Verify cost controls"""
        self.assertTrue(os.path.exists("kubernetes/hpa.yaml"), "HPA config missing")
        self.assertTrue(os.path.exists("kubernetes/llm-cache.yaml"), "LLM Cache missing")
        print("✅ Cost optimization controls configured")

if __name__ == '__main__':
    unittest.main()
