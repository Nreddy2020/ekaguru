import yaml
import unittest
import os

class TestCostOptimization(unittest.TestCase):
    
    def test_hpa_config(self):
        path = "kubernetes/hpa.yaml"
        self.assertTrue(os.path.exists(path))
        with open(path, "r") as f:
            docs = list(yaml.safe_load_all(f))
            
        hpa = next((d for d in docs if d["metadata"]["name"] == "diagnosis-agent-hpa"), None)
        self.assertIsNotNone(hpa)
        self.assertEqual(hpa["spec"]["maxReplicas"], 5)
        # Check target utilization
        metric = hpa["spec"]["metrics"][0]
        self.assertEqual(metric["resource"]["target"]["averageUtilization"], 80)
        print("✅ HPA Config validated: Aggressive scaling for agents")

    def test_llm_cache(self):
        path = "kubernetes/llm-cache.yaml"
        self.assertTrue(os.path.exists(path))
        with open(path, "r") as f:
            deploy = yaml.safe_load(f)
            
        # Check resource limits (important for cost)
        limits = deploy["spec"]["template"]["spec"]["containers"][0]["resources"]["limits"]
        self.assertEqual(limits["memory"], "256Mi")
        print("✅ LLM Cache validated: Redis deployment with strict resource limits")

if __name__ == '__main__':
    unittest.main()
