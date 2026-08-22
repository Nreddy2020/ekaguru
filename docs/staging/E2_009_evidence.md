# EKAGURU V2 — E2 Staging Execution Evidence: E2-009

## E2-009 — Migration Reproducibility & Rolling Compatibility
* **Timestamp**: 2026-08-22T23:10:00+05:30
* **HEAD Commit**: `47d97033fa4bc082260c51121d5a7d3066a7bdaa0`
* **Bootstrap Strategy**: Adopted **Option B (V1 Baseline + V2 Incremental Migration)** by introducing an explicit legacy Phase 1 baseline migration (`20260809000000_legacy_v1_baseline`) at the beginning of the migration chain.

### 1. Staging Run Log Output (Bootstrap and Upgrade Verification)
```
=== STARTING E2-009 MIGRATION REPRODUCIBILITY & BOOTSTRAP AUDIT ===

--- TEST E2-009A: CLEAN DATABASE BOOTSTRAP ---
Recreating clean empty database...
Verification DB "ekaguru_migration_verify" created.
Running: npx prisma migrate deploy
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "ekaguru_migration_verify", schema "public" at "localhost:5432"

7 migrations found in prisma/migrations

Applying migration `20260809000000_legacy_v1_baseline`
Applying migration `20260810105005_phase_2_1a_learning_library`
Applying migration `20260811000000_phase_2_4_knowledge_abstraction`
Applying migration `20260811010000_phase_2_5_semantic_alignment`
Applying migration `20260811020000_phase_2_6_universal_curriculum`
Applying migration `20260811030000_phase_2_7_learner_mastery`
Applying migration `20260811040000_phase_2_8_adaptive_session_engine`

The following migration(s) have been applied:

migrations/
  └─ 20260809000000_legacy_v1_baseline/
    └─ migration.sql
  └─ 20260810105005_phase_2_1a_learning_library/
    └─ migration.sql
  └─ 20260811000000_phase_2_4_knowledge_abstraction/
    └─ migration.sql
  └─ 20260811010000_phase_2_5_semantic_alignment/
    └─ migration.sql
  └─ 20260811020000_phase_2_6_universal_curriculum/
    └─ migration.sql
  └─ 20260811030000_phase_2_7_learner_mastery/
    └─ migration.sql
  └─ 20260811040000_phase_2_8_adaptive_session_engine/
    └─ migration.sql
      
All migrations have been successfully applied.

Prisma migrate deploy clean bootstrap result: 🟢 SUCCESS

--- TEST E2-009B: LEGACY BASELINE UPGRADE PATH ---
Recreating database and seeding manual V1 tables to simulate existing legacy environment...
Seeding V1 baseline SQL directly into container stdin...
Legacy V1 baseline tables successfully created.
Resolving baseline migration as already applied...
Running: npx prisma migrate resolve --applied 20260809000000_legacy_v1_baseline
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "ekaguru_migration_verify", schema "public" at "localhost:5432"

Migration 20260809000000_legacy_v1_baseline marked as applied.

Prisma migrate resolve result: 🟢 SUCCESS
Applying incremental migrations...
Running: npx prisma migrate deploy
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "ekaguru_migration_verify", schema "public" at "localhost:5432"

7 migrations found in prisma/migrations

Applying migration `20260810105005_phase_2_1a_learning_library`
Applying migration `20260811000000_phase_2_4_knowledge_abstraction`
Applying migration `20260811010000_phase_2_5_semantic_alignment`
Applying migration `20260811020000_phase_2_6_universal_curriculum`
Applying migration `20260811030000_phase_2_7_learner_mastery`
Applying migration `20260811040000_phase_2_8_adaptive_session_engine`

The following migration(s) have been applied:

migrations/
  └─ 20260810105005_phase_2_1a_learning_library/
    └─ migration.sql
  └─ 20260811000000_phase_2_4_knowledge_abstraction/
    └─ migration.sql
  └─ 20260811010000_phase_2_5_semantic_alignment/
    └─ migration.sql
  └─ 20260811020000_phase_2_6_universal_curriculum/
    └─ migration.sql
  └─ 20260811030000_phase_2_7_learner_mastery/
    └─ migration.sql
  └─ 20260811040000_phase_2_8_adaptive_session_engine/
    └─ migration.sql
      
All migrations have been successfully applied.

Prisma migrate deploy incremental result: 🟢 SUCCESS

=== E2-009 MIGRATION VERDICT ===
- Clean DB Bootstrap (E2-009A):    🟢 PASS
- Legacy Upgrade Path (E2-009B):   🟢 PASS

OVERALL E2-009 MIGRATION REPRODUCIBILITY STATUS: 🟢 PASS
```

### 2. Operational Upgrade Instructions for Production
To ensure backward-compatibility and zero downtime during rollout, production deployments must execute the following two-step sequence:

#### Step 1: Baseline Existing Databases (Runs once prior to deploy)
To migrate existing V1 production databases where the V1 schema tables (`Parent`, `Child`, `ConceptAtom`, etc.) are already present, run the following command to record the baseline migration as already applied without recreating the tables:
```bash
npx prisma migrate resolve --applied 20260809000000_legacy_v1_baseline
```

#### Step 2: Run Incremental Deployments
Once resolved, run standard migration deployment to safely apply V2 incremental migrations forward:
```bash
npx prisma migrate deploy
```

---

### 3. Rolling Version Compatibility Analysis
* **Schema Contract Invariant**: All incremental database modifications introduced in Phase 2 are strictly **additive** (new tables, new relations, nullable fields). No fields or tables used by active Phase 1 services were deleted or altered.
* **Rolling Deployment Safe**: The contract between Version N (V1) and Version N+1 (V2) is preserved. APIs and background workers can run concurrently during rolling updates without experiencing query failures or schema mismatch errors.
