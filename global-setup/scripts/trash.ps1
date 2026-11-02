# Sends files or folders to the Recycle Bin (restorable), never a permanent delete.
# Agents clean their own leftovers (rejected drafts, rebuildable render output) without asking, but only
# inside the folders in TRASH_ROOTS (semicolon-separated, e.g. "D:\Code\;D:\Work\") or Downloads.
#   powershell -NoProfile -File ~/.claude/scripts/trash.ps1 <path> [<path> ...]
param([Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)][string[]]$Paths)

Add-Type -AssemblyName Microsoft.VisualBasic
$allowedRoots = @((Join-Path $env:USERPROFILE 'Downloads\')) + @($env:TRASH_ROOTS -split ';' | Where-Object { $_ })
$failed = 0

foreach ($path in $Paths) {
    $full = [System.IO.Path]::GetFullPath($path)
    if (-not ($allowedRoots | Where-Object { $full.StartsWith($_, [StringComparison]::OrdinalIgnoreCase) })) {
        Write-Error "Refused (outside D:\Programming, D:\Kerja, Downloads): $full"; $failed++; continue
    }
    if ($full -match '\\\.git(\\|$)') { Write-Error "Refused (.git): $full"; $failed++; continue }
    if (Test-Path -LiteralPath $full -PathType Container) {
        [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($full, 'OnlyErrorDialogs', 'SendToRecycleBin')
    } elseif (Test-Path -LiteralPath $full -PathType Leaf) {
        [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($full, 'OnlyErrorDialogs', 'SendToRecycleBin')
    } else {
        Write-Error "Not found: $full"; $failed++; continue
    }
    Write-Output "Recycled: $full"
}
exit $failed
