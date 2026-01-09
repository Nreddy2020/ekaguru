# Ekaguru: Production Operations Guide
## CI/CD, Security, Cost Optimization & Readiness

**Last Updated**: January 2026  
**Status**: Production-Ready  
**Audience**: DevOps, Security, Platform Teams

---

## PART 1: CI/CD + GitOps (ArgoCD)

### 1.1 CI/CD Philosophy

**Rules**:
- Humans write code, machines deploy code
- Git decides truth
- No manual `kubectl` in prod
- No hotfixes
- Every deploy is traceable
- Rollback is one commit

### 1.2 Repository Strategy
```
repos/
├── cognitive-platform-code/      # Application code
│   ├── services/
│   ├── Dockerfiles/
│   └── tests/
│
├── cognitive-platform-helm/      # Helm charts
│   ├── charts/
│   └── values/
│
└── cognitive-platform-env/       # GitOps source of truth
    ├── dev/
    ├── staging/
    └── prod/
```

### 1.3 CI Pipeline (GitHub Actions / Tekton)

**Steps** (Mandatory):
1. Lint & static analysis
2. Unit tests
3. Security scan (SAST)
4. Build Docker image
5. Image vulnerability scan
6. Push image to registry
7. Update Helm image tag

**❌ No deploy happens in CI**

### 1.4 CD via ArgoCD (GitOps)

```
Git Commit
   ↓
ArgoCD detects change
   ↓
Diff → Sync → Apply
   ↓
Health checks
   ↓
Rollback if unhealthy
```

**Why ArgoCD**:
- Declarative
- Auditable
- OpenShift-native
- Zero-trust friendly

### 1.5 Promotion Flow

| Stage | Trigger |
|-------|---------|
| Dev | Auto |
| Staging | Manual approval |
| Prod | Dual approval |

---

## PART 2: Threat Model & Security (STRIDE)

### 2.1 Security Philosophy

**Assume**:
- Attackers exist
- Mistakes will happen
- Child data is the highest-value target

**Core Laws**:
- Zero Trust inside the cluster
- No direct DB access except Memory Service
- No LLM can mutate state
- Everything is logged, nothing is trusted
- Blast radius must always be small

### 2.2 STRIDE Analysis

#### S — Spoofing Identity
**Threats**: Fake agent, compromised service account  
**Mitigations**:
- mTLS or JWT service tokens
- Short-lived tokens (5-15 min)
- Per-service Kubernetes ServiceAccount

#### T — Tampering with Data
**Threats**: Agent overwrites mastery, replay attacks  
**Mitigations**:
- Memory Service = single writer
- Optimistic locking + invariants
- Idempotency keys

#### R — Repudiation
**Threats**: No audit trail  
**Mitigations**:
- `orchestrator_decisions` table
- Immutable `learning_events`
- Trace IDs end-to-end

#### I — Information Disclosure (MOST CRITICAL)
**Threats**: Child data leakage, PII in logs  
**Mitigations**:
- Namespace isolation
- NetworkPolicies (default deny)
- No PII in logs
- Encrypted backups

#### D — Denial of Service
**Threats**: Agent overload, LLM cost explosion  
**Mitigations**:
- HPA with limits
- Rate limiting at API Gateway
- Circuit breakers for LLM calls

#### E — Elevation of Privilege
**Threats**: Agent accessing DB, compromised Pod  
**Mitigations**:
- Pod Security Standards (restricted)
- No privileged containers
- RBAC: least privilege

### 2.3 Kubernetes Security Controls

**Cluster-Level**:
- Pod Security Standards: restricted
- Admission controllers
- Image scanning
- No `latest` tags

**Network**:
- Default deny NetworkPolicy
- Explicit allow (Orchestrator → Agents → Memory)
- DB namespace isolated

**Secrets**:
- No secrets in env files
- Rotate credentials quarterly
- No developer access to prod secrets

### 2.4 Child-Specific Safety

| Risk | Control |
|------|---------|
| Over-usage | Session timeouts |
| Dependency | Forced breaks |
| Unsafe content | RAG-only answers |
| Manipulation | No emotional coercion |

---

## PART 3: Cost Optimization & Autoscaling

### 3.1 Cost Philosophy

**Optimize for learning value, not compute vanity.**

**Cost Laws**:
- Scale agents, not databases
- CPU first, GPU last
- LLMs are the biggest cost — control them
- Idle time must be near zero

### 3.2 Cost Drivers

| Component | Cost Risk |
|-----------|-----------|
| LLM calls | 🔴 Very High |
| Teaching Agent CPU | 🟡 Medium |
| Analytics storage | 🟡 Medium |
| Databases | 🟢 Predictable |
| Kubernetes overhead | 🟢 Low |

### 3.3 Autoscaling Strategy

**Agents (Stateless)**:
- HPA based on CPU + request rate
- Scale aggressively, scale down fast
- `minReplicas: 1, maxReplicas: 10`

**Orchestrator**:
- Conservative scaling
- Stability > throughput
- `minReplicas: 2, maxReplicas: 5`

**Memory Service**:
- Low replica count
- Strong CPU allocation
- Never scale to zero

**Databases**:
- No autoscaling
- Vertical scaling only
- Predictable cost

### 3.4 LLM Cost Control (CRITICAL)

**Rules**:
- LLMs only generate language
- No reasoning delegation
- No repeated prompts

**Techniques**:
- Cache explanations per concept
- Cache analogies
- Pre-generate teaching plans
- Token budgets per session
- Hard daily caps

**💡 Most learning happens without LLM calls**

### 3.5 Storage Optimization

**MongoDB**:
- TTL indexes for raw events
- Aggregate & delete old data
- Keep summaries, drop noise

**PostgreSQL**:
- Compact schema
- No JSON abuse
- Index only what's needed

### 3.6 Monthly Cost Profile

| Stage | Cost |
|-------|------|
| MVP (100 users) | $200-500/month |
| Pilot (1k users) | $900-2,000/month |
| Growth (10k+) | Mostly LLM |
| Scale (100k+) | Optimize LLM + DB |

---

## PART 4: Production Readiness Checklist

**This is a GO / NO-GO gate.**

### 4.1 Architecture
- [ ] Single writer enforced
- [ ] NetworkPolicies default-deny
- [ ] DB access isolated
- [ ] No agent → DB access
- [ ] Helm values environment-specific

### 4.2 Security
- [ ] STRIDE threats mitigated
- [ ] Secrets rotated
- [ ] Image scanning enabled
- [ ] No debug endpoints
- [ ] Pod Security = restricted

### 4.3 Data Protection
- [ ] PITR enabled (Postgres)
- [ ] Mongo backups verified
- [ ] Restore drill completed
- [ ] Data deletion tested

### 4.4 Reliability
- [ ] HPA tested
- [ ] Chaos test (pod kill)
- [ ] DB restart tested
- [ ] Rate limiting active

### 4.5 Child Safety (MANDATORY)
- [ ] Session time limits
- [ ] Break enforcement
- [ ] No emotional manipulation
- [ ] No addictive loops
- [ ] Parent controls verified

### 4.6 Observability
- [ ] Logs centralized
- [ ] Metrics visible
- [ ] Alerts configured
- [ ] Cost alerts active

**🚨 If any box is unchecked → NO LAUNCH**

---

## PART 5: Operational Playbook

### 5.1 Team Roles (Lean & Realistic)

| Role | Responsibility |
|------|----------------|
| Founder | Pedagogy + vision |
| Backend Lead | Memory + Orchestrator |
| Platform Eng | Kubernetes + CI/CD |
| Frontend | Child & Parent UX |
| Security (part-time) | Audits & reviews |

### 5.2 Weekly Operating Rhythm

**Monday**:
- Learning outcomes review
- Fear/confidence metrics

**Wednesday**:
- Infra & cost review
- LLM usage audit

**Friday**:
- Parent feedback
- Ethics & safety review

### 5.3 Decision Rules (Founder Must Enforce)

- ❌ No feature without learning value
- ❌ No AI magic demos
- ❌ No dark patterns
- ✅ Explainability over accuracy
- ✅ Safety over growth

### 5.4 Scaling Rules

| Signal | Action |
|--------|--------|
| LLM cost ↑ | Cache / redesign |
| DB load ↑ | Read replicas |
| Parent trust ↓ | Pause rollout |
| Learning fear ↑ | Fix pedagogy |

### 5.5 Long-Term Moat Protection

- Pedagogy > prompts
- Memory correctness > speed
- Trust > engagement
- Depth > breadth

---

## PART 6: Incident Response

### 6.1 Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Child data loss | Immediate |
| P1 | Service down | < 15 min |
| P2 | Degraded performance | < 1 hour |
| P3 | Minor bug | < 1 day |

### 6.2 Runbooks

**PostgreSQL Failure**:
1. Stop Memory Service
2. Restore base backup
3. Replay WAL to timestamp
4. Start DB
5. Start Memory Service
6. Verify cognitive state

**MongoDB Failure**:
1. Restore last snapshot
2. Resume analytics
3. No cognitive impact

**Memory Service Crash**:
1. Check logs
2. Restart pod
3. Verify DB connections
4. Resume traffic

---

## PART 7: Compliance & Audits

### 7.1 COPPA Compliance
- [ ] Parental consent required
- [ ] No data collection beyond learning
- [ ] Data deletion on request
- [ ] No third-party sharing

### 7.2 GDPR Compliance
- [ ] Right to access
- [ ] Right to deletion
- [ ] Data portability
- [ ] Breach notification (72 hours)

### 7.3 School/Government Readiness
- [ ] Data residency controls
- [ ] Audit logs retained
- [ ] Explainable AI
- [ ] No vendor lock-in

---

## 🏁 FINAL VERDICT

You now have:
- ✔ Full system architecture
- ✔ Secure Kubernetes foundation
- ✔ Safe data model
- ✔ Production-grade CI/CD
- ✔ Child-first threat model
- ✔ Cost-controlled scaling
- ✔ Enterprise & OpenShift readiness

**This is not an ed-tech app. This is a learning infrastructure.**

---

## 📚 References

- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [STRIDE Threat Modeling](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- [GitOps with ArgoCD](https://argo-cd.readthedocs.io/)
- [Cost Optimization on Kubernetes](https://www.cncf.io/blog/2021/06/29/finops-for-kubernetes/)
