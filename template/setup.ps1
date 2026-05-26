#!/usr/bin/env pwsh
# VibeCoding Template Setup Script — Windows / PowerShell
# Usage: .\setup.ps1 [preset]            # positional, e.g. setup.ps1 web
#        .\setup.ps1 -Preset web         # named
#   preset: web | mobile | desktop | fullstack (asks interactively if omitted)

param(
    [Parameter(Position = 0)][string]$Preset = "",
    [string]$TemplateDir = $PSScriptRoot
)

$ProjectDir = (Get-Location).Path

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js: $nodeVersion" -ForegroundColor DarkGray
} catch {
    Write-Host ""
    Write-Host "ERROR: Node.js not found." -ForegroundColor Red
    Write-Host "  Hooks + scripts require Node.js." -ForegroundColor Red
    Write-Host "  Install from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Continue setup anyway? (y/N)"
    if ($confirm -ne 'y') { exit 1 }
}

Write-Host ""
Write-Host "VibeCoding Template Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Project: $ProjectDir" -ForegroundColor Gray
Write-Host "Template: $TemplateDir" -ForegroundColor Gray
Write-Host ""

if ($ProjectDir -eq $TemplateDir) {
    Write-Host "ERROR: Run this script FROM your project folder, not the template folder." -ForegroundColor Red
    Write-Host "       cd C:\your-new-project; pwsh $TemplateDir\setup.ps1" -ForegroundColor Yellow
    exit 1
}

$dirs = @(
    ".claude\agents",
    ".claude\commands",
    ".claude\hooks",
    ".claude\rules",
    ".claude\skills\design-system",
    ".claude\skills\caveman-default",
    ".cursor\rules",
    ".github\workflows",
    "scripts",
    "docs"
)

Write-Host "Creating directories..." -ForegroundColor Yellow
foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $ProjectDir $dir) | Out-Null
    Write-Host "  + $dir" -ForegroundColor Green
}

# Universal files (non-preset)
$fileMappings = [ordered]@{
    # root docs
    "AGENTS.md"                                       = "AGENTS.md"
    ".cursorrules"                                    = ".cursorrules"
    ".cursor\rules\project.mdc"                       = ".cursor\rules\project.mdc"
    ".windsurfrules"                                  = ".windsurfrules"
    ".github\copilot-instructions.md"                 = ".github\copilot-instructions.md"
    "PROGRESS.md"                                     = "PROGRESS.md"
    # .claude root
    ".claude\settings.json"                           = ".claude\settings.json"
    # agents
    ".claude\agents\code-reviewer.md"                 = ".claude\agents\code-reviewer.md"
    ".claude\agents\debugger.md"                      = ".claude\agents\debugger.md"
    ".claude\agents\test-writer.md"                   = ".claude\agents\test-writer.md"
    ".claude\agents\security-auditor.md"              = ".claude\agents\security-auditor.md"
    ".claude\agents\refactorer.md"                    = ".claude\agents\refactorer.md"
    ".claude\agents\migration-writer.md"              = ".claude\agents\migration-writer.md"
    ".claude\agents\graph-navigator.md"               = ".claude\agents\graph-navigator.md"
    # commands
    ".claude\commands\new-feature.md"                 = ".claude\commands\new-feature.md"
    ".claude\commands\fix-bug.md"                     = ".claude\commands\fix-bug.md"
    ".claude\commands\pr-review.md"                   = ".claude\commands\pr-review.md"
    ".claude\commands\resume.md"                      = ".claude\commands\resume.md"
    ".claude\commands\checkpoint.md"                  = ".claude\commands\checkpoint.md"
    ".claude\commands\graphify.md"                    = ".claude\commands\graphify.md"
    ".claude\commands\next-phase.md"                  = ".claude\commands\next-phase.md"
    ".claude\commands\autonomous.md"                  = ".claude\commands\autonomous.md"
    ".claude\commands\check-ci.md"                    = ".claude\commands\check-ci.md"
    ".claude\commands\audit.md"                       = ".claude\commands\audit.md"
    ".claude\commands\handover.md"                    = ".claude\commands\handover.md"
    ".claude\commands\pre-publish.md"                 = ".claude\commands\pre-publish.md"
    ".claude\commands\forecast-storage.md"            = ".claude\commands\forecast-storage.md"
    ".claude\commands\migrate.md"                     = ".claude\commands\migrate.md"
    ".claude\commands\deploy.md"                      = ".claude\commands\deploy.md"
    # hooks
    ".claude\hooks\validate-command.js"               = ".claude\hooks\validate-command.js"
    ".claude\hooks\post-edit-check.js"                = ".claude\hooks\post-edit-check.js"
    ".claude\hooks\pre-db-migrate.js"                 = ".claude\hooks\pre-db-migrate.js"
    ".claude\hooks\session-start-resume.js"           = ".claude\hooks\session-start-resume.js"
    ".claude\hooks\pre-commit-checkpoint.js"          = ".claude\hooks\pre-commit-checkpoint.js"
    ".claude\hooks\check-file-size.js"                = ".claude\hooks\check-file-size.js"
    ".claude\hooks\post-commit-push.js"               = ".claude\hooks\post-commit-push.js"
    # rules
    ".claude\rules\frontend.md"                       = ".claude\rules\frontend.md"
    ".claude\rules\backend.md"                        = ".claude\rules\backend.md"
    ".claude\rules\database.md"                       = ".claude\rules\database.md"
    ".claude\rules\api.md"                            = ".claude\rules\api.md"
    ".claude\rules\services.md"                       = ".claude\rules\services.md"
    ".claude\rules\refactor.md"                       = ".claude\rules\refactor.md"
    ".claude\rules\testing.md"                        = ".claude\rules\testing.md"
    ".claude\rules\methodology.md"                    = ".claude\rules\methodology.md"
    ".claude\rules\legacy-files.md"                   = ".claude\rules\legacy-files.md"
    ".claude\rules\naming.md"                         = ".claude\rules\naming.md"
    ".claude\rules\token-budget.md"                   = ".claude\rules\token-budget.md"
    # skills
    ".claude\skills\design-system\SKILL.md"           = ".claude\skills\design-system\SKILL.md"
    ".claude\skills\caveman-default\SKILL.md"         = ".claude\skills\caveman-default\SKILL.md"
    # scripts
    "scripts\check-file-sizes.mjs"                    = "scripts\check-file-sizes.mjs"
    "scripts\graphify-bootstrap.mjs"                  = "scripts\graphify-bootstrap.mjs"
    "scripts\init-progress.mjs"                       = "scripts\init-progress.mjs"
    "scripts\pick-preset.mjs"                         = "scripts\pick-preset.mjs"
    "scripts\sync-agent-rules.mjs"                    = "scripts\sync-agent-rules.mjs"
    "scripts\auto-checkpoint.sh"                      = "scripts\auto-checkpoint.sh"
    "scripts\auto-checkpoint.ps1"                     = "scripts\auto-checkpoint.ps1"
    "AUDIT_AND_ROADMAP.template.md"                   = "AUDIT_AND_ROADMAP.template.md"
    "docs\HANDOVER.template.md"                       = "docs\HANDOVER.template.md"
    "docs\ARCHITECTURE_PLAIN.template.md"             = "docs\ARCHITECTURE_PLAIN.template.md"
    "docs\FINDINGS_AND_PLAN_PLAIN.template.md"        = "docs\FINDINGS_AND_PLAN_PLAIN.template.md"
    "docs\LEARN_FULLSTACK.template.md"                = "docs\LEARN_FULLSTACK.template.md"
}

Write-Host ""
Write-Host "Copying universal template files..." -ForegroundColor Yellow

$copied = 0
$missing = 0

foreach ($src in $fileMappings.Keys) {
    $srcPath = Join-Path $TemplateDir $src
    $dstPath = Join-Path $ProjectDir $fileMappings[$src]

    if (Test-Path $srcPath) {
        if (Test-Path $dstPath) {
            Write-Host "  ~ $($fileMappings[$src]) (exists, skipping)" -ForegroundColor DarkYellow
        } else {
            Copy-Item -Path $srcPath -Destination $dstPath -Force
            Write-Host "  + $($fileMappings[$src])" -ForegroundColor Green
            $copied++
        }
    } else {
        Write-Host "  ! Source not found: $src" -ForegroundColor Red
        $missing++
    }
}

# Preset picker
Write-Host ""
Write-Host "Picking project preset..." -ForegroundColor Yellow
$presetArgs = @((Join-Path $TemplateDir "scripts\pick-preset.mjs"))
if ($Preset) { $presetArgs += $Preset }
& node @presetArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: preset picker failed" -ForegroundColor Red
    exit 1
}

# Init PROGRESS.md
Write-Host ""
Write-Host "Initialising PROGRESS.md..." -ForegroundColor Yellow
& node (Join-Path $TemplateDir "scripts\init-progress.mjs")

# Graphify bootstrap
Write-Host ""
Write-Host "Checking codebase for graphify..." -ForegroundColor Yellow
& node (Join-Path $TemplateDir "scripts\graphify-bootstrap.mjs")

# .gitignore
Write-Host ""
Write-Host "Configuring .gitignore..." -ForegroundColor Yellow

$gitignorePath = Join-Path $ProjectDir ".gitignore"
$gitignoreAdditions = @"

# Secrets — never commit these
.env
.env.*
!.env.example

# Claude Code local settings
.claude/settings.local.json
.claude/db-backups/

# E2E (Playwright) artifacts
e2e/.auth/
playwright-report/
test-results/

# Build outputs
dist/
build/
.next/
.vite/

# OS
.DS_Store
Thumbs.db
"@

if (-not (Test-Path $gitignorePath)) {
    Set-Content -Path $gitignorePath -Value $gitignoreAdditions.TrimStart()
    Write-Host "  + .gitignore created" -ForegroundColor Green
} else {
    $existing = Get-Content $gitignorePath -Raw
    if ($existing -notmatch "\.env") {
        Add-Content -Path $gitignorePath -Value $gitignoreAdditions
        Write-Host "  + .gitignore updated" -ForegroundColor Green
    } else {
        Write-Host "  ~ .gitignore already has .env entries" -ForegroundColor DarkYellow
    }
}

$envExamplePath = Join-Path $ProjectDir ".env.example"
if (-not (Test-Path $envExamplePath)) {
    Set-Content -Path $envExamplePath -Value @"
# Copy this file to .env.local and fill in your values
# Never commit .env.local

DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Add your keys below
"@
    Write-Host "  + .env.example created" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Cyan
Write-Host "  Copied:  $copied universal files + preset assets" -ForegroundColor Green
if ($missing -gt 0) {
    Write-Host "  Missing: $missing source files" -ForegroundColor Red
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Edit CLAUDE.md — fill in [BRACKETED] sections" -ForegroundColor White
Write-Host "  2. Edit .claude\skills\design-system\SKILL.md — set colors and fonts" -ForegroundColor White
Write-Host "  3. Read PROGRESS.md — understand the session-resume protocol" -ForegroundColor White
Write-Host "  4. Read AGENTS.md — single source of truth for all AI tools" -ForegroundColor White
Write-Host "  5. git init; git add -A; git commit -m 'chore: initialize project'" -ForegroundColor White
Write-Host ""
Write-Host "Start coding:" -ForegroundColor Yellow
Write-Host "  /new-feature [feature name] — [description]" -ForegroundColor Yellow
Write-Host "  /fix-bug [error or description]" -ForegroundColor Yellow
Write-Host "  /pr-review [branch or PR number]" -ForegroundColor Yellow
Write-Host "  /resume          — restore session state from PROGRESS.md" -ForegroundColor Yellow
Write-Host "  /checkpoint      — verify + commit current work" -ForegroundColor Yellow
Write-Host "  /next-phase      — start next pending phase" -ForegroundColor Yellow
Write-Host "  /autonomous      — loop work unattended (token-aware bail-out)" -ForegroundColor Yellow
Write-Host "  /check-ci        — ingest CI failures as PROGRESS entries" -ForegroundColor Yellow
Write-Host "  /graphify        — update codebase knowledge graph" -ForegroundColor Yellow
Write-Host "  /audit           — generate AUDIT_AND_ROADMAP.md" -ForegroundColor Yellow
Write-Host "  /handover        — refresh plain-English docs/" -ForegroundColor Yellow
Write-Host ""
