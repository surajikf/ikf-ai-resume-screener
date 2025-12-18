# Script to remove API key from git history
$secret = "YOUR_SECRET_HERE"
$file = "src/lib/ai-providers.js"

if (Test-Path $file) {
    $content = Get-Content $file -Raw
    if ($content -match $secret) {
        $content = $content -replace [regex]::Escape("'$secret'"), ""
        $content | Set-Content $file -NoNewline
        Write-Host "Removed secret from $file"
    }
}
