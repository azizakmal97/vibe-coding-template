# Closes Chrome tabs by title when Claude in Chrome cannot (a tab in another session's
# tab group, or one frozen behind "Leave site?"). Works through Windows UI Automation,
# so it needs no focus and no extension. Confirms Chrome's "Delete group" and "Leave" prompts.
#   powershell -NoProfile -ExecutionPolicy Bypass -File close-chrome-tab.ps1 -TitleLike "Meta Business Suite*"
# Prints one line per tab still open afterwards, so the caller can check the result.
param([Parameter(Mandatory = $true)][string]$TitleLike)

Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$automation = [System.Windows.Automation.AutomationElement]
$scope = [System.Windows.Automation.TreeScope]
$invoke = [System.Windows.Automation.InvokePattern]::Pattern
$isTab = New-Object System.Windows.Automation.PropertyCondition($automation::ControlTypeProperty, [System.Windows.Automation.ControlType]::TabItem)
$isButton = New-Object System.Windows.Automation.PropertyCondition($automation::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)

function Get-ChromeWindows {
  $automation::RootElement.FindAll($scope::Children, [System.Windows.Automation.Condition]::TrueCondition) |
    Where-Object { $_.Current.ClassName -eq 'Chrome_WidgetWin_1' -and $_.Current.Name -like '*Google Chrome' }
}

function Confirm-ChromePrompt {
  foreach ($window in Get-ChromeWindows) {
    foreach ($button in $window.FindAll($scope::Descendants, $isButton)) {
      if ($button.Current.ClassName -eq 'MdTextButton' -and @('Delete group', 'Leave') -contains $button.Current.Name) {
        $button.GetCurrentPattern($invoke).Invoke()
        return $true
      }
    }
  }
  return $false
}

$closed = 0
foreach ($window in Get-ChromeWindows) {
  foreach ($tab in $window.FindAll($scope::Descendants, $isTab)) {
    if ($tab.Current.Name -notlike $TitleLike) { continue }
    $closeButton = $tab.FindAll($scope::Descendants, $isButton) | Where-Object { $_.Current.ClassName -eq 'TabCloseButton' } | Select-Object -First 1
    if (-not $closeButton) { continue }
    $closeButton.GetCurrentPattern($invoke).Invoke()
    $closed++
    # Up to two prompts can follow one close: "Delete group", then "Leave site?".
    foreach ($attempt in 1..2) { Start-Sleep -Seconds 2; if (-not (Confirm-ChromePrompt)) { break } }
  }
}

Start-Sleep -Seconds 1
Write-Output "close-chrome-tab: asked $closed tab(s) to close"
foreach ($window in Get-ChromeWindows) {
  foreach ($tab in $window.FindAll($scope::Descendants, $isTab)) { Write-Output ("open: " + $tab.Current.Name) }
}
