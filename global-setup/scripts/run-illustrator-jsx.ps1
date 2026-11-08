# Run an ExtendScript (.jsx) in Adobe Illustrator with no "run this script?" dialog.
#   powershell -NoProfile -File ~/.claude/scripts/run-illustrator-jsx.ps1 <script.jsx>
# Never start Illustrator.exe with a .jsx argument: that path shows a confirmation
# dialog the owner must click (owner, 2026-11-08). COM's DoJavaScriptFile runs silently.
param([Parameter(Mandatory = $true)][string]$Script)
$path = (Resolve-Path $Script).Path
$illustrator = New-Object -ComObject Illustrator.Application
$illustrator.UserInteractionLevel = -1  # aiDontDisplayAlerts
$result = $illustrator.DoJavaScriptFile($path)
if ($result) { Write-Output $result }
