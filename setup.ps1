#!/usr/bin/env pwsh
# Vibe Coding Template — Global Claude Code Setup
# Installs the global brain, auto-push hook, and minimal settings.
#
# Run from the repo root:  .\setup.ps1

$ErrorActionPreference = "Stop"

$homeDir    = $env:USERPROFILE
$claudeDir  = Join-Path $homeDir ".claude"
$hooksDir   = Join-Path $claudeDir "hooks"
$scriptDir  = $PSScriptRoot

Write-Host "`nVibe Coding Template — Global Claude Code Setup" -ForegroundColor Cyan
Write-Host "Installing to: $claudeDir`n" -ForegroundColor DarkGray

# Ensure ~/.claude/hooks/ exists
New-Item -ItemType Directory -Force -Path $hooksDir | Out-Null

function Install-File($src, $dest, $label) {
    if (Test-Path $dest) {
        $backup = "$dest.bak"
        Copy-Item $dest $backup -Force
        Write-Host "  backed up existing $label -> $(Split-Path $backup -Leaf)" -ForegroundColor DarkGray
    }
    Copy-Item $src $dest -Force
    Write-Host "  [OK] $label" -ForegroundColor Green
}

# 1. Global brain
Install-File `
    (Join-Path $scriptDir "global-setup\CLAUDE.md") `
    (Join-Path $claudeDir "CLAUDE.md") `
    "~/.claude/CLAUDE.md"

# 2. Auto-push hook
Install-File `
    (Join-Path $scriptDir "global-setup\hooks\post-commit-push.mjs") `
    (Join-Path $hooksDir "post-commit-push.mjs") `
    "~/.claude/hooks/post-commit-push.mjs"

# 3. settings.json — only if not already there
$destSettings = Join-Path $claudeDir "settings.json"
if (Test-Path $destSettings) {
    Write-Host "  [SKIP] ~/.claude/settings.json already exists — keeping your config" -ForegroundColor Yellow
    Write-Host "         To add the auto-push hook, see global-setup/settings.example.json" -ForegroundColor DarkGray
} else {
    $hookPath = ($hooksDir -replace '\\', '/') + "/post-commit-push.mjs"
    $settings = [ordered]@{
        permissions = [ordered]@{ defaultMode = "auto" }
        hooks = [ordered]@{
            PostToolUse = @(
                [ordered]@{
                    matcher = "Bash"
                    hooks   = @(
                        [ordered]@{
                            type    = "command"
                            command = "node `"$hookPath`""
                        }
                    )
                }
            )
        }
    }
    $settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $destSettings -Encoding utf8NoBOM
    Write-Host "  [OK] ~/.claude/settings.json (minimal — auto mode + auto-push)" -ForegroundColor Green
}

Write-Host "`nDone! Restart Claude Code for changes to take effect." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. claude login                   # sign in" -ForegroundColor DarkGray
Write-Host "  2. git clone <your-project-repos> # .claude/ rules come with the clone" -ForegroundColor DarkGray
Write-Host "  3. Open a project in Claude Code  # rules auto-load every session" -ForegroundColor DarkGray
Write-Host ""
