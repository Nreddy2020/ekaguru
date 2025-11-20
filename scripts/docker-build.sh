#!/bin/bash
set -ex

# --- Pre-flight Checks ---

# Function to check for required command-line tools
check_dependencies() {
    echo "--- Checking for required tools and services ---"
    local missing_tools=0
    local required_tools=("docker" "kubectl" "nc")

    # Check for command existence
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "Error: Required tool '$tool' is not installed or not in your PATH."
            missing_tools=1
        fi
    done

    if [ $missing_tools -ne 0 ]; then
        echo "Please install the missing tools and try again."
        exit 1
    fi
    echo "All required command-line tools are present."

    # Check if Docker daemon is running
    echo "--- Checking if Docker daemon is running ---"
    if ! docker info &> /dev/null; then
        echo "Error: The Docker daemon is not running."
        echo "Please start Docker Desktop and ensure it is running before executing this script."
        exit 1
    fi
    echo "Docker daemon is running."
}

# Function to check for Kubernetes cluster connectivity
check_cluster() {
    echo "--- Checking Kubernetes cluster connectivity ---"
    if ! kubectl cluster-info &> /dev/null; then
        echo "Error: Cannot connect to the Kubernetes cluster."
        echo "Please ensure your k3d cluster is running ('k3d cluster start') and your KUBECONFIG is set correctly."
        exit 1
    fi
    echo "Successfully connected to the Kubernetes cluster."
}

# --- Main Script ---

echo "--- SCRIPT EXECUTION STARTED ---"

NAMESPACE="emergent"
REGISTRY="localhost:5000"
CLUSTER_REGISTRY="registry:5000" # How the cluster sees the registry
BACKEND_IMAGE_NAME="emergent-backend"
FRONTEND_IMAGE_NAME="emergent-frontend"
TAG="latest"

# Run all pre-flight checks
check_dependencies
check_cluster

echo "Changing to project root directory..."
cd "$(dirname "$0")/.."
echo "Current directory: $(pwd)"

# Step 0: Ensure the in-cluster registry is deployed and ready
echo "--- Ensuring in-cluster registry is running ---"
kubectl apply -f k8s/registry.yaml
echo "Waiting for registry to become available..."
kubectl -n "$NAMESPACE" wait --for=condition=ready pod -l app=registry --timeout=120s
echo "Registry is ready."

# Step 1: Start the registry port-forward in the background
echo "Starting registry port-forward in the background..."
kubectl -n "$NAMESPACE" port-forward service/registry 5000:5000 &
PORT_FORWARD_PID=$!
echo "Port-forward process started with PID: $PORT_FORWARD_PID"

# Function to clean up background jobs on exit
cleanup() {
    echo "Stopping background port-forward job (PID: $PORT_FORWARD_PID)..."
    kill $PORT_FORWARD_PID
}
trap cleanup EXIT

echo "Waiting for port-forward on port 5000 to become active..."
timeout=30
for (( i=0; i<${timeout}; i++ )); do
    if nc -z localhost 5000; then
        echo "Port-forward is active."
        break
    fi
    if (( i == timeout - 1 )); then
        echo "Error: Timed out waiting for port-forward." >&2; exit 1;
    fi
    sleep 1
done

# Step 2: Build, Tag, and Push images
build_tag_push() {
    local name=$1
    local path=$2
    local imageName=$3
    local imageTag=$4

    echo "Building $name image locally..."
    docker build -t "$imageName:$imageTag" "$path"

    local registryTag="$REGISTRY/$imageName:$imageTag"

    echo "Tagging image for registry as $registryTag"
    docker tag "$imageName:$imageTag" "$registryTag"

    echo "Pushing $registryTag to in-cluster registry..."
    docker push "$registryTag"
}

build_tag_push "backend" "./backend" "$BACKEND_IMAGE_NAME" "$TAG"
build_tag_push "frontend" "./frontend" "$FRONTEND_IMAGE_NAME" "$TAG"

# Step 3: Update image references in Kubernetes manifests and apply them
echo "Applying Kubernetes deployments and ingress..."

# Use sed to replace the placeholder image name with the correct in-cluster registry path.
# This is crucial to avoid ImagePullBackOff errors.
# We pipe the modified YAML directly to kubectl apply.
sed -e "s|image: .*emergent-backend.*|image: $CLUSTER_REGISTRY/$BACKEND_IMAGE_NAME:$TAG|g" ./k8s/backend-deployment.yaml | kubectl apply -f -
sed -e "s|image: .*emergent-frontend.*|image: $CLUSTER_REGISTRY/$FRONTEND_IMAGE_NAME:$TAG|g" ./k8s/frontend-deployment.yaml | kubectl apply -f -

# Apply other manifests that don't need image replacement
kubectl apply -f ./k8s/ingress.yaml

echo "--- Deployment complete. Monitor pods with: kubectl -n $NAMESPACE get pods -w ---"
