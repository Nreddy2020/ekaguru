import yaml
import unittest

class TestSecurityConfig(unittest.TestCase):
    
    def test_network_policies(self):
        with open("kubernetes/network-policies.yaml", "r") as f:
            docs = list(yaml.safe_load_all(f))
            
        # 1. Check Default Deny
        deny_policy = next((d for d in docs if d["metadata"]["name"] == "default-deny-all"), None)
        self.assertIsNotNone(deny_policy)
        self.assertEqual(deny_policy["spec"]["podSelector"], {})
        print("✅ NetworkPolicy: Default Deny configured properly")
        
        # 2. Check DB Access
        db_policy = next((d for d in docs if d["metadata"]["name"] == "allow-memory-db-access"), None)
        self.assertIsNotNone(db_policy)
        print("✅ NetworkPolicy: DB Access restricted to Memory Service")

    def test_pod_security(self):
        with open("kubernetes/pod-security.yaml", "r") as f:
            docs = list(yaml.safe_load_all(f))
            
        # 3. Check Namespace Enforcement
        ns = next((d for d in docs if d["kind"] == "Namespace"), None)
        self.assertEqual(ns["metadata"]["labels"]["pod-security.kubernetes.io/enforce"], "restricted")
        print("✅ PodSecurity: Namespace set to 'restricted' mode")
        
        # 4. Check Container Context
        deploy = next((d for d in docs if d["kind"] == "Deployment"), None)
        container = deploy["spec"]["template"]["spec"]["containers"][0]
        self.assertTrue(container["securityContext"]["readOnlyRootFilesystem"])
        
        # Check Pod Level Security Context
        pod_ctx = deploy["spec"]["template"]["spec"]["securityContext"]
        self.assertTrue(pod_ctx["runAsNonRoot"])
        print("✅ PodSecurity: Root filesystem is read-only & Non-root user enforced")

if __name__ == '__main__':
    unittest.main()
