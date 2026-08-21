# EKAGURU V2 Staging Deployment & Production Simulation Plan

This document outlines the operational plan to promote the **EKAGURU V2** architecture from a local development environment into a production-like staging environment. The goal is to validate the entire learning ecosystem under concurrent traffic, real database behavior, and scaled background workers.

---

## 1. Staging Environment Topology

The staging setup decouples the stateless web/API servers from the stateful background worker instances to ensure lifecycle isolation:

```
                                USERS
                                  │
                                  ▼
                            Reverse Proxy
                             /           \
                            ▼             ▼
                      Next.js CDN      API Load Balancer
                                          │
                                ┌─────────┴─────────┐
                                ▼                   ▼
                              API-1               API-2
                                │                   │
                                └─────────┬─────────┘
                                          ▼
                                     PostgreSQL
                                          ▲
                                ┌─────────┴─────────┐
                                │                   │
                             Worker-1            Worker-2
                                │                   │
                                └─────────┬─────────┘
                                          │
                                     Outbox Engine
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                         Notifications          Decay/Inactivity
```

### Infrastructure Specs:
* **Stateless Web API Node**: 2x NestJS API instances behind an API Load Balancer.
* **Stateless Worker Node**: 2x independent Node.js processes running the background workers.
* **Static Assets**: Next.js Parent Dashboard pre-compiled and served via CDN.
* **Database**: PostgreSQL 15+ managed instance (e.g. AWS RDS).

---

## 2. PostgreSQL Configuration & Migrations

### Prerequisites
* Standard relational settings with isolation level set to `Read Committed` (PostgreSQL default).
* Dedicated schema user permissions:
  * Restrict schema permissions to `DML` (SELECT, INSERT, UPDATE, DELETE) for application instances.
  * Restrict `DDL` (CREATE, ALTER, DROP) permissions exclusively to the migration runner.

### Migrations Path
1. Run migrations forward using the Prisma CLI:
   `npx prisma migrate deploy`
2. Validate index coverage:
   ```sql
   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'NotificationEvent';
   ```

---

## 3. Worker Scaling & Claims Strategy

* **Scale Model**: Run multiple independent Worker processes concurrently.
* **Atomic Claim Invariant**: The concurrency prevention relies on PostgreSQL's Row-Level write blocks during the atomic update check:
  `UPDATE "NotificationEvent" SET status = 'PROCESSING', attempts = attempts + 1 WHERE id = $1 AND status IN ('PENDING', 'FAILED');`
* **Network & Sweep Timing**:
  * **Event poll interval**: 5 seconds.
  * **PROCESSING timeout threshold**: 15 minutes.
  * **Recovery sweep interval**: 5 minutes.
  * *Bounded Stuck Latency*: This timing guarantees that any event stuck in processing due to process crash will be recovered in under 20 minutes (15 min threshold + 5 min sweep interval).

---

## 4. Secrets & Credentials Management

Staging secrets must never be hardcoded or checked into repository source code. Load them dynamically into container environments:

| Secret Key | Description | Storage Strategy |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URI | Environment Variable (injected via Secret Manager) |
| `JWT_SECRET` | Auth Token Signature Key | Injected at runtime (minimum 256-bit entropy) |
| `PORT` | NestJS HTTP server port | Container Config |

---

## 5. Observability & Logging

* **Application Logs**: Standard JSON structured console logging captured by a log aggregator.
* **Alert Triggers**:
  * Log search alerts for text matching: `[OutboxWorkerService] Error in dispatchPendingEvents`.
  * Warn level alert matching: `exceeded max retries and is marked as FAILED`.
* **Database Metrics**: Monitor PostgreSQL lock contention, CPU utilization, and query plan scan times (`EXPLAIN ANALYZE`).

---

## 6. Staging Simulation & Concurrency Smoke Tests

Before staging sign-off, operations will run a real Postgres concurrency test simulating two worker processes racing for the same outbox event:

```
              NotificationEvent #101
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Worker-1           Worker-2
              │                 │
          claim event       claim event
              │                 │
            count=1           count=0
              │                 │
            PROCESS            STOP
              │
          notification
              │
           PROCESSED
```

### Acceptance Gates:
* Events claimed concurrently: **1**
* Events processed: **1**
* Notifications created in DB: **1**
* Duplicate notifications: **At most one row exists for each (eventId, deliveryType, parentId) combination.**

---

## 7. Rollback & Disaster Recovery Strategy

Do not rely on Prisma down-migrations as the primary disaster recovery mechanism.
* **Application Rollback**: Roll back the NestJS/Next.js container deployment to the previous stable build artifact.
* **Database Disaster Recovery**: In the event of schema corruption or severe transactional failure, restore the database state using automated nightly backups, RDS snapshots, or Point-in-Time Recovery (PITR).

---

## 8. Go/No-Go Decision Matrix

Staging promotion will yield a final **Go/No-Go** verdict based on these quantitative metrics:

| Gate | Target SLA / Condition | Status |
|---|---|---|
| Jest suites | 🟢 100% passing tests (217/217) | 🟢 |
| Prisma migration | DDL executed successfully | ⬜ |
| Real PostgreSQL E2E | Pass suite against live DB | ⬜ |
| Two-worker concurrency | Zero duplicate claims on same event | ⬜ |
| Duplicate notification count | ⬜ At most one Notification exists for each (eventId, deliveryType, parentId) | ⬜ |
| Stuck-event recovery | Recovered back to PENDING within 20m | ⬜ |
| Retry/max-attempt behavior | FAILED status after 3 attempts | ⬜ |
| Worker graceful shutdown | Zero lost or duplicated events during rolling deployment | ⬜ |
| JWT expiry | Verifiably rejected after expiry | ⬜ |
| JWT rotation | Token signature verification passes | ⬜ |
| Parent cross-tenant isolation | 403 Forbidden for unauthorized parents | ⬜ |
| Child complete learning journey | Successful simulation from start to finish | ⬜ |
| Parent notification journey | Events delivered successfully | ⬜ |
| Notification pagination | Data array with meta structure | ⬜ |
| Analytics latency | p50 < 150 ms, p95 < 300 ms, p99 < 500 ms | ⬜ |
| DB lock contention | Zero deadlock rollbacks reported | ⬜ |
| Backup/snapshot verification | Successful PITR restoration trial | ⬜ |
| Application rollback | Success redeployment within 5 minutes | ⬜ |
| Secrets absent from repository | Clean git audit check | ⬜ |
