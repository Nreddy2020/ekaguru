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
# Here are your Instructions
