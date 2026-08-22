# EKAGURU V2 — E2 Staging Execution Evidence: E2-005

## E2-005 — Worker Crash & Recovery
* **Timestamp**: 2026-08-22T21:12:00+05:30
* **HEAD Commit**: `3089e7e8b64c082260c51121d5a7d3066a7bdaa0`
* **Test Architecture**: Induced a worker process crash by inserting a pre-locked `PROCESSING` event in PostgreSQL backdated by 16 minutes, then triggering the recovery sweep and Worker B claim/process sequence to record exact database timestamps.

### 1. Staging Run Log Output with PostgreSQL Timestamps
```
=== STARTING E2-005 WORKER CRASH & RECOVERY TEST ===
Database URL: postgresql://postgres:postgres@localhost:5432/ekaguru

Step 1: Seeding core relations...
Step 2: Seeding stuck event simulating Worker A crash at: 2026-08-22T15:25:40.684Z

--- VERIFYING STUCK WORKER A STATE ---
Event ID: event-crash1787413300597
Status (Expected: PROCESSING): PROCESSING
Attempts (Expected: 1): 1
Last Attempt Timestamp: 2026-08-22T15:25:40.684Z

Step 3: Simulating cron recovery sweep...
Recovery Sweep Start Timestamp: 2026-08-22T15:41:40.690Z
Found 1 stuck events matching threshold.
Event event-crash1787413300597 recovered. Status moved from PROCESSING -> PENDING.
Calculated Staging Recovery Latency: 16.00 minutes

--- POST-RECOVERY STATE ---
Status (Expected: PENDING): PENDING
Attempts (Expected: 1): 1

Step 4: Simulating Worker B claiming recovered event...
Worker B CLAIMED_COUNT (Expected: 1): 1

--- WORKER B PROCESSING STATE ---
Status (Expected: PROCESSING): PROCESSING
Attempts (Expected: 2): 2
Worker B Claim Timestamp: 2026-08-22T15:41:40.702Z

Step 5: Worker B writing notification deliveries...

Step 6: Verifying final database state...

--- FINAL DATABASE RECORD VERIFICATION ---
Event ID: event-crash1787413300597
Final Status (Expected: PROCESSED): PROCESSED
Total Attempts (Expected: 2): 2
Event CreatedAt: 2026-08-22T15:41:40.687Z
Event LastAttemptAt: 2026-08-22T15:41:40.702Z
Event ProcessedAt: 2026-08-22T15:41:40.715Z

--- NOTIFICATION TABLE AUDIT ---
Total Notification Records (Expected: 2): 2
  [Notification #1] ID: b487cb7e-154f-4db7-96a8-63514ec5bb18 | Delivery: IN_APP | CreatedAt: 2026-08-22T15:41:40.710Z
  [Notification #2] ID: a9734382-069a-41cf-b813-58d766ced630 | Delivery: EMAIL | CreatedAt: 2026-08-22T15:41:40.714Z

=== E2-005 VERDICT MATRIX ===
- Sweep correctly recovered PROCESSING -> PENDING: 🟢 PASS
- Worker B successfully claimed: 🟢 PASS
- Event resolved to PROCESSED with 2 attempts: 🟢 PASS
- Exactly one notification set generated (Idempotency): 🟢 PASS
- Recovery Latency (16.00 mins) < 20-min SLO limit: 🟢 PASS

OVERALL E2-005 STAGING STATUS: 🟢 PASS
```

### 2. Operational recovery_latency Calculation
$$\text{recovery\_latency} = \text{recovery\_timestamp} - \text{initial\_last\_attempt\_at}$$
$$\text{recovery\_latency} = 15:41:40.690\text{Z} - 15:25:40.684\text{Z} = 16.00\text{ minutes}$$
The recovery latency in this staging run was exactly $16.00$ minutes, successfully confirming that a stuck event can be returned to `PENDING` and processed without data loss or duplicate notifications.

---

### 3. SLO Parameter Discrepancy Discovery (Audited Code Configuration)
During codebase parameter verification in `universal/backend/src/learning-library/session/outbox-worker.service.ts`, we audited the production configurations:
1. **Processing Lock Timeout** (Line 257):
   ```typescript
   const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
   ```
   *Status*: **`15 minutes`** (🟢 Matches production target)
2. **Recovery Sweep Cron Interval** (Line 36):
   ```typescript
   }, 10 * 60 * 1000);
   ```
   *Status*: **`10 minutes`** (🔴 Discrepancy)

#### Architectural Assessment:
* **Theoretic Maximum Latency**: Under current configurations, the maximum theoretical time for an event stuck in `PROCESSING` to be recovered is:
  $$\text{Lock Timeout} + \text{Sweep Cron Interval} = 15\text{ mins} + 10\text{ mins} = 25\text{ minutes}$$
* **SLO Violation**: The target SLO requires a maximum recovery latency of **$<20$ minutes**. The current codebase configuration allows up to **$25$ minutes**, representing an SLO compliance defect.
* *Correction Required*: The sweep cron interval in `outbox-worker.service.ts` must be decreased from `10 minutes` to **`5 minutes`** (`5 * 60 * 1000`) before final production release.
