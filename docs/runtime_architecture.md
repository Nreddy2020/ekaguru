# Ekaguru: Runtime Architecture Decision
## Kubernetes vs Alternatives - Production-Grade Strategy

**Last Updated**: January 2026  
**Architect**: Production-Ready Design  
**Status**: Final Decision

---

## 1️⃣ First Principle: What This System REALLY Needs

### Unique Runtime Requirements

| Requirement | Why | Impact |
|-------------|-----|--------|
| **Stateful memory** | Cognitive memory cannot be ephemeral | Need persistent state |
| **Deterministic control** | Orchestrator must be predictable | No random cold starts |
| **Many small services** | Multi-agent architecture (8 services) | Need orchestration |
| **Horizontal scaling** | Millions of students eventually | Auto-scaling required |
| **Isolation** | Child safety & blast-radius control | Service boundaries |
| **Observability** | Explainable AI & audits | Logging, tracing, metrics |
| **Vendor neutrality** | Education + government use | Cloud-agnostic |

**These requirements eliminate many runtimes.**

---

## 2️⃣ Runtime Options - Honest Comparison

### ❌ Pure Serverless (Lambda / Cloud Functions)

**Why it fails**:
- Cold starts hurt UX (2-5 second delays)
- Poor state handling (need external storage for everything)
- Hard to debug learning flows (distributed tracing complex)
- Bad for long sessions (15-minute limits)
- Vendor lock-in (AWS/GCP specific)

**Verdict**: ❌ **Rejected for core learning engine**

---

### ⚠️ Monolith VM / Traditional App Server

**Why it fails**:
- No isolation between agents (one bug crashes all)
- Scaling is painful (vertical only)
- Hard to evolve (deploy all or nothing)
- Risky for child safety (no blast radius control)

**Verdict**: ❌ **Rejected for long-term**

---

### ❌ LLM Platforms Only (OpenAI Assistants, etc.)

**Why it fails**:
- No deterministic orchestration (LLM decides flow)
- No deep memory control (platform-owned state)
- No explainability (black box)
- Compliance issues (data residency, COPPA)

**Verdict**: ❌ **Rejected completely**

---

### ✅ Kubernetes (Primary Runtime)

**Why Kubernetes fits PERFECTLY**:
- ✅ Designed for microservices (8 agents = 8 services)
- ✅ Strong isolation (pod security, network policies)
- ✅ Predictable behavior (declarative config)
- ✅ Scales horizontally (auto-scaling built-in)
- ✅ Excellent observability (Prometheus, Grafana)
- ✅ Cloud-agnostic (runs anywhere)
- ✅ Enterprise & government friendly (compliance ready)

**Verdict**: ✅ **BEST PRIMARY RUNTIME**

---

## 3️⃣ Database Architecture: Hybrid Strategy (PostgreSQL + MongoDB)

### Why Hybrid? (World-Class Decision)

**Your platform has 3 fundamentally different data types**:

| Data Type | Example | Nature | Best DB |
|-----------|---------|--------|---------|
| **Cognitive state** | mastery_score, confidence | Strongly consistent | PostgreSQL |
| **Learning events** | attempts, hints, struggle | Append-only / analytics | MongoDB |
| **Content & configs** | teaching plans, prompts | Flexible schema | MongoDB |

**One database is NOT optimal for all three.**

---

### ✅ Where PostgreSQL is MANDATORY

**Cognitive Memory (Source of Truth)**:
```sql
-- Student cognitive state
student_concept_state (
  student_id,
  concept_id,
  state,              -- unknown, partial, understood, mastered
  mastery_score,      -- 0-100
  confidence_level,   -- low, medium, high
  next_review,        -- spaced repetition
  updated_at
)
```

**Why PostgreSQL**:
- ✅ Strict relational guarantees
- ✅ ACID transactions (critical for cognitive state)
- ✅ Enforce invariants (mastery_score 0-100)
- ✅ Debugging cognition bugs easier
- ✅ Audits & explainability (SQL queries)
- ✅ This is the "brain" of the child - needs SQL-level guarantees

---

### ✅ Where MongoDB FITS PERFECTLY

**1. Learning Event Store**:
```json
{
  "student_id": "uuid",
  "event_type": "struggle_attempt",
  "agent": "struggle-agent",
  "payload": { "hint_level": 2, "success": false },
  "timestamp": "2026-01-08T10:00:00Z"
}
```

**Why MongoDB**:
- High write throughput
- Schema evolves easily
- JSON-native (agent outputs)
- Time-series friendly
- Great for analytics & dashboards

**2. Teaching Plans & Agent Outputs**:
```json
{
  "concept_id": "fractions",
  "teaching_plan": [
    {"mode": "experience", "content": "..."},
    {"mode": "intuition", "content": "..."}
  ],
  "version": "v2",
  "created_at": "..."
}
```

**Why MongoDB**:
- Flexible documents
- Versioning
- Easy iteration during MVP
- No rigid migrations

**3. Parent Analytics & Reports**:
- Aggregated views
- Trends
- Weekly summaries

---

### 🏆 World-Class Solution: Hybrid Architecture

```
┌───────────────────────────────┐
│ PostgreSQL (Authoritative)    │
│                               │
│ - Students                    │
│ - Concepts                    │
│ - Mastery state               │
│ - Confidence / fear           │
│ - Review schedules            │
└───────────────▲───────────────┘
                │
                │ (events summarized)
                ▼
┌───────────────────────────────┐
│ MongoDB (Flexible / Analytics)│
│                               │
│ - Learning events             │
│ - Agent outputs               │
│ - Teaching plans              │
│ - Parent reports              │
└───────────────────────────────┘
```

**Simple Rule**:
- **PostgreSQL** = Truth (cognitive state)
- **MongoDB** = History & Insight (events, analytics)

---

### 🔐 Child Safety & Data Integrity

| Concern | Hybrid Advantage |
|---------|------------------|
| Auditability | SQL memory state (queryable) |
| Explainability | Deterministic DB (no schema drift) |
| Analytics | MongoDB aggregation (fast) |
| Schema evolution | MongoDB flexibility (agents iterate) |
| Safety | Strong boundaries (separate concerns) |

**This matters for**: Parents, Schools, Governments, Investors

---

## 4️⃣ Kubernetes → OpenShift Migration Path

### ✅ Your Decision is 100% Correct

**Why Kubernetes First**:
- Faster iteration
- No OpenShift learning overhead
- Easier local + cloud dev
- Full control of YAML & Helm
- Same primitives OpenShift uses underneath

**Why OpenShift Later**:
- Enterprise security (SCCs, RBAC)
- Compliance (FedRAMP, HIPAA)
- Government / school adoption
- Operators & lifecycle management

**Architectural Rule**:
> If it runs cleanly on Kubernetes with good practices, it will run on OpenShift with minimal changes.

**Your plan is exactly what senior platform teams do.**

---

### OpenShift Readiness Checklist

**What makes your app OpenShift-ready**:
- [ ] Uses Deployments (not DaemonSets)
- [ ] No privileged containers
- [ ] Runs as non-root user
- [ ] Uses ConfigMaps/Secrets (not env vars only)
- [ ] Health checks (liveness, readiness)
- [ ] Resource limits defined
- [ ] Network policies defined

**Database on OpenShift**:
- PostgreSQL Operator (Crunchy Data)
- MongoDB Operator (MongoDB Enterprise)
- Both fully supported

---

## 5️⃣ Correct Architecture: Hybrid Runtime Model

**A world-class architect does NOT choose one runtime.**  
**You use the right runtime for the right layer.**

### 🏗️ Recommended Runtime Architecture (FINAL)

```
┌──────────────────────────────┐
│   Client (Web / Mobile)      │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│  API Gateway / Auth          │  ← Kubernetes Ingress
└──────────────┬───────────────┘
               ↓
┌────────────────────────────────────────────┐
│          Kubernetes Cluster                 │
│                                            │
│  ┌────────────┐  ┌────────────┐            │
│  │Orchestrator│  │  Agents    │  ← Stateless Deployments
│  └────────────┘  └────────────┘            │
│                                            │
│  ┌────────────┐  ┌────────────┐            │
│  │ Memory Svc │  │ Dashboard  │  ← Stateful Services
│  └────────────┘  └────────────┘            │
│                                            │
└────────────────────────────────────────────┘
               ↓
┌──────────────────────────────┐
│ Managed Databases            │
│ - PostgreSQL (RDS/CloudSQL)  │
│ - Vector Store (Pinecone)    │
└──────────────────────────────┘
```

---

## 4️⃣ What MUST Run on Kubernetes (Non-Negotiable)

### Core Cognitive Engine
- **Tutor Orchestrator** (stateless)
- **Diagnosis Agent** (stateless)
- **Teaching Agent** (stateless)
- **Struggle Agent** (stateless)
- **Reflection Agent** (stateless)
- **Transfer Agent** (stateless)
- **Memory Service** (stateful - connects to DB)
- **Parent Dashboard** (stateless)

**Why?**
- Independent scaling
- Isolation (one agent failure doesn't crash others)
- Rolling updates (zero downtime)
- Fault tolerance (auto-restart)

---

## 5️⃣ What SHOULD NOT Start on Kubernetes (Initially)

### Early MVP Phase (First 60-90 days)

**Can run as simple containers or PaaS**:
- Admin tools
- Reporting jobs
- Analytics pipelines

**But**: The learning engine should be **Kubernetes-ready from Day 1**

**Why?**
- Easier to migrate later
- Consistent deployment model
- Practice for production

---

## 6️⃣ Kubernetes Design Pattern (Important)

### Pattern: Stateless Agents + Hybrid Stateful Storage

| Component | Kubernetes Pattern | Replicas | Scaling |
|-----------|-------------------|----------|---------|
| **Agents** | Stateless Deployment | 2-5 | HPA (CPU/Memory) |
| **Orchestrator** | Stateless Deployment | 3 | HPA |
| **Memory Service** | Deployment + PostgreSQL | 2-3 | HPA |
| **PostgreSQL** | Managed (RDS/CloudSQL) or StatefulSet | N/A | Managed/Vertical |
| **MongoDB** | Managed (Atlas) or StatefulSet | N/A | Managed/Sharding |
| **Vector Store** | Managed (Pinecone) or pgvector | N/A | Managed |

**This gives**:
- Easy scaling (just add replicas for agents)
- Safe restarts (stateless pods)
- Predictable behavior (declarative config)
- Data separation (PostgreSQL for truth, MongoDB for analytics)
- Service isolation (DB access only via Memory Service)

---

## 7️⃣ Recommended Kubernetes Stack (Best-in-Class)

### Runtime
- **Production**: EKS (AWS) / GKE (Google) / AKS (Azure)
- **Local Dev**: Docker Desktop + kind / minikube
- **Alternative**: OpenShift (for enterprise/government)

### Networking
- **Ingress Controller**: NGINX Ingress
- **Service Mesh** (later): Istio / Linkerd
- **mTLS** (Phase 2): Cert-manager
- **Rate Limiting**: Ingress annotations

### Observability
- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack / Loki
- **Tracing**: Jaeger / Tempo
- **Alerts**: Alertmanager

### Security
- **Secrets**: Kubernetes Secrets + Sealed Secrets
- **Network Policies**: Calico / Cilium
- **Pod Security**: Pod Security Standards (restricted)
- **RBAC**: Role-based access control

---

## 8️⃣ Why OpenShift Is Especially Good (Optional)

**If you plan to sell to**:
- Schools
- Governments
- Enterprises

**Then OpenShift is excellent because**:
- ✅ Built-in security (SELinux, RBAC)
- ✅ Compliance readiness (FedRAMP, HIPAA)
- ✅ RBAC maturity (fine-grained permissions)
- ✅ Operator ecosystem (easy DB management)

**But plain Kubernetes is perfectly fine for MVP.**

---

## 9️⃣ Scaling Model (How This Grows)

### Phase 1: MVP (0-1,000 users)
- **Cluster**: 1 cluster (3 nodes)
- **Replicas**: 1-2 per agent
- **Database**: Shared PostgreSQL (managed)
- **Cost**: ~$200-500/month

### Phase 2: Growth (1,000-10,000 users)
- **Cluster**: 1 cluster (5-10 nodes)
- **Replicas**: Autoscaling (2-5 per agent)
- **Database**: Read replicas for memory service
- **Queue**: Redis for async tasks
- **Cost**: ~$1,000-2,000/month

### Phase 3: Massive Scale (10,000-1M users)
- **Clusters**: Separate clusters:
  - Learning engine
  - Analytics
  - Parent dashboard
- **Database**: Sharded memory (by student ID)
- **Regional**: Multi-region deployments
- **Cost**: ~$10,000-50,000/month

---

## 🔐 Child Safety & Kubernetes (Often Missed)

**Kubernetes helps safety by**:
- **Isolating agent failures** (one agent crash doesn't affect others)
- **Limiting blast radius** (network policies)
- **Enforcing resource limits** (prevent memory leaks)
- **Allowing audits** (all actions logged)

**This is critical for child-focused systems.**

---

## 🔟 Final Verdict (Architect's Decision)

### ✅ BEST RUNTIME STRATEGY

| Phase | Runtime | Reason |
|-------|---------|--------|
| **MVP** | Docker + Kubernetes-ready | Easy local dev, production-ready |
| **Pilot** | Kubernetes (single cluster) | Real production environment |
| **Scale** | Kubernetes (multi-cluster) | Regional, isolated workloads |

### ❌ DO NOT
- ❌ Start serverless-only (cold starts, vendor lock-in)
- ❌ Tie logic to one cloud (use Kubernetes abstractions)
- ❌ Let LLMs control flow (orchestrator must be deterministic)

---

## 📋 Implementation Roadmap

### Week 1-2: Local Development
- [ ] Docker Compose for local dev
- [ ] All services containerized
- [ ] Health checks implemented

### Week 3-4: Kubernetes Preparation
- [ ] Kubernetes manifests (Deployments, Services)
- [ ] ConfigMaps for configuration
- [ ] Secrets for sensitive data
- [ ] Ingress for routing

### Week 5-6: Kubernetes Deployment
- [ ] Deploy to kind/minikube (local)
- [ ] Deploy to EKS/GKE (staging)
- [ ] Set up CI/CD (GitHub Actions → K8s)

### Week 7-8: Observability
- [ ] Prometheus + Grafana
- [ ] Logging (ELK/Loki)
- [ ] Distributed tracing (Jaeger)

### Week 9-10: Production Readiness
- [ ] Auto-scaling (HPA)
- [ ] Network policies
- [ ] Pod security standards
- [ ] Backup & disaster recovery

---

## 📊 Cost Estimation

### MVP (1,000 users)
- **Kubernetes Cluster**: $150/month (3 nodes)
- **Database**: $50/month (managed PostgreSQL)
- **Total**: ~$200/month

### Growth (10,000 users)
- **Kubernetes Cluster**: $500/month (10 nodes)
- **Database**: $300/month (read replicas)
- **Monitoring**: $100/month
- **Total**: ~$900/month

### Scale (100,000 users)
- **Kubernetes Clusters**: $5,000/month (multi-cluster)
- **Databases**: $2,000/month (sharded)
- **Monitoring**: $500/month
- **Total**: ~$7,500/month

---

## 🎯 Key Takeaways

1. **Kubernetes is the right choice** for this multi-agent architecture
2. **Start simple** (Docker Compose → kind → EKS/GKE)
3. **Use managed databases** (don't run PostgreSQL in K8s for MVP)
4. **Stateless agents** make scaling easy
5. **Observability is critical** for explainable AI

**This is production-grade architecture, not over-engineering.**

---

## 📚 References

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [12-Factor App](https://12factor.net/)
- [Microservices Patterns](https://microservices.io/patterns/index.html)
- [CNCF Landscape](https://landscape.cncf.io/)

---

**Next Step**: Start with Docker Compose, make it Kubernetes-ready from Day 1.
