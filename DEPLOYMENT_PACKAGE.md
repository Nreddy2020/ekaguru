# Virtual Tutor Application - CRC Deployment Package

## Complete Code Structure for CRC (Code Ready Containers)

This package contains all code, dependencies, and configuration needed to deploy the Virtual Tutor Application on CRC platform.

---

## 📁 Directory Structure

```
virtual-tutor-app/
├── backend/
│   ├── server.py                 # Main FastAPI application
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment variables template
│   └── Dockerfile                # Backend container configuration
├── frontend/
│   ├── package.json              # Node dependencies
│   ├── .env.example              # Frontend environment template
│   ├── Dockerfile                # Frontend container configuration
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── components/
│   │   │   └── TutorAvatar.js
│   │   └── pages/
│   │       ├── Dashboard.js
│   │       ├── StudentProfile.js
│   │       ├── TextbookUpload.js
│   │       ├── TutorChat.js
│   │       ├── LearningPath.js
│   │       └── LearningSession.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docker-compose.yml            # Multi-container orchestration
├── setup.sh                      # Automated setup script
└── README.md                     # Deployment instructions
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Docker installed
- Docker Compose installed
- 4GB RAM minimum
- 10GB disk space

### Setup Commands

```bash
# 1. Extract/clone the code package
cd virtual-tutor-app

# 2. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Edit backend/.env and add your Emergent LLM key
# EMERGENT_LLM_KEY=your_key_here

# 4. Build and start all services
docker-compose up --build -d

# 5. Check service status
docker-compose ps

# 6. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001/docs
```

---

## 📦 Installation Files Included

### Backend Dependencies (requirements.txt)
- FastAPI==0.115.6
- uvicorn==0.34.0
- psycopg2-binary==2.9.10
- pgvector==0.3.6
- sentence-transformers==3.3.1
- emergentintegrations==0.1.36
- PyPDF2==3.0.1
- pdf2image==1.17.0
- python-docx==1.1.2
- pytesseract==0.3.14
- Pillow==11.0.0
- opencv-python-headless==4.10.0.84
- numpy==2.2.1
- torch==2.5.1

### Frontend Dependencies (package.json)
- React 18.3.1
- React Router DOM 7.1.1
- Axios 1.7.9
- Tailwind CSS 3.4.17
- Lucide React (icons)
- Sonner (toasts)
- Zustand (state management)

---

## 🐳 Docker Configuration

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    postgresql-client \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Frontend Dockerfile
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
CMD ["yarn", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: virtual_tutor
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/virtual_tutor
      - EMERGENT_LLM_KEY=${EMERGENT_LLM_KEY}
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

volumes:
  postgres_data:
  uploads:
```

---

## 🔧 Configuration

### Backend Environment Variables (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/virtual_tutor
MONGO_URL=mongodb://localhost:27017
EMERGENT_LLM_KEY=your_emergent_llm_key_here
```

### Frontend Environment Variables (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 📝 Features Included

1. **PDF Text Extraction**
   - Multi-format support (PDF, images, Word docs)
   - OCR for scanned documents
   - Table of Contents detection

2. **AI-Powered Tutoring**
   - Emergent LLM integration (OpenAI/Claude)
   - Context-aware responses
   - Vector similarity search

3. **Interactive Learning**
   - Chapter-by-chapter navigation
   - Perplexity-style animated avatar
   - Text-to-Speech (browser-based)
   - Side-by-side layout

4. **Student Management**
   - Profile creation
   - Progress tracking
   - Learning history

---

## 🧪 Testing

```bash
# Test backend API
curl http://localhost:8001/api/health

# Test database connection
docker-compose exec postgres psql -U postgres -d virtual_tutor -c "SELECT version();"

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend
```

---

## 🛠️ Troubleshooting

### Issue: PostgreSQL connection fails
```bash
# Restart PostgreSQL
docker-compose restart postgres
# Wait 5 seconds
sleep 5
# Restart backend
docker-compose restart backend
```

### Issue: Frontend not loading
```bash
# Clear node modules and rebuild
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Issue: Upload fails
```bash
# Check backend logs
docker-compose logs backend | grep -i upload
# Ensure poppler-utils is installed in container
```

---

## 📚 API Documentation

Once running, visit: http://localhost:8001/docs for interactive API documentation.

---

## 🔐 Security Notes

1. Change default PostgreSQL password in production
2. Keep EMERGENT_LLM_KEY secure
3. Use HTTPS in production
4. Enable CORS only for trusted domains

---

## 📄 License

This is a proprietary application built for educational purposes.

---

## 💡 Support

For issues or questions, refer to the main documentation or contact support.

---

## 📌 Version

- Backend: v2.0.0
- Frontend: v2.0.0
- Database: PostgreSQL 15 with pgvector
- Last Updated: 2025-10-25
