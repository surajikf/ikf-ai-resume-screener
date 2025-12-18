$file = "src/lib/ai-providers.js"
if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $content = $content -replace "'YOUR_SECRET_HERE'", ""
    $content | Set-Content $file -NoNewline
}
