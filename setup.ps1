#!/usr/bin/env pwsh
# Vibe Coding Template — Global Agent Setup
# Installs the global brain, auto-push hook, and minimal settings.
#
# Run from the repo root:
#   .\setup.ps1                  # Claude Code + ZCode (default)
#   .\setup.ps1 -Agent claude    # Claude Code only
#   .\setup.ps1 -Agent zcode     # ZCode only
#
# On macOS / Linux the ZCode half runs on its own:
#   node global-setup/zcode/install-zcode.mjs

param(
    [ValidateSet("both", "claude", "zcode")]
    [string]$Agent = "both"
)

$ErrorActionPreference = "Stop"

$homeDir    = $env:USERPROFILE
$claudeDir  = Join-Path $homeDir ".claude"
$hooksDir   = Join-Path $claudeDir "hooks"
$scriptDir  = $PSScriptRoot

function Install-File($src, $dest, $label) {
    if (Test-Path $dest) {
        $backup = "$dest.bak"
        Copy-Item $dest $backup -Force
        Write-Host "  backed up existing $label -> $(Split-Path $backup -Leaf)" -ForegroundColor DarkGray
    }
    Copy-Item $src $dest -Force
    Write-Host "  [OK] $label" -ForegroundColor Green
}

if ($Agent -in @("both", "claude")) {
    Write-Host "`nVibe Coding Template — Global Claude Code Setup" -ForegroundColor Cyan
    Write-Host "Installing to: $claudeDir`n" -ForegroundColor DarkGray

    New-Item -ItemType Directory -Force -Path $hooksDir | Out-Null

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
}

# ZCode ignores hooks declared in a workspace config, so its guardrails have to be
# registered once per machine. The Node installer merges them into ~/.zcode/cli/config.json.
if ($Agent -in @("both", "zcode")) {
    & node (Join-Path $scriptDir "global-setup\zcode\install-zcode.mjs")
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nERROR: ZCode setup failed (exit $LASTEXITCODE). Claude Code setup above is unaffected." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host "`nDone! Restart your agent for changes to take effect." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. claude login                   # sign in (Claude Code)" -ForegroundColor DarkGray
Write-Host "  2. git clone <your-project-repos> # .claude/ + .zcode/ rules come with the clone" -ForegroundColor DarkGray
Write-Host "  3. Open a project                 # rules auto-load every session" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Using ZCode? Read template/.zcode/README.md — its hooks need a per-project" -ForegroundColor DarkGray
Write-Host "plugin install, and you should verify they fire before trusting them." -ForegroundColor DarkGray
Write-Host ""
