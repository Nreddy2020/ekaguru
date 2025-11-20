# Virtual Tutor Application - Complete Deployment Package

## 🚀 Quick Deploy on CRC (Code Ready Containers)

### System Requirements
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB disk space

### One-Command Setup

```bash
# Step 1: Extract this package
unzip virtual-tutor-crc.zip
cd virtual-tutor-crc

# Step 2: Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your EMERGENT_LLM_KEY

# Step 3: Deploy
docker-compose up -d

# Step 4: Initialize database
docker-compose exec backend python init_db.py

# Step 5: Access
# Frontend: http://localhost:3000
# Backend API Docs: http://localhost:8001/docs
```

### Included Components

1. **Backend (FastAPI)**
   - REST API with all endpoints
   - PostgreSQL integration
   - pgvector for similarity search
   - PDF/OCR processing
   - Emergent LLM integration

2. **Frontend (React)**
   - Dashboard
   - Student profiles
   - Textbook upload
   - Learning session with avatar
   - TTS integration

3. **Database (PostgreSQL 15)**
   - Pre-configured with pgvector
   - Auto-initialization

### Customization

#### Backend Configuration
Edit `backend/.env`:
```
EMERGENT_LLM_KEY=your_key_here
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/virtual_tutor
```

#### Frontend Configuration  
Edit `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Troubleshooting

**Issue: Services not starting**
```bash
docker-compose logs
```

**Issue: Database connection failed**
```bash
docker-compose restart postgres
sleep 5
docker-compose restart backend
```

**Issue: Port conflicts**
Edit `docker-compose.yml` to change ports

### Production Deployment

1. Change all passwords in `.env` files
2. Use HTTPS/TLS certificates
3. Enable proper CORS settings
4. Use volume mounts for data persistence
5. Set up backups for PostgreSQL

### Support

For issues, check logs:
```bash
docker-compose logs backend
docker-compose logs frontend  
docker-compose logs postgres
```
## 🚀 Kubernetes Deployment with Kaniko

This project can be deployed to a Kubernetes cluster using the provided scripts and manifests. The build process uses Kaniko to build container images directly in the cluster.

### System Requirements
- A running Kubernetes cluster
- `kubectl` configured to connect to your cluster
- PowerShell

### Deployment Steps

1.  **Configure Environment:**
    Before deploying, you need to configure your Google LLM API key. The deployment will use a Kubernetes secret for this. Create a file named `secret-google-llm.yaml` in the `k8s` directory with the following content:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: google-llm-key
      namespace: emergent
    type: Opaque
    stringData:
      key: "YOUR_GOOGLE_LLM_KEY"
    ```
    Replace `"YOUR_GOOGLE_LLM_KEY"` with your actual API key.

2.  **Run the Deployment Script:**
    Open a PowerShell terminal and run the following command from the root of the project:

    ```powershell
    .\scripts\kaniko-build.ps1
    ```

    This script will:
    - Create the `emergent` namespace.
    - Deploy an in-cluster Docker registry.
    - Use Kaniko to build the backend and frontend images and push them to the in-cluster registry.
    - Deploy the PostgreSQL database, backend, and frontend applications.
    - Create an ingress resource to expose the services.

3.  **Access the Application:**
    Once the script is finished, you can access the application through the ingress. The exact URL will depend on your cluster's ingress controller configuration. You can find the ingress details by running:

    ```bash
    kubectl -n emergent get ingress
    ```

# Here are your Instructions
