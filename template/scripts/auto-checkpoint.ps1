#!/usr/bin/env pwsh
# Auto-checkpoint script — OPTIONAL belt+suspenders mode.
# Off by default. Enable only during active refactor windows for guaranteed
# disk persistence every N minutes.
#
# Trade-off: commits broken intermediate states. Easy to `git reset` later.
#
# Scheduled Task usage (every 5 min):
#   schtasks /create /tn "auto-checkpoint" /tr "pwsh -File C:\path\to\repo\scripts\auto-checkpoint.ps1" /sc minute /mo 5
#
# One-shot usage:
#   pwsh scripts\auto-checkpoint.ps1

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$dirty = git status --porcelain 2>$null
if (-not $dirty) {
    exit 0
}

# Only commit when PROGRESS.md has 🟡 in-progress phase
if (Test-Path "PROGRESS.md") {
    $progress = Get-Content "PROGRESS.md" -Raw
    if ($progress -notmatch "🟡") {
        exit 0
    }
}

$timestamp = (Get-Date).ToString("o")

try {
    git add -A
    git commit --no-verify -m "auto-checkpoint: $timestamp" | Out-Null
    Write-Host "[auto-checkpoint] $timestamp"
} catch {
    # swallow; we run on a cron, do not crash
    Write-Host "[auto-checkpoint] failed: $($_.Exception.Message)"
}
