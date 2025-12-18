# Script to remove Groq API key from git history
# This will rewrite git history - use with caution!
#
# IMPORTANT: Before running this script:
# 1. Make sure you have a backup of your repository
# 2. Coordinate with your team if this is a shared repository
# 3. Consider rotating the exposed API key after removing it from history

# Provide the secret via environment variable SECRET_TO_REMOVE to avoid hardcoding.
$secret = $env:SECRET_TO_REMOVE
if (-not $secret) {
    Write-Host "ERROR: Set SECRET_TO_REMOVE to the leaked value before running." -ForegroundColor Red
    exit 1
}
$replacement = "YOUR_SECRET_HERE"

Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "REMOVING SECRET FROM GIT HISTORY" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will rewrite your git history!" -ForegroundColor Red
Write-Host "Make sure you have a backup and coordinate with your team." -ForegroundColor Red
Write-Host ""

# Skip confirmation in non-interactive mode
try {
    $confirm = Read-Host "Type 'YES' to continue"
    if ($confirm -ne "YES") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit
    }
} catch {
    Write-Host "Running in non-interactive mode. Proceeding automatically..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Removing secret from git history..." -ForegroundColor Green

# Create filter script in temp directory (accessible from anywhere)
$tempDir = $env:TEMP
$tempScript = Join-Path $tempDir "git-filter-secret-remove.ps1"
# Convert to forward slashes for git filter-branch compatibility
$tempScriptUnix = $tempScript -replace '\\', '/'

# Create the filter script
@"
`$secret = '$($secret -replace "'", "''")'
`$replacement = '$($replacement -replace "'", "''")'

`$files = @('filter-secret.ps1', 'remove-secret.ps1', 'src/lib/ai-providers.js')
foreach (`$file in `$files) {
    if (Test-Path `$file) {
        `$content = Get-Content `$file -Raw -ErrorAction SilentlyContinue
        if (`$content) {
            `$content = `$content -replace [regex]::Escape(`$secret), `$replacement
            `$content | Set-Content `$file -NoNewline
        }
    }
}
"@ | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "Created filter script at: $tempScript" -ForegroundColor Gray

# Use git filter-branch with the script
# Escape the path properly for git filter-branch
$env:FILTER_BRANCH_SQUELCH_WARNING = "1"
# Use the Windows path with double backslashes for proper escaping
$escapedPath = $tempScript -replace '\\', '\\\\'
$filterCmd = "powershell -ExecutionPolicy Bypass -NoProfile -File `"$escapedPath`""
Write-Host "Running: git filter-branch with script: $tempScript" -ForegroundColor Gray
git filter-branch --force --tree-filter $filterCmd --prune-empty --tag-name-filter cat -- --all

# Clean up
Remove-Item $tempScript -ErrorAction SilentlyContinue
Write-Host "Cleaned up temporary script." -ForegroundColor Gray

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Secret removed from history!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify the changes: git log --all --full-history -- filter-secret.ps1" -ForegroundColor White
Write-Host "2. Clean up backup refs: git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin" -ForegroundColor White
Write-Host "3. Force push to update remote: git push origin --force --all" -ForegroundColor White
Write-Host ""
Write-Host "WARNING: Force push will rewrite remote history!" -ForegroundColor Red
Write-Host "Make sure to coordinate with your team before force pushing." -ForegroundColor Red
Write-Host ""
Write-Host "IMPORTANT: Rotate your Groq API key immediately!" -ForegroundColor Red
Write-Host "The exposed key should be considered compromised." -ForegroundColor Red
