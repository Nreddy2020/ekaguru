$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " EKAGURU - Phase 2.1A Schema Audit" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$RepoRoot = (Get-Location).Path

# Repository check
if (-not (Test-Path ".git")) {
    throw "Not an EKAGURU Git repository."
}

# Branch check
$Branch = (git branch --show-current).Trim()

if ($Branch -ne "architecture-v2") {
    throw "Expected architecture-v2 branch. Current branch: $Branch"
}

# Clean tree check
$GitStatus = git status --porcelain

if ($GitStatus) {
    Write-Host "Working tree is not clean:" -ForegroundColor Red
    git status --short
    throw "Commit or stash existing changes before running this phase."
}

Write-Host "Repository : $RepoRoot" -ForegroundColor Green
Write-Host "Branch     : $Branch" -ForegroundColor Green
Write-Host "Git status : CLEAN" -ForegroundColor Green
Write-Host ""

# Prisma paths
$Schema = Join-Path $RepoRoot "universal\backend\prisma\schema.prisma"

if (-not (Test-Path $Schema)) {
    throw "Prisma schema not found: $Schema"
}

$DocsDir = Join-Path $RepoRoot "docs\implementation"
$BackupDir = Join-Path $DocsDir "backups"

New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$BackupFile = Join-Path `
    $BackupDir `
    "schema-before-phase-2-1a-$Timestamp.prisma"

$InventoryFile = Join-Path `
    $DocsDir `
    "phase-2-1a-schema-inventory.md"

# Backup
Copy-Item $Schema $BackupFile -Force

Write-Host "Schema backup:" -ForegroundColor Green
Write-Host "  $BackupFile"
Write-Host ""

# Read schema
$SchemaText = Get-Content $Schema -Raw

# Find models
$ModelMatches = [regex]::Matches(
    $SchemaText,
    '(?m)^model\s+([A-Za-z0-9_]+)\s*\{'
)

$Models = @()

foreach ($Match in $ModelMatches) {
    $Models += $Match.Groups[1].Value
}

# Find enums
$EnumMatches = [regex]::Matches(
    $SchemaText,
    '(?m)^enum\s+([A-Za-z0-9_]+)\s*\{'
)

$Enums = @()

foreach ($Match in $EnumMatches) {
    $Enums += $Match.Groups[1].Value
}

# V2 target models
$TargetModels = @(
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

# Build model list
$ModelList = @()

foreach ($Model in ($Models | Sort-Object)) {
    $ModelList += "- $Model"
}

# Build enum list
$EnumList = @()

foreach ($Enum in ($Enums | Sort-Object)) {
    $EnumList += "- $Enum"
}

# Build target list
$TargetList = @()

foreach ($Target in $TargetModels) {
    if ($Models -contains $Target) {
        $TargetList += "- [EXISTS] $Target"
    }
    else {
        $TargetList += "- [NEW] $Target"
    }
}

# Generate inventory
$Lines = @()

$Lines += "# EKAGURU Architecture V2"
$Lines += ""
$Lines += "## Phase 2.1A - Prisma Schema Inventory"
$Lines += ""
$Lines += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$Lines += ""
$Lines += "Branch: $Branch"
$Lines += ""
$Lines += "---"
$Lines += ""
$Lines += "## Existing Prisma Models"
$Lines += ""
$Lines += $ModelList
$Lines += ""
$Lines += "---"
$Lines += ""
$Lines += "## Existing Prisma Enums"
$Lines += ""
$Lines += $EnumList
$Lines += ""
$Lines += "---"
$Lines += ""
$Lines += "## V2 Target Models"
$Lines += ""
$Lines += $TargetList
$Lines += ""
$Lines += "---"
$Lines += ""
$Lines += "## Migration Rules"
$Lines += ""
$Lines += "1. Do not delete existing models."
$Lines += "2. Do not reset the database."
$Lines += "3. Do not run prisma db push."
$Lines += "4. Do not delete migration history."
$Lines += "5. Do not remove MongoDB in this phase."
$Lines += "6. Do not implement ingestion in this phase."
$Lines += "7. Do not implement pgvector in this phase."
$Lines += "8. Do not implement LLM orchestration in this phase."
$Lines += "9. Avoid duplicate sources of truth."
$Lines += ""

$Lines | Set-Content $InventoryFile -Encoding UTF8

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " AUDIT COMPLETE" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Inventory:"
Write-Host "  $InventoryFile"

Write-Host ""
Write-Host "Backup:"
Write-Host "  $BackupFile"

Write-Host ""
Write-Host "NO DATABASE CHANGES WERE MADE."
Write-Host "NO EXISTING MODELS WERE DELETED."
Write-Host "NO MIGRATION WAS CREATED."
Write-Host ""

git status --short