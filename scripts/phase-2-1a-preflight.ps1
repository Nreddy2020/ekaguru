# =============================================================================
# EKAGURU Phase 2.1A - Pre-Flight Check Only
# Version: 1.0
# =============================================================================
# PURPOSE: Verifies the environment is ready to safely run the V2 migration.
#          DOES NOT modify any files, schema, database, or migrations.
#          DOES NOT run prisma migrate, prisma db push, or prisma migrate reset.
# =============================================================================
# HOW TO RUN:
#   cd C:\Users\nirwa\ekaguru\ekaguru
#   .\scripts\phase-2-1a-preflight.ps1
# =============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Config - derived from $PSScriptRoot so it works regardless of where you cd
# ---------------------------------------------------------------------------
$ScriptDir  = $PSScriptRoot
$RepoRoot   = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RepoRoot "universal\backend"
$PrismaDir  = Join-Path $BackendDir "prisma"
$SchemaFile = Join-Path $PrismaDir "schema.prisma"
$ImplScript = Join-Path $ScriptDir "phase-2-1a-learning-library-implement.ps1"
$PrismaCli  = Join-Path $BackendDir "node_modules\.bin\prisma.cmd"

$Pass  = 0
$Fail  = 0
$Warns = @()

function Write-Header($msg) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " $msg" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}
function Write-OK($label, $val) {
    $script:Pass++
    Write-Host ("[PASS] {0,-35} {1}" -f $label, $val) -ForegroundColor Green
}
function Write-WARN($label, $val) {
    $script:Warns += "$label : $val"
    Write-Host ("[WARN] {0,-35} {1}" -f $label, $val) -ForegroundColor Yellow
}
function Write-FAIL($label, $val) {
    $script:Fail++
    Write-Host ("[FAIL] {0,-35} {1}" -f $label, $val) -ForegroundColor Red
}
function Write-INFO($msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Gray
}

# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  EKAGURU Phase 2.1A - Pre-Flight Check" -ForegroundColor Cyan
Write-Host "  READ-ONLY - No files will be modified" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------------------
# CHECK 1: PSScriptRoot and path resolution
# ---------------------------------------------------------------------------
Write-Header "CHECK 1: Path Resolution"

Write-INFO "PSScriptRoot = $ScriptDir"
Write-INFO "RepoRoot     = $RepoRoot"
Write-INFO "BackendDir   = $BackendDir"
Write-INFO "SchemaFile   = $SchemaFile"
Write-INFO "ImplScript   = $ImplScript"

$expectedRepo = "C:\Users\nirwa\ekaguru\ekaguru"
if ($RepoRoot -eq $expectedRepo) {
    Write-OK "RepoRoot" "$RepoRoot [CORRECT]"
} else {
    Write-FAIL "RepoRoot" "$RepoRoot (expected: $expectedRepo)"
    Write-Host ""
    Write-Host "ERROR: Repository root does not match expected path." -ForegroundColor Red
    Write-Host "Make sure the script is located inside the repository at:" -ForegroundColor Yellow
    Write-Host "  $expectedRepo\scripts\phase-2-1a-preflight.ps1" -ForegroundColor Yellow
    Write-Host ""
}

if (Test-Path $RepoRoot)   { Write-OK "RepoRoot exists"    $RepoRoot }
else                        { Write-FAIL "RepoRoot exists"  "NOT FOUND: $RepoRoot" }

if (Test-Path $BackendDir) { Write-OK "BackendDir exists"  $BackendDir }
else                        { Write-FAIL "BackendDir exists" "NOT FOUND: $BackendDir" }

if (Test-Path $SchemaFile) { Write-OK "SchemaFile exists"  $SchemaFile }
else                        { Write-FAIL "SchemaFile exists" "NOT FOUND: $SchemaFile" }

if (Test-Path $ImplScript) { Write-OK "ImplScript exists"  $ImplScript }
else                        { Write-FAIL "ImplScript exists" "NOT FOUND: $ImplScript" }

# ---------------------------------------------------------------------------
# CHECK 2: Git repository and branch
# ---------------------------------------------------------------------------
Write-Header "CHECK 2: Git Repository and Branch"

$gitDir = Join-Path $RepoRoot ".git"
if (Test-Path $gitDir) {
    Write-OK "Git directory"   "$gitDir"
} else {
    Write-FAIL "Git directory" "NOT FOUND: $gitDir"
}

Push-Location $RepoRoot
try {
    $branch = git rev-parse --abbrev-ref HEAD 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-FAIL "Git branch" "ERROR: $branch"
    } elseif ($branch.Trim() -eq "architecture-v2") {
        Write-OK "Branch" "$($branch.Trim()) [CORRECT]"
    } else {
        Write-FAIL "Branch" "$($branch.Trim()) (expected: architecture-v2)"
    }

    $gitStatus = git status --short 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-FAIL "Git status" "ERROR: $gitStatus"
    } elseif ([string]::IsNullOrWhiteSpace($gitStatus -join "")) {
        Write-OK "Working tree" "CLEAN (no uncommitted changes)"
    } else {
        Write-WARN "Working tree" "Has uncommitted changes:"
        $gitStatus | ForEach-Object { Write-INFO "  $_" }
    }

    # Show last commit
    $lastCommit = git log --oneline -3 2>&1
    Write-INFO "Last 3 commits:"
    $lastCommit | ForEach-Object { Write-INFO "  $_" }

} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# CHECK 3: node_modules installed
# ---------------------------------------------------------------------------
Write-Header "CHECK 3: node_modules Installation"

$nodeModulesDir = Join-Path $BackendDir "node_modules"
if (Test-Path $nodeModulesDir) {
    $modCount = (Get-ChildItem $nodeModulesDir -Directory | Measure-Object).Count
    Write-OK "node_modules" "Present ($modCount top-level packages)"
} else {
    Write-FAIL "node_modules" "NOT FOUND - Run: cd $BackendDir && npm install"
}

# Check for prisma CLI specifically
if (Test-Path $PrismaCli) {
    Write-OK "Local prisma CLI" "$PrismaCli"
} elseif (Test-Path ($PrismaCli -replace "\.cmd$", "")) {
    Write-OK "Local prisma CLI" "$($PrismaCli -replace '\.cmd$', '') (no .cmd extension)"
} else {
    # Try .ps1 variant
    $prismaPs1 = Join-Path $BackendDir "node_modules\.bin\prisma"
    if (Test-Path $prismaPs1) {
        Write-OK "Local prisma CLI" "$prismaPs1"
    } else {
        Write-FAIL "Local prisma CLI" "NOT FOUND at $PrismaCli - Run npm install"
    }
}

# Check for @nestjs/common to verify NestJS deps installed
$nestCommon = Join-Path $BackendDir "node_modules\@nestjs\common"
if (Test-Path $nestCommon) {
    Write-OK "@nestjs/common"  "Present"
} else {
    Write-WARN "@nestjs/common" "NOT FOUND - node_modules may be incomplete"
}

# ---------------------------------------------------------------------------
# CHECK 4: Prisma version (CRITICAL - must be 5.x)
# ---------------------------------------------------------------------------
Write-Header "CHECK 4: Prisma Version (MUST be 5.x)"

Push-Location $BackendDir
try {
    Write-INFO "Running: npx --no-install prisma --version"
    $versionOutput = npx --no-install prisma --version 2>&1
    $versionExitCode = $LASTEXITCODE

    $versionOutput | ForEach-Object { Write-INFO "  $_" }

    if ($versionExitCode -ne 0) {
        Write-FAIL "Prisma version" "Command failed (exit $versionExitCode). Is prisma in node_modules?"
    } else {
        # Parse version
        $prismaLine = ($versionOutput | Where-Object { $_ -match "^prisma\s*:" }) -replace "^prisma\s*:\s*", ""
        if ([string]::IsNullOrWhiteSpace($prismaLine)) {
            $prismaLine = ($versionOutput | Select-String -Pattern "\d+\.\d+\.\d+" | Select-Object -First 1).ToString()
        }

        $majorStr = ($prismaLine.Trim() -split "\.")[0] -replace "[^0-9]", ""
        if ([string]::IsNullOrWhiteSpace($majorStr)) {
            Write-FAIL "Prisma version parse" "Could not parse major version from: '$prismaLine'"
        } else {
            $majorInt = [int]$majorStr
            if ($majorInt -eq 5) {
                Write-OK "Prisma version" "$prismaLine [CORRECT - major=5]"
            } elseif ($majorInt -ge 7) {
                Write-FAIL "Prisma version" "$prismaLine [WRONG - major=$majorInt, need 5.x] STOP: DO NOT PROCEED"
                Write-Host ""
                Write-Host "CRITICAL: Prisma $prismaLine was detected." -ForegroundColor Red
                Write-Host "This repository requires Prisma 5.10.x." -ForegroundColor Red
                Write-Host "Investigate why node_modules is resolving Prisma $majorInt." -ForegroundColor Red
                Write-Host "DO NOT run the implementation script until Prisma 5.x is confirmed." -ForegroundColor Red
                Write-Host ""
            } else {
                Write-WARN "Prisma version" "$prismaLine (major=$majorInt - unexpected, need 5)"
            }
        }
    }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# CHECK 5: Schema BOM inspection
# ---------------------------------------------------------------------------
Write-Header "CHECK 5: Schema BOM Status and Content"

if (Test-Path $SchemaFile) {
    $schemaBytes = [System.IO.File]::ReadAllBytes($SchemaFile)
    $fileSize = $schemaBytes.Length

    if ($schemaBytes.Length -ge 3 -and $schemaBytes[0] -eq 0xEF -and $schemaBytes[1] -eq 0xBB -and $schemaBytes[2] -eq 0xBF) {
        Write-FAIL "Schema BOM" "UTF-8 BOM DETECTED at bytes 0-2 (EF BB BF). MUST be removed before running migration."
    } else {
        Write-OK "Schema BOM" "NO BOM - Clean UTF-8 [CORRECT]"
    }

    Write-INFO "Schema file size: $fileSize bytes"

    # Read content and count lines
    $schemaContent = [System.IO.File]::ReadAllText($SchemaFile, [System.Text.Encoding]::UTF8)
    $lineCount = ($schemaContent -split "`n").Count
    Write-INFO "Schema line count: $lineCount"

    # Check for V2 contamination
    $v2Models = @("model Learner", "model LearningMaterial", "model LearningEvidence",
                  "model ContentChapter", "model ContentTopic", "model ContentChunk",
                  "model ConceptChunk", "model ConceptRelationship", "model DocumentPage")
    $v2Found = @()
    foreach ($v2m in $v2Models) {
        if ($schemaContent -match [regex]::Escape($v2m) + "\s*\{") {
            $v2Found += $v2m
        }
    }
    if ($schemaContent -match "\nmodel Concept\s*\{" -or $schemaContent -match "^model Concept\s*\{") {
        $v2Found += "model Concept"
    }
    if ($schemaContent -match "\nmodel Document\s*\{" -or $schemaContent -match "^model Document\s*\{") {
        $v2Found += "model Document"
    }

    if ($v2Found.Count -gt 0) {
        Write-WARN "V2 model contamination" "V2 models already in schema: $($v2Found -join ', ')"
        Write-INFO "If you see V2 models, schema was already modified. Restore from backup."
    } else {
        Write-OK "Schema baseline" "CLEAN - No V2 models present [CORRECT]"
    }

    # Check required legacy models
    $legacy = @("Child", "ConceptAtom", "LearningSession", "Parent", "Subject", "Phase", "Module", "Topic", "SessionEvent")
    $missingLegacy = @()
    foreach ($lm in $legacy) {
        if ($schemaContent -notmatch "model $lm\s*\{") { $missingLegacy += $lm }
    }
    if ($missingLegacy.Count -gt 0) {
        Write-FAIL "Legacy models" "Missing: $($missingLegacy -join ', ')"
    } else {
        Write-OK "Legacy models" "All $($legacy.Count) present: $($legacy -join ', ')"
    }

    # Show first 5 lines of schema
    Write-INFO "Schema header (first 5 lines):"
    $schemaContent -split "`n" | Select-Object -First 5 | ForEach-Object { Write-INFO "  $_" }
}

# ---------------------------------------------------------------------------
# CHECK 6: Baseline build
# ---------------------------------------------------------------------------
Write-Header "CHECK 6: Baseline Build (npm run build)"

Write-INFO "NOTE: This is a READ-ONLY baseline check."
Write-INFO "      Pre-existing TypeScript errors are captured but NOT fixed."
Write-INFO "      Running: npm run build"

Push-Location $BackendDir
try {
    $buildOutput = npm run build 2>&1
    $buildExitCode = $LASTEXITCODE

    if ($buildExitCode -eq 0) {
        Write-OK "Baseline build" "PASSED"
        Write-INFO "Build output (last 10 lines):"
        $buildOutput | Select-Object -Last 10 | ForEach-Object { Write-INFO "  $_" }
    } else {
        Write-WARN "Baseline build" "FAILED (exit code $buildExitCode) - pre-existing errors captured"
        Write-INFO "Build errors (these must be documented before proceeding with V2):"
        $buildOutput | ForEach-Object { Write-INFO "  $_" }
    }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
Write-Header "PRE-FLIGHT SUMMARY"

Write-Host ""
Write-Host ("  Passed : {0}" -f $Pass)  -ForegroundColor Green
Write-Host ("  Failed : {0}" -f $Fail)  -ForegroundColor $(if ($Fail -gt 0) { "Red" } else { "Green" })
Write-Host ("  Warnings: {0}" -f $Warns.Count) -ForegroundColor Yellow

if ($Warns.Count -gt 0) {
    Write-Host ""
    Write-Host "  Warnings:" -ForegroundColor Yellow
    $Warns | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
}

Write-Host ""

if ($Fail -eq 0) {
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host " PRE-FLIGHT PASSED" -ForegroundColor Green
    Write-Host " It is SAFE to run the implementation script." -ForegroundColor Green
    Write-Host " Command:" -ForegroundColor Green
    Write-Host "   .\scripts\phase-2-1a-learning-library-implement.ps1" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host " PRE-FLIGHT FAILED - DO NOT RUN IMPLEMENTATION SCRIPT" -ForegroundColor Red
    Write-Host " Fix the failures above before proceeding." -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    exit 1
}
