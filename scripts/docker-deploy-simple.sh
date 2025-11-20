#!/bin/bash
set -e

echo "=== Simple Deployment Script for Emergent EkaGuru ==="

NAMESPACE="emergent"
REGISTRY="localhost:5000"
CLUSTER_REGISTRY="registry:5000"
BACKEND_IMAGE="emergent-backend"
FRONTEND_IMAGE="emergent-frontend"
TAG="latest"

# Check if images exist
echo "Checking for local Docker images..."
if ! docker images | grep -q "$BACKEND_IMAGE"; then
    echo "Error: Backend image not found. Please run 'docker-compose build' first."
    exit 1
fi

if ! docker images | grep -q "$FRONTEND_IMAGE"; then
    echo "Error: Frontend image not found. Please run 'docker-compose build' first."
    exit 1
fi

echo "Images found successfully!"

# Check cluster connectivity
echo "Checking Kubernetes cluster..."
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Cannot connect to Kubernetes cluster."
    exit 1
fi
echo "Cluster is accessible."

# Ensure namespace exists
echo "Ensuring namespace exists..."
kubectl get namespace $NAMESPACE &> /dev/null || kubectl create namespace $NAMESPACE

# Start port-forward to registry in a more robust way
echo "Setting up port-forward to registry..."

# Kill any existing port-forwards on port 5000
pkill -f "port-forward.*registry.*5000" || true
sleep 2

# Ensure the registry is deployed and wait for it to be ready.
# This is more reliable than a fixed sleep.
echo "Ensuring registry is deployed and ready..."
kubectl apply -f k8s/registry.yaml
kubectl -n "$NAMESPACE" wait --for=condition=ready pod -l app=registry --timeout=120s
echo "Registry is ready."

# Start port-forward in background
# Port-forward to the SERVICE, not a specific pod. This is more stable.
kubectl -n $NAMESPACE port-forward service/registry 5000:5000 &
PORT_FORWARD_PID=$!

# Cleanup function
cleanup() {
    echo "Cleaning up port-forward..."
    kill $PORT_FORWARD_PID 2>/dev/null || true
    pkill -f "port-forward.*registry.*5000" || true
}
trap cleanup EXIT

# Wait for port-forward to be ready
echo "Waiting for port-forward to be ready..."
for i in {1..30}; do
    if nc -z localhost 5000 2>/dev/null; then
        echo "Port-forward is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: Port-forward timed out"
        exit 1
    fi
    sleep 1
done

# Tag and push images
echo "Tagging and pushing backend image..."
docker tag emergent-ekaguru-backend:latest $REGISTRY/$BACKEND_IMAGE:$TAG
docker push $REGISTRY/$BACKEND_IMAGE:$TAG

echo "Tagging and pushing frontend image..."
docker tag emergent-ekaguru-frontend:latest $REGISTRY/$FRONTEND_IMAGE:$TAG
docker push $REGISTRY/$FRONTEND_IMAGE:$TAG

echo "Images pushed successfully!"

# Apply database resources
echo "Deploying PostgreSQL..."
kubectl apply -f k8s/configmap-init-sql.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
kubectl -n $NAMESPACE rollout status statefulset/postgres --timeout=120s || true

# Apply application deployments
echo "Deploying backend and frontend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

echo "Waiting for deployments to be ready..."
kubectl -n $NAMESPACE rollout status deployment/backend --timeout=120s || true
kubectl -n $NAMESPACE rollout status deployment/frontend --timeout=120s || true

# Show status
echo ""
echo "=== Deployment Status ==="
kubectl -n $NAMESPACE get pods
echo ""
echo "=== Services ==="
kubectl -n $NAMESPACE get svc
echo ""
echo "=== Ingress ==="
kubectl -n $NAMESPACE get ingress

echo ""
echo "=== Deployment Complete! ==="
echo "Monitor pods with: kubectl -n $NAMESPACE get pods -w"
echo "Check logs with: kubectl -n $NAMESPACE logs -f deployment/backend"
echo "Check logs with: kubectl -n $NAMESPACE logs -f deployment/frontend"
