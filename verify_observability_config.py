import yaml
import unittest
import os

class TestObservabilityConfig(unittest.TestCase):
    
    def test_prometheus_config(self):
        path = "kubernetes/monitoring/prometheus-config.yaml"
        self.assertTrue(os.path.exists(path))
        with open(path, "r") as f:
            doc = yaml.safe_load(f)
            self.assertEqual(doc["metadata"]["name"], "prometheus-config")
            self.assertIn("prometheus.yml", doc["data"])
            self.assertIn("job_name", doc["data"]["prometheus.yml"])
        print("✅ Prometheus ConfigMap validated")

    def test_grafana_dashboard(self):
        path = "kubernetes/monitoring/grafana-dashboard.yaml"
        self.assertTrue(os.path.exists(path))
        with open(path, "r") as f:
            doc = yaml.safe_load(f)
            self.assertEqual(doc["metadata"]["name"], "grafana-dashboards")
            self.assertIn("learning-dashboard.json", doc["data"])
        print("✅ Grafana Dashboard validated")
        
    def test_loki_config(self):
        path = "kubernetes/monitoring/loki.yaml"
        self.assertTrue(os.path.exists(path))
        with open(path, "r") as f:
            docs = list(yaml.safe_load_all(f))
            
        # Check deployment
        deploy = next((d for d in docs if d["kind"] == "Deployment"), None)
        self.assertIsNotNone(deploy)
        self.assertEqual(deploy["spec"]["template"]["spec"]["containers"][0]["name"], "loki")
        
        # Check config map
        cm = next((d for d in docs if d["kind"] == "ConfigMap"), None)
        self.assertIsNotNone(cm)
        self.assertIn("loki.yaml", cm["data"])
        print("✅ Loki Deployment & Config validated")

if __name__ == '__main__':
    unittest.main()
