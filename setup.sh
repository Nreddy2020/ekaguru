#!/bin/bash

echo "🚀 Setting up Virtual Tutor Application..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"

# Create environment files
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your EMERGENT_LLM_KEY"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
fi

echo "🏗️  Building containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ Setup complete!"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8001/docs"
echo ""
echo "Check status: docker-compose ps"
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"

