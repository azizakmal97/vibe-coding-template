# Opens a Chrome profile with no window and waits for its Claude extension to connect.
# Run it BEFORE `claude -p --chrome`: claude only sees browsers connected when it starts, so a
# Chrome the job opens itself never attaches.
# If Chrome is already open with that profile, nothing visible happens.
#   powershell -NoProfile -ExecutionPolicy Bypass -File ensure-chrome.ps1 -ProfileDirectory "Profile 4"
param([Parameter(Mandatory = $true)][string]$ProfileDirectory)

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) { Write-Output "ensure-chrome: Chrome not found at $chrome"; exit 1 }
Start-Process $chrome -ArgumentList "--profile-directory=`"$ProfileDirectory`"", "--no-startup-window"
# Measured 2026-11-04: the extension connects within 20 s of a cold start.
Start-Sleep -Seconds 25
Write-Output "ensure-chrome: $ProfileDirectory open"
