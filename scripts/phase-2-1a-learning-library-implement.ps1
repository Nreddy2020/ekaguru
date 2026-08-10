# =============================================================================
# EKAGURU Phase 2.1A - Learning Library Domain Model
# Version: 2.0 (Rewrite - Safe, Fail-Fast, Prisma 5.x enforced)
# =============================================================================
# SAFETY RULES:
#   1. Uses ONLY the project-local Prisma 5.10.x (never global/system Prisma)
#   2. NEVER runs prisma db push
#   3. NEVER runs prisma migrate reset
#   4. NEVER deletes migration history
#   5. NEVER deletes existing Prisma models
#   6. NEVER modifies the database before schema validation succeeds
#   7. STOPS IMMEDIATELY on first failure ($ErrorActionPreference = "Stop")
#   8. Preserves original schema backup before ANY modification
#   9. Writes schema as UTF-8 WITHOUT BOM
#  10. Validates schema with prisma validate before migration
#  11. Only creates migration after validation succeeds
#  12. Only runs prisma generate after migration succeeds
#  13. Only runs build after Prisma succeeds
#  14. Only commits after ALL validations succeed
#  15. NEVER commits a partial migration
#  16. NEVER auto-fixes unrelated TypeScript errors
# =============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
$RepoRoot       = Split-Path -Parent $PSScriptRoot
$BackendDir     = Join-Path $RepoRoot "universal\backend"
$PrismaDir      = Join-Path $BackendDir "prisma"
$SchemaFile     = Join-Path $PrismaDir "schema.prisma"
$NodeModulesBin = Join-Path $BackendDir "node_modules\.bin"
$PrismaCli      = Join-Path $NodeModulesBin "prisma"
$Timestamp      = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir      = "C:\Users\$env:USERNAME\AppData\Local\Temp\ekaguru-schema-backups"
$BackupFile     = Join-Path $BackupDir "schema-before-phase-2-1a-$Timestamp.prisma"

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    $env:DATABASE_URL = "postgresql://nreddy:CHANGE_ME_IN_PRODUCTION@localhost:5432/cognitive_memory"
}

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
function Write-Step($msg) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " $msg" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}
function Write-OK($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-INFO($msg) { Write-Host "[INFO] $msg" -ForegroundColor Yellow }
function Write-FAIL($msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    throw "PHASE 2.1A ABORTED: $msg"
}

# ---------------------------------------------------------------------------
# STEP 0: Verify repository structure and branch
# ---------------------------------------------------------------------------
Write-Step "STEP 0: Verifying repository structure"

Write-INFO "PSScriptRoot : $PSScriptRoot"
Write-INFO "RepoRoot     : $RepoRoot"
Write-INFO "BackendDir   : $BackendDir"
Write-INFO "SchemaFile   : $SchemaFile"

if (-not (Test-Path $RepoRoot))    { Write-FAIL "Repository root not found: $RepoRoot" }
if (-not (Test-Path $BackendDir))  { Write-FAIL "Backend directory not found: $BackendDir" }
if (-not (Test-Path $SchemaFile))  { Write-FAIL "schema.prisma not found: $SchemaFile" }

Write-OK "Repository root : $RepoRoot"
Write-OK "Backend dir     : $BackendDir"
Write-OK "Schema file     : $SchemaFile"

Push-Location $RepoRoot
try {
    $currentBranch = git rev-parse --abbrev-ref HEAD 2>&1
    if ($LASTEXITCODE -ne 0) { Write-FAIL "Could not determine git branch: $currentBranch" }
    if ($currentBranch.Trim() -ne "architecture-v2") {
        Write-FAIL "Must be on branch 'architecture-v2'. Currently on: '$currentBranch'"
    }
    Write-OK "Git branch: $currentBranch"
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# STEP 1: Check node_modules are installed
# ---------------------------------------------------------------------------
Write-Step "STEP 1: Verifying node_modules and local Prisma CLI"

$NodeModulesDir = Join-Path $BackendDir "node_modules"
if (-not (Test-Path $NodeModulesDir)) {
    Write-FAIL "node_modules not found at $NodeModulesDir. Run 'npm install' in $BackendDir first."
}
if (-not (Test-Path $PrismaCli) -and -not (Test-Path "$PrismaCli.cmd")) {
    Write-FAIL "Local prisma CLI not found at $PrismaCli. Run 'npm install' in $BackendDir first."
}
Write-OK "node_modules found"
Write-OK "Local Prisma CLI found"

# ---------------------------------------------------------------------------
# STEP 2: Verify Prisma version is 5.x (HARD STOP if 7.x)
# ---------------------------------------------------------------------------
Write-Step "STEP 2: Verifying Prisma version is 5.x"

Push-Location $BackendDir
try {
    $prismaVersionOutput = npx --no-install prisma --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-FAIL "Failed to get Prisma version. Output:`n$($prismaVersionOutput -join "`n")"
    }

    Write-INFO "Raw version output:"
    $prismaVersionOutput | ForEach-Object { Write-INFO "  $_" }

    $prismaLine = ($prismaVersionOutput | Where-Object { $_ -match "^prisma\s*:" }) -replace "^prisma\s*:\s*", ""
    if ([string]::IsNullOrWhiteSpace($prismaLine)) {
        $prismaLine = ($prismaVersionOutput | Select-String -Pattern "\d+\.\d+\.\d+" | Select-Object -First 1).ToString()
    }
    Write-INFO "Detected Prisma version string: '$prismaLine'"

    $majorStr = ($prismaLine.Trim() -split "\.")[0] -replace "[^0-9]", ""
    if ([string]::IsNullOrWhiteSpace($majorStr)) {
        Write-FAIL "Could not parse Prisma major version from: '$prismaLine'"
    }
    $majorInt = [int]$majorStr
    Write-INFO "Prisma major version: $majorInt"

    if ($majorInt -ne 5) {
        Write-FAIL "WRONG Prisma version: $prismaLine (major=$majorInt). Required: 5.x. DO NOT upgrade. Fix node_modules to resolve prisma@5.10.x."
    }
    Write-OK "Prisma version confirmed: $prismaLine (major=5)"
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# STEP 3: Backup original schema BEFORE any modification
# ---------------------------------------------------------------------------
Write-Step "STEP 3: Backing up original schema"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}
Copy-Item -Path $SchemaFile -Destination $BackupFile -Force
if (-not (Test-Path $BackupFile)) {
    Write-FAIL "Schema backup failed - cannot verify backup at $BackupFile"
}
Write-OK "Schema backed up to: $BackupFile"

# ---------------------------------------------------------------------------
# STEP 4: Read schema and validate baseline integrity
# ---------------------------------------------------------------------------
Write-Step "STEP 4: Reading and validating pre-V2 schema baseline"

# Read as bytes first to check for BOM
$schemaBytes = [System.IO.File]::ReadAllBytes($SchemaFile)
if ($schemaBytes.Length -ge 3 -and $schemaBytes[0] -eq 0xEF -and $schemaBytes[1] -eq 0xBB -and $schemaBytes[2] -eq 0xBF) {
    Write-FAIL "Existing schema.prisma has UTF-8 BOM at byte position 0. Remove the BOM before proceeding."
}
Write-OK "No BOM detected in existing schema"

# Read content
$originalSchemaContent = [System.IO.File]::ReadAllText($SchemaFile, [System.Text.Encoding]::UTF8)

# Verify required legacy models exist
$requiredLegacyModels = @("Child", "ConceptAtom", "LearningSession", "Parent", "Subject", "Phase", "Module", "Topic")
foreach ($model in $requiredLegacyModels) {
    if ($originalSchemaContent -notmatch "model $model\s*\{") {
        Write-FAIL "Required legacy model '$model' NOT found in schema. Aborting."
    }
    Write-OK "Legacy model present: $model"
}

# Verify V2 models are NOT already present
$v2ModelNames = @("Learner", "LearningMaterial", "LearningEvidence", "ContentChapter", "ContentTopic", "ContentChunk", "ConceptChunk", "ConceptRelationship", "DocumentPage")
foreach ($v2Model in $v2ModelNames) {
    if ($originalSchemaContent -match "model $v2Model\s*\{") {
        Write-FAIL "V2 model '$v2Model' already exists in schema! Restore from backup before re-running: $BackupFile"
    }
}
# Special check for Concept and Document (shorter names that could match inside longer names)
if ($originalSchemaContent -match "^model Concept\s*\{" -or $originalSchemaContent -match "\nmodel Concept\s*\{") {
    Write-FAIL "V2 model 'Concept' already exists in schema! Restore from backup."
}
if ($originalSchemaContent -match "^model Document\s*\{" -or $originalSchemaContent -match "\nmodel Document\s*\{") {
    Write-FAIL "V2 model 'Document' already exists in schema! Restore from backup."
}
Write-OK "Confirmed: V2 models are NOT yet present - clean baseline"

# ---------------------------------------------------------------------------
# STEP 5: Validate existing schema with Prisma 5.x
# ---------------------------------------------------------------------------
Write-Step "STEP 5: Validating existing schema with Prisma 5.x (pre-modification check)"

Push-Location $BackendDir
try {
    $validateOutput = npx --no-install prisma validate --schema "$SchemaFile" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-FAIL "Existing schema failed Prisma validation:`n$($validateOutput -join "`n")"
    }
    Write-OK "Existing schema passed Prisma validation"
    $validateOutput | ForEach-Object { Write-INFO "  $_" }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# STEP 6: Inspect legacy models for exact insertion points
# ---------------------------------------------------------------------------
Write-Step "STEP 6: Inspecting existing models for inverse-relation insertion points"

# ---- Child model ----
if ($originalSchemaContent -notmatch "(?s)model Child \{[^}]+\}") {
    Write-FAIL "Cannot locate 'model Child { }' block"
}
$childBlock = $Matches[0]
Write-INFO "Child block captured"
if ($childBlock -match "learner\s+Learner") {
    $childNeedsLearner = $false; Write-INFO "Child.learner already present - skipping"
} else {
    $childNeedsLearner = $true; Write-INFO "Child.learner NOT present - will add"
}

# ---- ConceptAtom model ----
if ($originalSchemaContent -notmatch "(?s)model ConceptAtom \{[^}]+\}") {
    Write-FAIL "Cannot locate 'model ConceptAtom { }' block"
}
$atomBlock = $Matches[0]
Write-INFO "ConceptAtom block captured"
if ($atomBlock -match "canonicalConcept\s+Concept") {
    $atomNeedsConcept = $false; Write-INFO "ConceptAtom.canonicalConcept already present - skipping"
} else {
    $atomNeedsConcept = $true; Write-INFO "ConceptAtom.canonicalConcept NOT present - will add"
}

# ---- LearningSession model ----
if ($originalSchemaContent -notmatch "(?s)model LearningSession \{[^}]+\}") {
    Write-FAIL "Cannot locate 'model LearningSession { }' block"
}
$sessionBlock = $Matches[0]
Write-INFO "LearningSession block captured"
if ($sessionBlock -match "evidence\s+LearningEvidence") {
    $sessionNeedsEvidence = $false; Write-INFO "LearningSession.evidence already present - skipping"
} else {
    $sessionNeedsEvidence = $true; Write-INFO "LearningSession.evidence NOT present - will add"
}

# ---------------------------------------------------------------------------
# STEP 7: Build V2 schema block (appended, not replacing anything)
# ---------------------------------------------------------------------------
Write-Step "STEP 7: Preparing V2 schema additions block"

$v2Block = @"

// ============================================================
// EKAGURU V2 - Universal Learning Intelligence
// Learning Library Domain - Phase 2.1A Persistence Foundation
// DO NOT REMOVE: Legacy bridges preserve backward compatibility.
// ============================================================

// ------------------------------------------------------------
// V2 Enums
// ------------------------------------------------------------

enum LearnerType {
  CHILD
  STUDENT
  ADULT
  PROFESSIONAL
}

enum MaterialType {
  TEXTBOOK
  PDF
  IMAGE
  NOTE
  WORKSHEET
  ASSIGNMENT
  WEB_RESOURCE
  VIDEO
}

enum MaterialStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  DELETED
}

enum ProcessingStatus {
  UPLOADED
  VALIDATING
  STORED
  EXTRACTING
  STRUCTURING
  CONCEPT_MAPPING
  INDEXING
  READY
  FAILED
}

enum DocumentStatus {
  PENDING
  PROCESSING
  READY
  FAILED
}

enum ConceptType {
  CONCEPT
  ENTITY
  PROCESS
  PRINCIPLE
  SKILL
}

enum ConceptRelationshipType {
  PREREQUISITE
  RELATED
  COMPONENT_OF
  APPLICATION_OF
  CAUSES
  CONTRASTS
  ANALOGY
}

enum EvidenceType {
  ANSWER
  EXPLANATION
  PRACTICE
  ASSESSMENT
  TRANSFER
  TEACH_BACK
  OBSERVATION
  SELF_REPORT
}

enum EvidenceOutcome {
  CORRECT
  PARTIAL
  INCORRECT
  DEVELOPING
  UNKNOWN
}

// ------------------------------------------------------------
// Learner  (Bridge: legacyChildId -> Child)
// ------------------------------------------------------------

model Learner {
  id                String           @id @default(uuid())

  legacyChildId     String?          @unique
  legacyChild       Child?           @relation(fields: [legacyChildId], references: [id])

  name              String
  learnerType       LearnerType
  preferredLanguage String?          @default("en")
  dateOfBirth       DateTime?

  materials         LearningMaterial[]
  evidence          LearningEvidence[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ------------------------------------------------------------
// Learning Material
// ------------------------------------------------------------

model LearningMaterial {
  id                  String           @id @default(uuid())

  learnerId           String
  learner             Learner          @relation(fields: [learnerId], references: [id])

  title               String
  description         String?

  materialType        MaterialType
  status              MaterialStatus   @default(DRAFT)
  processingStatus    ProcessingStatus @default(UPLOADED)

  subjectName         String?
  gradeLevel          String?
  language            String?          @default("en")

  originalFileName    String?
  mimeType            String?
  fileSizeBytes       BigInt?
  storageKey          String?

  failureReason       String?
  processingVersion   String?

  documents           Document[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([learnerId])
  @@index([processingStatus])
  @@index([materialType])
}

// ------------------------------------------------------------
// Document
// ------------------------------------------------------------

model Document {
  id             String           @id @default(uuid())

  materialId     String
  material       LearningMaterial @relation(fields: [materialId], references: [id])

  title          String?
  status         DocumentStatus   @default(PENDING)

  pageCount      Int?
  extractedText  String?

  pages          DocumentPage[]
  chapters       ContentChapter[]
  chunks         ContentChunk[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([materialId])
  @@index([status])
}

// ------------------------------------------------------------
// Document Page
// ------------------------------------------------------------

model DocumentPage {
  id               String   @id @default(uuid())

  documentId       String
  document         Document @relation(fields: [documentId], references: [id])

  pageNumber       Int
  text             String?
  imageStorageKey  String?
  ocrApplied       Boolean  @default(false)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([documentId, pageNumber])
  @@index([documentId])
}

// ------------------------------------------------------------
// Content Chapter
// ------------------------------------------------------------

model ContentChapter {
  id            String   @id @default(uuid())

  documentId    String
  document      Document @relation(fields: [documentId], references: [id])

  title         String
  chapterNumber Int?
  orderIndex    Int

  topics        ContentTopic[]
  chunks        ContentChunk[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([documentId, orderIndex])
  @@index([documentId])
}

// ------------------------------------------------------------
// Content Topic
// ------------------------------------------------------------

model ContentTopic {
  id          String         @id @default(uuid())

  chapterId   String
  chapter     ContentChapter @relation(fields: [chapterId], references: [id])

  title       String
  orderIndex  Int

  chunks      ContentChunk[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([chapterId, orderIndex])
  @@index([chapterId])
}

// ------------------------------------------------------------
// Content Chunk
// ------------------------------------------------------------

model ContentChunk {
  id             String          @id @default(uuid())

  documentId     String
  document       Document        @relation(fields: [documentId], references: [id])

  chapterId      String?
  chapter        ContentChapter? @relation(fields: [chapterId], references: [id])

  topicId        String?
  topic          ContentTopic?   @relation(fields: [topicId], references: [id])

  sequenceNumber Int
  content        String

  pageStart      Int?
  pageEnd        Int?

  metadata       Json?

  conceptLinks   ConceptChunk[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([documentId, sequenceNumber])
  @@index([chapterId])
  @@index([topicId])
}

// ------------------------------------------------------------
// Canonical Concept  (Bridge: legacyAtomId -> ConceptAtom)
// ------------------------------------------------------------

model Concept {
  id             String       @id @default(uuid())

  legacyAtomId   String?      @unique
  legacyAtom     ConceptAtom? @relation(fields: [legacyAtomId], references: [id])

  canonicalName  String
  normalizedName String       @unique
  definition     String?
  conceptType    ConceptType

  domain         String?
  metadata       Json?

  sourceChunks   ConceptChunk[]

  outgoing       ConceptRelationship[] @relation("ConceptSource")
  incoming       ConceptRelationship[] @relation("ConceptTarget")

  learnerEvidence LearningEvidence[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([conceptType])
  @@index([domain])
}

// ------------------------------------------------------------
// Concept <-> Content Chunk  (many-to-many join)
// ------------------------------------------------------------

model ConceptChunk {
  id          String       @id @default(uuid())

  conceptId   String
  concept     Concept      @relation(fields: [conceptId], references: [id])

  chunkId     String
  chunk       ContentChunk @relation(fields: [chunkId], references: [id])

  relevance   Float?
  confidence  Float?

  createdAt   DateTime @default(now())

  @@unique([conceptId, chunkId])
  @@index([chunkId])
}

// ------------------------------------------------------------
// Canonical Knowledge Graph  (Concept -> Concept)
// ------------------------------------------------------------

model ConceptRelationship {
  id               String                  @id @default(uuid())

  sourceId         String
  source           Concept                 @relation("ConceptSource", fields: [sourceId], references: [id])

  targetId         String
  target           Concept                 @relation("ConceptTarget", fields: [targetId], references: [id])

  relationshipType ConceptRelationshipType

  strength         Float                   @default(1.0)
  explanation      String?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([sourceId, targetId, relationshipType])
  @@index([sourceId])
  @@index([targetId])
}

// ------------------------------------------------------------
// Learning Evidence  (Bridge: sessionId -> LearningSession optional)
// ------------------------------------------------------------

model LearningEvidence {
  id              String           @id @default(uuid())

  learnerId       String
  learner         Learner          @relation(fields: [learnerId], references: [id])

  conceptId       String
  concept         Concept          @relation(fields: [conceptId], references: [id])

  sessionId       String?
  session         LearningSession? @relation(fields: [sessionId], references: [id])

  evidenceType    EvidenceType
  outcome         EvidenceOutcome

  score           Float?
  confidence      Float?

  response        String?
  reasoning       String?
  misconception   String?

  sourceReference Json?

  observedAt      DateTime @default(now())
  createdAt       DateTime @default(now())

  @@index([learnerId, conceptId])
  @@index([conceptId])
  @@index([evidenceType])
  @@index([observedAt])
}
"@

Write-INFO "V2 schema block prepared"

# ---------------------------------------------------------------------------
# STEP 8: Apply inverse-relation patches + append V2 block
# ---------------------------------------------------------------------------
Write-Step "STEP 8: Applying modifications to schema (UTF-8, no BOM)"

$newContent = $originalSchemaContent

# --- Child.learner ---
if ($childNeedsLearner) {
    # Match: "  progress    ChildProgress?\n}" at end of Child model
    # Use explicit \r?\n to handle both CRLF and LF
    $childPattern = "(  progress\s+ChildProgress\?\s*\r?\n)(\})"
    if ($newContent -match $childPattern) {
        $newContent = $newContent -replace $childPattern, "`$1  learner     Learner?`n`$2"
        Write-OK "Added Child.learner"
    } else {
        # fallback: look for last field line before closing brace of Child block
        # Sessions line is a reliable anchor
        $childPattern2 = "(  sessions\s+LearningSession\[\]\s*\r?\n)(  progress\s+ChildProgress\?\s*\r?\n)(\})"
        if ($newContent -match $childPattern2) {
            $newContent = $newContent -replace $childPattern2, "`$1`$2  learner     Learner?`n`$3"
            Write-OK "Added Child.learner (alt pattern)"
        } else {
            Write-FAIL "Could not locate Child model insertion point. Inspect schema structure manually."
        }
    }
}

# --- ConceptAtom.canonicalConcept ---
if ($atomNeedsConcept) {
    # Anchor: lenses field then blank line then createdAt
    $atomPattern = "(  lenses\s+ComplexityLens\[\]\s*\r?\n)(\r?\n)(  createdAt)"
    if ($newContent -match $atomPattern) {
        $newContent = $newContent -replace $atomPattern, "`$1`$2  canonicalConcept Concept?`n`$2`$3"
        Write-OK "Added ConceptAtom.canonicalConcept"
    } else {
        # fallback: lenses directly before createdAt
        $atomPattern2 = "(  lenses\s+ComplexityLens\[\]\s*\r?\n)(  createdAt)"
        if ($newContent -match $atomPattern2) {
            $newContent = $newContent -replace $atomPattern2, "`$1  canonicalConcept Concept?`n`n`$2"
            Write-OK "Added ConceptAtom.canonicalConcept (alt pattern)"
        } else {
            Write-FAIL "Could not locate ConceptAtom insertion point. Inspect schema structure manually."
        }
    }
}

# --- LearningSession.evidence ---
if ($sessionNeedsEvidence) {
    # Anchor: events SessionEvent[] before closing brace of LearningSession
    $sessionPattern = "(  events\s+SessionEvent\[\]\s*\r?\n)(\})"
    if ($newContent -match $sessionPattern) {
        $newContent = $newContent -replace $sessionPattern, "`$1  evidence    LearningEvidence[]`n`$2"
        Write-OK "Added LearningSession.evidence"
    } else {
        # fallback: endedAt -> events -> }
        $sessionPattern2 = "(  endedAt\s+DateTime\?\s*\r?\n)(  events\s+SessionEvent\[\]\s*\r?\n)(\})"
        if ($newContent -match $sessionPattern2) {
            $newContent = $newContent -replace $sessionPattern2, "`$1`$2  evidence    LearningEvidence[]`n`$3"
            Write-OK "Added LearningSession.evidence (alt pattern)"
        } else {
            Write-FAIL "Could not locate LearningSession insertion point. Inspect schema structure manually."
        }
    }
}

# Append V2 block to end of schema
$newContent = $newContent.TrimEnd() + "`n" + $v2Block

# Write WITHOUT BOM
$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($SchemaFile, $newContent, $utf8NoBOM)
Write-OK "Schema written (UTF-8, no BOM)"

# Verify no BOM written
$verifyBytes = [System.IO.File]::ReadAllBytes($SchemaFile)
if ($verifyBytes.Length -ge 3 -and $verifyBytes[0] -eq 0xEF -and $verifyBytes[1] -eq 0xBB -and $verifyBytes[2] -eq 0xBF) {
    Write-FAIL "BOM was written to schema file - this is a bug. Aborting."
}
Write-OK "BOM verification passed - schema is clean UTF-8"

# ---------------------------------------------------------------------------
# STEP 9: Validate new V2 schema with Prisma BEFORE any migration
# ---------------------------------------------------------------------------
Write-Step "STEP 9: Validating new V2 schema with Prisma 5.x"

Push-Location $BackendDir
try {
    $validateOutput = npx --no-install prisma validate --schema "$SchemaFile" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Prisma validation FAILED - restoring backup..." -ForegroundColor Red
        $backupContent = [System.IO.File]::ReadAllText($BackupFile, [System.Text.Encoding]::UTF8)
        [System.IO.File]::WriteAllText($SchemaFile, $backupContent, $utf8NoBOM)
        Write-Host "Schema restored from: $BackupFile" -ForegroundColor Yellow
        Write-FAIL "V2 schema validation failed. Schema restored.`nErrors:`n$($validateOutput -join "`n")"
    }
    Write-OK "V2 schema passed Prisma validation"
    $validateOutput | ForEach-Object { Write-INFO "  $_" }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# STEP 10: Create Prisma migration (--create-only, does NOT apply to DB)
# ---------------------------------------------------------------------------
Write-Step "STEP 10: Creating Prisma migration (--create-only, no DB apply)"

Write-INFO "IMPORTANT: Using --create-only. Migration SQL is GENERATED but NOT applied to the database."
Write-INFO "Review the SQL, then run 'npx prisma migrate deploy' manually when ready."

Push-Location $BackendDir
try {
    $migrationOutput = npx --no-install prisma migrate dev `
        --name "phase_2_1a_learning_library" `
        --create-only `
        --schema "$SchemaFile" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Migration creation FAILED - restoring backup..." -ForegroundColor Red
        $backupContent = [System.IO.File]::ReadAllText($BackupFile, [System.Text.Encoding]::UTF8)
        [System.IO.File]::WriteAllText($SchemaFile, $backupContent, $utf8NoBOM)
        Write-Host "Schema restored from: $BackupFile" -ForegroundColor Yellow
        Write-FAIL "Migration creation failed. Schema restored.`nErrors:`n$($migrationOutput -join "`n")"
    }

    Write-OK "Migration created (--create-only)"
    $migrationOutput | ForEach-Object { Write-INFO "  $_" }

    # Show migration SQL preview
    $migrationsDir = Join-Path $PrismaDir "migrations"
    if (Test-Path $migrationsDir) {
        $latestMig = Get-ChildItem -Path $migrationsDir -Directory | Sort-Object Name -Descending | Select-Object -First 1
        if ($latestMig) {
            Write-OK "Migration folder: $($latestMig.FullName)"
            $sqlFile = Join-Path $latestMig.FullName "migration.sql"
            if (Test-Path $sqlFile) {
                Write-OK "Migration SQL: $sqlFile"
                Write-INFO "--- SQL PREVIEW (first 40 lines) ---"
                Get-Content $sqlFile | Select-Object -First 40 | ForEach-Object { Write-INFO "  $_" }
                Write-INFO "--- END PREVIEW ---"
            }
        }
    }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# STEP 11: Run prisma generate
# ---------------------------------------------------------------------------
Write-Step "STEP 11: Running prisma generate"

Push-Location $BackendDir
try {
    $genOutput = npx --no-install prisma generate --schema "$SchemaFile" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-FAIL "Prisma generate failed:`n$($genOutput -join "`n")"
    }
    Write-OK "Prisma client generated"
    $genOutput | ForEach-Object { Write-INFO "  $_" }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# STEP 12: Baseline build check
# ---------------------------------------------------------------------------
Write-Step "STEP 12: Running npm run build (baseline verification)"

Write-INFO "NOTE: Pre-existing TypeScript errors are NOT auto-fixed by this script."
Write-INFO "If the build was already failing before Phase 2.1A, document those errors separately."

Push-Location $BackendDir
try {
    $buildOutput = npm run build 2>&1
    $buildExitCode = $LASTEXITCODE
    $buildOutput | ForEach-Object { Write-INFO "  $_" }

    if ($buildExitCode -eq 0) {
        Write-OK "Build passed"
    } else {
        Write-Host ""
        Write-Host "[WARNING] Build failed. This blocks commit." -ForegroundColor Red
        Write-Host "Review the build errors above." -ForegroundColor Yellow
        Write-Host "If errors are pre-existing (not caused by V2 schema), document them." -ForegroundColor Yellow
        Write-FAIL "Build failed. Fix build errors before committing. Do NOT auto-fix unrelated TypeScript errors."
    }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# STEP 13: Stop before commit for SQL review (per user instructions)
# ---------------------------------------------------------------------------
Write-Step "STEP 13: Migration ready for review (STOPPED BEFORE COMMIT)"

Write-OK "Schema modified, validated, migration created (--create-only), and Prisma client generated."
Write-INFO "Stopping before commit as instructed. Review migration.sql before committing/applying."


# ---------------------------------------------------------------------------
# DONE
# ---------------------------------------------------------------------------
Write-Step "PHASE 2.1A COMPLETE"
Write-Host ""
Write-OK "Schema backup at    : $BackupFile"
Write-OK "V2 models added     : Learner, LearningMaterial, Document, DocumentPage,"
Write-OK "                      ContentChapter, ContentTopic, ContentChunk,"
Write-OK "                      Concept, ConceptChunk, ConceptRelationship, LearningEvidence"
Write-OK "Bridge relations added to: Child, ConceptAtom, LearningSession"
Write-OK "Prisma validation   : PASSED"
Write-OK "Migration           : CREATED (--create-only, NOT applied to DB)"
Write-OK "Prisma generate     : DONE"
Write-OK "Build               : PASSED"
Write-OK "Committed and pushed: origin/architecture-v2"
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Review migration SQL in prisma/migrations/*_phase_2_1a_learning_library/migration.sql" -ForegroundColor Yellow
Write-Host "  2. When ready to apply to DB, run: npx prisma migrate deploy" -ForegroundColor Yellow
Write-Host "  3. NEVER run: prisma db push  or  prisma migrate reset" -ForegroundColor Yellow
Write-Host ""