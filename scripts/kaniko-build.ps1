param(
    [string]$Namespace = "emergent",
    [string]$Registry = "registry:5000",
    [string]$BackendImage = "emergent-backend:latest",
    [string]$FrontendImage = "emergent-frontend:latest"
)

Write-Host "Using namespace: $Namespace and registry: $Registry"

Push-Location -Path (Join-Path $PSScriptRoot '..')

# Ensure namespace exists
kubectl apply -f .\k8s\namespace.yaml

# Deploy in-cluster registry
kubectl apply -f .\k8s\registry.yaml
Write-Host "Waiting for registry to be ready..."
kubectl -n $Namespace wait --for=condition=available deployment/registry --timeout=120s

function Build-And-Push($name, $path, $imageTag) {
    $podName = "kaniko-$name"
    Write-Host "Creating kaniko pod: $podName"
    # Use the debug variant which includes shell utilities so sleep/tail exist
    kubectl -n $Namespace run $podName --image=gcr.io/kaniko-project/executor:debug --restart=Never --command -- sleep 3600

    Write-Host "Waiting for builder pod to be Ready..."
    try {
        kubectl -n $Namespace wait --for=condition=Ready pod/$podName --timeout=120s
    } catch {
        Write-Host "Builder pod failed to become ready. Collecting debug info..."
        try {
            kubectl -n $Namespace describe pod $podName
        } catch {
            Write-Host "describe failed"
        }
        try {
            kubectl -n $Namespace logs $podName --timestamps
        } catch {
            Write-Host "logs failed"
        }
        Write-Host "Deleting failed pod $podName"
        kubectl -n $Namespace delete pod $podName --ignore-not-found
        throw "Builder pod $podName failed to start. See above for details."
    }

    Write-Host "Copying source $path -> pod:/workspace"
    # Use the relative path (avoid absolute drive-letter paths which kubectl treats as remote)
    $copySource = "$path\."
    $destSpec = "${Namespace}/${podName}:/workspace"
    kubectl cp "$copySource" "$destSpec"

    Write-Host "Running kaniko to build and push $imageTag"
    $dest = "$Registry/$imageTag"
    kubectl -n $Namespace exec $podName -- /kaniko/executor --context dir:///workspace --dockerfile /workspace/Dockerfile --destination $dest --insecure

    Write-Host "Deleting builder pod $podName"
    kubectl -n $Namespace delete pod $podName --wait=true
}

Build-And-Push -name "backend" -path ".\backend" -imageTag $BackendImage
Build-And-Push -name "frontend" -path ".\frontend" -imageTag $FrontendImage

Write-Host "Applying application deployments and ingress..."
kubectl apply -f .\k8s\backend-deployment.yaml
kubectl apply -f .\k8s\frontend-deployment.yaml
kubectl apply -f .\k8s\ingress.yaml

Write-Host "Done. Use 'kubectl -n $Namespace get pods' to inspect workloads."
