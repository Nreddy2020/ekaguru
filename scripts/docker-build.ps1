param(
    [string]$Namespace = "emergent",
    [string]$Registry = "localhost:5000", # Use localhost for pushing from your machine
    [string]$ClusterRegistry = "registry:5000", # How the cluster sees the registry
    [string]$BackendImageName = "emergent-backend",
    [string]$FrontendImageName = "emergent-frontend",
    [string]$Tag = "latest"
)

Write-Host "--- Starting Fast Docker Build & Deploy ---"
Push-Location -Path (Join-Path $PSScriptRoot '..')

# Diagnostic Step: Check if Docker is configured for insecure registry
Write-Host "Checking Docker configuration for insecure-registries..."
$dockerInfo = docker info --format '{{json .}}' | ConvertFrom-Json
if ($dockerInfo.RegistryConfig.InsecureRegistryCIDRs -join ',' -notlike "*$Registry*") {
    Write-Error "Docker is not configured to allow insecure access to '$Registry'. Please go to Docker Desktop > Settings > Docker Engine and add '`"insecure-registries`": [`"$Registry`"]'. Then click 'Apply & Restart'."
    exit 1
}

$portForwardJob = $null
try {
    # Step 1: Start the registry port-forward as a background job
    # This allows your local Docker to push to the in-cluster registry without a separate terminal.
    Write-Host "Starting registry port-forward in the background..."
    $portForwardJob = Start-Job -ScriptBlock { 
        param($ns)
        kubectl -n $ns port-forward service/registry 5000:5000 
    } -ArgumentList $Namespace
    
    # Wait dynamically for the port-forward to be ready
    Write-Host "Waiting for port-forward on port 5000 to become active..."
    $timeout = 30 # seconds
    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    while ($timer.Elapsed.TotalSeconds -lt $timeout) {
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port 5000 -ErrorAction Stop
            if ($connection.TcpTestSucceeded) {
                Write-Host "Port-forward is active."
                break
            }
        } catch {}
        Start-Sleep -Seconds 1
    }

    # Step 2: Build, Tag, and Push images using local Docker
    function Build-Tag-Push($name, $path, $imageName, $imageTag) {
        Write-Host "Building $name image locally..."
        docker build -t "$imageName`:$imageTag" $path

        $localTag = "$imageName`:$imageTag"
        $registryTag = "$Registry/$imageName`:$imageTag"

        Write-Host "Tagging image for registry as $registryTag"
        docker tag $localTag $registryTag

        Write-Host "Pushing $registryTag to in-cluster registry..."
        docker push $registryTag
    }

    Build-Tag-Push -name "backend" -path ".\backend" -imageName $BackendImageName -imageTag $Tag
    Build-Tag-Push -name "frontend" -path ".\frontend" -imageName $FrontendImageName -imageTag $Tag

    # Step 3: Apply Kubernetes deployments to use the new images
    Write-Host "Applying Kubernetes deployments and ingress..."
    kubectl apply -f .\k8s\backend-deployment.yaml,.\k8s\frontend-deployment.yaml,.\k8s\ingress.yaml

} finally {
    # Final Step: Clean up the background job
    if ($portForwardJob) {
        Write-Host "Stopping background port-forward job..."
        Stop-Job -Job $portForwardJob
        Remove-Job -Job $portForwardJob
    }
    Pop-Location
    Write-Host "--- Deployment complete. Monitor pods with: kubectl -n $Namespace get pods -w ---"
}