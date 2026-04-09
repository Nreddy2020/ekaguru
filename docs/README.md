# Ekaguru: Virtual Cognitive Tutor Platform

**The Digital Guru that teaches children how to think, not what to memorize.**

[![Status](https://img.shields.io/badge/status-ready--for--implementation-green)]()
[![Architecture](https://img.shields.io/badge/architecture-microservices-blue)]()
[![Platform](https://img.shields.io/badge/platform-kubernetes-326CE5)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()

---

## 🎯 What is Ekaguru?

Ekaguru is a **cognitive-first AI tutoring platform** that mimics how great teachers actually teach. Unlike traditional ed-tech that focuses on marks and memorization, Ekaguru:

- ✅ Detects **misconceptions**, not just wrong answers
- ✅ Teaches from **first principles** (Experience → Intuition → Symbol)
- ✅ Detects and responds to **fear signals**
- ✅ Confirms **true understanding** through knowledge transfer
- ✅ Provides **explainable AI** for parent trust
- ✅ Uses **spaced repetition** for long-term memory

**Target**: Children (Grades 4-7), Parents, Schools  
**Market**: India (₹50,000 Cr+ opportunity)  
**Timeline**: 90 days to MVP, 180 days to enterprise-ready

---

## 🏗️ Architecture

### 8 Microservices (Cognitive Loop)

```
Student Input → Diagnosis → Memory → Orchestrator → [Teaching/Struggle/Reflection/Transfer] → Mastery
                                                              ↓
                                                      Parent Dashboard
```

1. **Memory Service** (Port 8000) - PostgreSQL + MongoDB hybrid, cognitive state authority
2. **Orchestrator** (Port 8001) - FSM-based decision engine
3. **Diagnosis Agent** (Port 8002) - Misconception detection, fear signals
4. **Teaching Agent** (Port 8003) - Concept reconstruction from first principles
5. **Struggle Agent** (Port 8004) - Adaptive difficulty, productive struggle
6. **Reflection Agent** (Port 8005) - Self-explanation, spaced repetition
7. **Transfer Agent** (Port 8007) - Teach-back, near/far transfer testing
8. **Parent Dashboard** (Port 8006) - Transparent analytics, explainable AI

### Technology Stack

- **Backend**: Python 3.11, FastAPI
- **Databases**: PostgreSQL (truth), MongoDB (analytics)
- **Container**: Docker, Kubernetes
- **CI/CD**: GitHub Actions, ArgoCD
- **Observability**: Prometheus, Grafana, Loki
- **Frontend**: React, TypeScript

---

## 📚 Documentation Hub

### 🚀 Start Here
- **[Quick Start Guide](docs/quick_start.md)** - Begin implementation today
- **[Implementation Roadmap](docs/implementation_roadmap.md)** - 24 tasks, 6 phases
- **[Task Tracker](task.md)** - Track your progress

### 📋 Planning & Execution
- **[90-Day Sprint Plan](docs/90_day_sprint_plan.md)** - Day-by-day schedule
- **[90-Day MVP Build](docs/90_day_mvp_build_checklist.md)** - Week-by-week checklist
- **[90-Day Launch Checklist](docs/90_day_launch_checklist.md)** - User acquisition

### 🏛️ Architecture & Design
- **[Runtime Architecture](docs/runtime_architecture.md)** - Kubernetes + OpenShift
- **[Database Design](docs/database_design.md)** - PostgreSQL + MongoDB hybrid
- **[Production Operations](docs/production_operations.md)** - Security, cost, compliance
- **[CI/CD Pipeline](docs/cicd_pipeline.md)** - DevOps toolchain
- **[Avatar & Voice Design](docs/avatar_voice_design.md)** - Emotional layer

### 💼 Business & Product
- **[PRD](docs/PRD.md)** - Product requirements
- **[Commercialization Strategy](docs/commercialization_strategy.md)** - Go-to-market
- **[Investor Pitch Deck](docs/investor_pitch_deck.md)** - Fundraising narrative

---

## 🚀 Quick Start

### Prerequisites
```bash
# Install (Windows)
winget install Docker.DockerDesktop
winget install Kubernetes.kubectl
winget install Python.Python.3.11

# Install (macOS)
brew install docker kubectl python@3.11

# Verify
docker --version
kubectl version --client
python3.11 --version
```

### Local Development
```bash
# 1. Create Kubernetes cluster
kind create cluster --name ekaguru-dev

# 2. Deploy databases
kubectl apply -f kubernetes/databases.yaml

# 3. Start Memory Service
cd memory_service
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Start other services (ports 8001-8007)
# See docs/quick_start.md for details
```

### Run Demo
```bash
# Start all services, then:
cd demos
python demo_fractions.py
```

---

## 📊 Project Status

### ✅ Completed
- [x] Complete architecture design
- [x] 13 comprehensive documents
- [x] 8 microservices (basic implementation)
- [x] Database schema
- [x] Kubernetes deployments
- [x] Demo & verification scripts

### 🚧 In Progress
- [ ] Memory Service production updates
- [ ] CI/CD pipeline setup
- [ ] Frontend development

### 📅 Upcoming
- [ ] Security hardening
- [ ] Observability stack
- [ ] Pilot launch (50-100 families)

**See [task.md](task.md) for detailed progress tracking.**

---

## 🎯 Success Metrics

### Learning KPIs
- Fear index reduction: >30%
- Concept mastery rate: >70%
- Transfer success rate: >60%

### Business KPIs
- 7-day retention: >60%
- 30-day retention: >40%
- NPS: >40
- MRR: ₹5 lakhs (Month 6)

### Technical KPIs
- API latency (p95): <100ms
- Uptime: >99.5%
- Test coverage: >80%
- Security: 0 critical/high vulnerabilities

---

## 🏆 What Makes This World-Class

### Technical Excellence
- ✅ Hybrid database (PostgreSQL + MongoDB)
- ✅ Transactional outbox pattern
- ✅ Optimistic locking for concurrency
- ✅ GitOps with ArgoCD
- ✅ STRIDE threat model
- ✅ Production-ready from Day 1

### Pedagogical Innovation
- ✅ Cognitive-first (not marks-first)
- ✅ Misconception detection
- ✅ Fear-aware learning
- ✅ Knowledge transfer testing
- ✅ Spaced repetition built-in

### Business Differentiation
- ✅ Trust > Engagement
- ✅ Explainable AI
- ✅ Parent transparency
- ✅ Child safety first
- ✅ No dark patterns

---

## 📁 Repository Structure

```
Ekaguru/
├── docs/                          # All documentation
│   ├── quick_start.md            # Start here
│   ├── implementation_roadmap.md # Master plan
│   ├── PRD.md                    # Product requirements
│   ├── runtime_architecture.md   # Technical architecture
│   ├── database_design.md        # Database schema
│   ├── production_operations.md  # Operations guide
│   ├── cicd_pipeline.md          # CI/CD guide
│   └── ...
├── kubernetes/                    # K8s manifests
│   └── databases.yaml            # PostgreSQL + MongoDB
├── memory_service/               # Port 8000
├── orchestrator_service/         # Port 8001
├── diagnosis_agent/              # Port 8002
├── teaching_agent/               # Port 8003
├── struggle_agent/               # Port 8004
├── reflection_agent/             # Port 8005
├── parent_dashboard/             # Port 8006
├── transfer_agent/               # Port 8007
├── demos/                        # Demo scripts
└── README.md                     # This file
```

---

## 🛠️ Development Workflow

### 1. Feature Development
```bash
git checkout develop
git checkout -b feature/your-feature
# Make changes
git commit -m "feat: your feature"
git push origin feature/your-feature
# Create PR to develop
```

### 2. Testing
```bash
# Unit tests
pytest --cov=. --cov-report=html

# Integration tests
pytest tests/integration/

# Load tests
locust -f locustfile.py
```

### 3. Deployment
```bash
# CI runs automatically on push
# CD (ArgoCD) syncs automatically
# Manual sync:
argocd app sync ekaguru-memory-service
```

---

## 🤝 Contributing

This is a proprietary project. For team members:

1. Follow the implementation roadmap
2. Update task.md as you complete tasks
3. Write tests (>80% coverage required)
4. Follow coding standards (black, flake8)
5. Create PR for all changes
6. Get approval before merging to develop

---

## 📞 Support & Resources

### Documentation
- All docs in `docs/` folder
- Start with `docs/quick_start.md`
- Reference `docs/implementation_roadmap.md` daily

### Team Communication
- Daily standups: 9:00 AM
- Weekly reviews: Friday 4:00 PM
- Slack: #ekaguru-dev

### Escalation
- P0 (Data loss): Immediate → Backend Lead
- P1 (Service down): <15 min → Platform Engineer
- P2 (Performance): <1 day → Team Lead

---

## 🎓 Vision

**"Every child deserves a Guru who understands how they learn."**

Ekaguru is not just another ed-tech app. It's a **learning infrastructure** that:
- Respects how children actually learn
- Builds trust with parents through transparency
- Scales to millions while maintaining quality
- Proves that AI can be ethical, safe, and effective

---

## 📜 License

Proprietary. All rights reserved.

---

## 🚀 Next Steps

1. **Read**: `docs/quick_start.md`
2. **Install**: Prerequisites from `docs/implementation_roadmap.md`
3. **Start**: Task 1 - Setup Development Environment
4. **Track**: Update `task.md` as you progress
5. **Build**: The future of education!

---

**Built with ❤️ for children who deserve better learning experiences.**

**Last Updated**: January 2026
