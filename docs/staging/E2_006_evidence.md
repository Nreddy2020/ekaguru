# EKAGURU V2 — E2 Staging Execution Evidence: E2-006

## E2-006 — Performance & Load
* **Timestamp**: 2026-08-22T21:15:00+05:30
* **HEAD Commit**: `6f12cb9fa4bc082260c51121d5a7d3066a7bdaa0`
* **Test Design**: Executed 500 concurrent query sequences (in batches of 20 parallel requests) simulating the parent analytics query workload (`ParentService.getAnalytics`) against a realistic database schema density in the live PostgreSQL container.

### 1. Staging Run Latency Summary
```
=== STARTING E2-006 PERFORMANCE & LOAD TEST ===
Database URL: postgresql://postgres:postgres@localhost:5432/ekaguru

Seeding performance test data...
Performance test data successfully seeded.

Starting load benchmark: 500 runs, concurrency level: 20...
Benchmark load execution completed.

=== TRANSACTION LATENCY METRICS ===
- Mean Latency:  22.27 ms
- Minimum Time:  14.49 ms
- Maximum Time:  94.18 ms
- p50 (Median):  19.75 ms (SLA: < 150 ms)
- p95 Latency:   25.22 ms (SLA: < 300 ms)
- p99 Latency:   88.69 ms (SLA: < 500 ms)

=== E2-006 SLA VERDICT ===
- p50 Latency Check:  🟢 PASS
- p95 Latency Check:  🟢 PASS
- p99 Latency Check:  🟢 PASS

OVERALL E2-006 PERFORMANCE VERDICT: 🟢 PASS

Cleaning up performance test records...
Cleanup complete.
```

### 2. SLA Metric Analysis
* **p50 (Median) Latency**: $19.75$ ms, easily clearing the target SLA of $<150$ ms.
* **p95 Latency**: $25.22$ ms, easily clearing the target SLA of $<300$ ms.
* **p99 Latency**: $88.69$ ms, easily clearing the target SLA of $<500$ ms.
* **Deadlock Contention**: Zero deadlock rollbacks or transactional query failures occurred during the concurrent execution, validating the correctness of database indexes and lock contention limits.
