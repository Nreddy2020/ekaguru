$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " EKAGURU - Phase 2.1A" -ForegroundColor Cyan
Write-Host " Learning Library Domain Implementation" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$RepoRoot = (Get-Location).Path

# ============================================================
# SAFETY
# ============================================================

if (-not (Test-Path ".git")) {
    throw "Not an EKAGURU Git repository."
}

$Branch = (git branch --show-current).Trim()

if ($Branch -ne "architecture-v2") {
    throw "STOP: Expected architecture-v2. Current branch: $Branch"
}

$Status = git status --porcelain

if ($Status) {
    Write-Host "Working tree is not clean:" -ForegroundColor Red
    git status --short
    throw "STOP: Working tree must be clean."
}

Write-Host "Repository : $RepoRoot" -ForegroundColor Green
Write-Host "Branch     : $Branch" -ForegroundColor Green
Write-Host "Git status : CLEAN" -ForegroundColor Green
Write-Host ""

# ============================================================
# PATHS
# ============================================================

$Backend = Join-Path $RepoRoot "universal\backend"
$Schema = Join-Path $Backend "prisma\schema.prisma"
$PrismaDir = Join-Path $Backend "prisma"

if (-not (Test-Path $Schema)) {
    throw "Prisma schema not found: $Schema"
}

# ============================================================
# BACKUP OUTSIDE REPOSITORY
# ============================================================

$BackupRoot = Join-Path $env:TEMP "ekaguru-schema-backups"

New-Item `
    -ItemType Directory `
    -Path $BackupRoot `
    -Force | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$BackupFile = Join-Path `
    $BackupRoot `
    "schema-before-phase-2-1a-$Timestamp.prisma"

Copy-Item $Schema $BackupFile -Force

Write-Host "Schema backup:" -ForegroundColor Green
Write-Host "  $BackupFile"
Write-Host ""

# ============================================================
# READ SCHEMA
# ============================================================

$SchemaText = Get-Content $Schema -Raw

# ============================================================
# SAFETY: PREVENT DUPLICATE V2 MODELS
# ============================================================

$V2Models = @(
    "Learner",
    "LearningMaterial",
    "Document",
    "DocumentPage",
    "ContentChapter",
    "ContentTopic",
    "ContentChunk",
    "Concept",
    "ConceptChunk",
    "ConceptRelationship",
    "LearningEvidence"
)

foreach ($Model in $V2Models) {

    if ($SchemaText -match "(?m)^model\s+$Model\s*\{") {

        throw "STOP: V2 model '$Model' already exists. This script will not overwrite an existing implementation."
    }
}

# ============================================================
# SAFETY: ENUM CHECK
# ============================================================

$V2Enums = @(
    "LearnerType",
    "MaterialType",
    "MaterialStatus",
    "ProcessingStatus",
    "DocumentStatus",
    "ConceptType",
    "ConceptRelationshipType",
    "EvidenceType",
    "EvidenceOutcome"
)

foreach ($Enum in $V2Enums) {

    if ($SchemaText -match "(?m)^enum\s+$Enum\s*\{") {

        throw "STOP: V2 enum '$Enum' already exists."
    }
}

# ============================================================
# BRIDGE EXISTING CHILD
# ============================================================

$ChildMarker = @"
  learner     Learner?
"@

if ($SchemaText -notmatch "(?m)^\s*learner\s+Learner\?\s*$") {

    $ChildPattern = '(?s)(model Child \{.*?progress\s+ChildProgress\?\s*)'

    if ($SchemaText -notmatch $ChildPattern) {
        throw "Could not safely locate Child model."
    }

    $SchemaText = [regex]::Replace(
        $SchemaText,
        $ChildPattern,
        '$1' + "`r`n" + $ChildMarker + "`r`n",
        1
    )
}

# ============================================================
# BRIDGE EXISTING CONCEPT ATOM
# ============================================================

$ConceptAtomPattern = '(?s)(model ConceptAtom \{.*?lenses\s+ComplexityLens\[\]\s*)'

if ($SchemaText -notmatch "(?m)^\s*canonicalConcept\s+Concept\?\s*$") {

    if ($SchemaText -notmatch $ConceptAtomPattern) {
        throw "Could not safely locate ConceptAtom model."
    }

    $SchemaText = [regex]::Replace(
        $SchemaText,
        $ConceptAtomPattern,
        '$1' + "`r`n  canonicalConcept Concept?" + "`r`n",
        1
    )
}

# ============================================================
# BRIDGE LEARNING SESSION
# ============================================================

$SessionPattern = '(?s)(model LearningSession \{.*?events\s+SessionEvent\[\])'

if ($SchemaText -notmatch "(?m)^\s*evidence\s+LearningEvidence\[\]\s*$") {

    if ($SchemaText -notmatch $SessionPattern) {
        throw "Could not safely locate LearningSession model."
    }

    $SchemaText = [regex]::Replace(
        $SchemaText,
        $SessionPattern,
        '$1' + "`r`n  evidence    LearningEvidence[]" + "`r`n",
        1
    )
}

# ============================================================
# V2 ENUMS + MODELS
# ============================================================

$V2Schema = @'

// ============================================================
// EKAGURU V2 — Universal Learning Intelligence
// Learning Library Domain
// ============================================================

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
// Learner
// ------------------------------------------------------------

model Learner {
  id                 String   @id @default(uuid())

  legacyChildId      String?  @unique
  legacyChild        Child?   @relation(fields: [legacyChildId], references: [id])

  name               String
  learnerType        LearnerType
  preferredLanguage  String?  @default("en")
  dateOfBirth        DateTime?

  materials          LearningMaterial[]
  evidence           LearningEvidence[]

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
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
  fileSizeBytes      BigInt?
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
  id              String   @id @default(uuid())

  documentId      String
  document        Document @relation(fields: [documentId], references: [id])

  title           String
  chapterNumber   Int?
  orderIndex      Int

  topics          ContentTopic[]
  chunks          ContentChunk[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([documentId, orderIndex])
  @@index([documentId])
}

// ------------------------------------------------------------
// Content Topic
// ------------------------------------------------------------

model ContentTopic {
  id              String          @id @default(uuid())

  chapterId       String
  chapter         ContentChapter  @relation(fields: [chapterId], references: [id])

  title           String
  orderIndex      Int

  chunks          ContentChunk[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([chapterId, orderIndex])
  @@index([chapterId])
}

// ------------------------------------------------------------
// Content Chunk
// ------------------------------------------------------------

model ContentChunk {
  id               String          @id @default(uuid())

  documentId       String
  document         Document        @relation(fields: [documentId], references: [id])

  chapterId        String?
  chapter          ContentChapter? @relation(fields: [chapterId], references: [id])

  topicId          String?
  topic            ContentTopic?   @relation(fields: [topicId], references: [id])

  sequenceNumber   Int
  content          String

  pageStart        Int?
  pageEnd          Int?

  metadata         Json?

  conceptLinks     ConceptChunk[]

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([documentId, sequenceNumber])
  @@index([chapterId])
  @@index([topicId])
}

// ------------------------------------------------------------
// Canonical Concept
// ------------------------------------------------------------

model Concept {
  id                String   @id @default(uuid())

  legacyAtomId      String?  @unique
  legacyAtom        ConceptAtom? @relation(fields: [legacyAtomId], references: [id])

  canonicalName     String
  normalizedName    String   @unique
  definition        String?
  conceptType       ConceptType

  domain            String?
  metadata          Json?

  sourceChunks      ConceptChunk[]

  outgoing          ConceptRelationship[] @relation("ConceptSource")
  incoming          ConceptRelationship[] @relation("ConceptTarget")

  learnerEvidence   LearningEvidence[]

  createdAt          DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([conceptType])
  @@index([domain])
}

// ------------------------------------------------------------
// Concept ↔ Content Chunk
// ------------------------------------------------------------

model ConceptChunk {
  id          String        @id @default(uuid())

  conceptId   String
  concept     Concept       @relation(fields: [conceptId], references: [id])

  chunkId     String
  chunk       ContentChunk  @relation(fields: [chunkId], references: [id])

  relevance   Float?
  confidence  Float?

  createdAt   DateTime @default(now())

  @@unique([conceptId, chunkId])
  @@index([chunkId])
}

// ------------------------------------------------------------
// Canonical Knowledge Graph
// ------------------------------------------------------------

model ConceptRelationship {
  id                  String                  @id @default(uuid())

  sourceId            String
  source              Concept                 @relation("ConceptSource", fields: [sourceId], references: [id])

  targetId            String
  target              Concept                 @relation("ConceptTarget", fields: [targetId], references: [id])

  relationshipType    ConceptRelationshipType

  strength            Float                   @default(1.0)
  explanation         String?

  createdAt           DateTime                @default(now())
  updatedAt           DateTime                @updatedAt

  @@unique([sourceId, targetId, relationshipType])
  @@index([sourceId])
  @@index([targetId])
}

// ------------------------------------------------------------
// Evidence of Learning
// ------------------------------------------------------------

model LearningEvidence {
  id               String          @id @default(uuid())

  learnerId        String
  learner          Learner         @relation(fields: [learnerId], references: [id])

  conceptId        String
  concept          Concept         @relation(fields: [conceptId], references: [id])

  sessionId        String?
  session          LearningSession? @relation(fields: [sessionId], references: [id])

  evidenceType     EvidenceType
  outcome          EvidenceOutcome

  score            Float?
  confidence       Float?

  response         String?
  reasoning        String?
  misconception    String?

  sourceReference  Json?

  observedAt       DateTime        @default(now())
  createdAt        DateTime        @default(now())

  @@index([learnerId, conceptId])
  @@index([conceptId])
  @@index([evidenceType])
  @@index([observedAt])
}
'@

# ============================================================
# APPEND V2 SCHEMA
# ============================================================

$SchemaText = $SchemaText.TrimEnd() + "`r`n" + $V2Schema + "`r`n"

Set-Content `
    -Path $Schema `
    -Value $SchemaText `
    -Encoding UTF8

Write-Host "V2 schema models added." -ForegroundColor Green
Write-Host ""

# ============================================================
# PRISMA FORMAT
# ============================================================

Push-Location $Backend

try {

    Write-Host "Running Prisma format..." -ForegroundColor Cyan
    npx prisma format

    Write-Host ""
    Write-Host "Running Prisma validate..." -ForegroundColor Cyan
    npx prisma validate

    Write-Host ""
    Write-Host "Creating migration..." -ForegroundColor Cyan

    npx prisma migrate dev `
        --name add_learning_library_v2

    Write-Host ""
    Write-Host "Generating Prisma client..." -ForegroundColor Cyan

    npx prisma generate

    Write-Host ""
    Write-Host "Running backend build..." -ForegroundColor Cyan

    npm run build

    Write-Host ""
    Write-Host "Running backend tests..." -ForegroundColor Cyan

    if (Test-Path ".\test") {
        npm test -- --runInBand
    }
    else {
        Write-Host "No test directory found; skipping Jest." -ForegroundColor Yellow
    }

}
catch {

    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host " PHASE FAILED" -ForegroundColor Red
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host ""

    Write-Host $_.Exception.Message -ForegroundColor Red

    Write-Host ""
    Write-Host "Schema backup available at:" -ForegroundColor Yellow
    Write-Host $BackupFile

    Pop-Location

    throw
}

Pop-Location

# ============================================================
# REVIEW
# ============================================================

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " VALIDATION COMPLETE" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

git status --short

Write-Host ""
Write-Host "Changed files:" -ForegroundColor Cyan

git diff --stat

Write-Host ""
Write-Host "Migration directories:" -ForegroundColor Cyan

Get-ChildItem `
    ".\universal\backend\prisma\migrations" `
    -Directory |
    Sort-Object Name |
    Select-Object -Last 3 |
    ForEach-Object {
        Write-Host "  $($_.Name)"
    }

# ============================================================
# COMMIT
# ============================================================

Write-Host ""
Write-Host "Creating Git commit..." -ForegroundColor Cyan

git add universal/backend/prisma/schema.prisma
git add universal/backend/prisma/migrations

git commit `
    -m "feat: add learning library v2 domain model"

git push origin architecture-v2

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " PHASE 2.1A COMPLETE" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Commit:"
git log -1 --oneline

Write-Host ""
Write-Host "Branch:"
git branch --show-current

Write-Host ""
Write-Host "Working tree:"
git status --short

Write-Host ""
Write-Host "Schema backup:"
Write-Host $BackupFile