param(
    [string]$Namespace = "emergent",
    [string]$SecretName = "emergent-tls-secret",
    [string]$CertDir = ".\k8s\certs"
)

Write-Host "--- Generating Self-Signed TLS Certificate ---"

# Ensure cert directory exists
if (-not (Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir | Out-Null
}

$keyFile = Join-Path $CertDir "tls.key"
$crtFile = Join-Path $CertDir "tls.crt"

# Generate self-signed certificate using openssl
Write-Host "Generating certificate and key files in $CertDir..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $keyFile -out $crtFile -subj "/CN=emergent.local"

if ($LASTEXITCODE -ne 0) {
    Write-Error "OpenSSL command failed. Please ensure OpenSSL is installed and in your system's PATH."
    exit 1
}

Write-Host "Certificate generated successfully."

# Create the Kubernetes secret and apply it
Write-Host "Creating and applying Kubernetes TLS secret '$SecretName'..."
kubectl -n $Namespace create secret tls $SecretName --key $keyFile --cert $crtFile --dry-run=client -o yaml | kubectl apply -f -

Write-Host "Cleaning up local certificate files..."
Remove-Item $keyFile
Remove-Item $crtFile

Write-Host "--- TLS Secret '$SecretName' created successfully in namespace '$Namespace' ---"