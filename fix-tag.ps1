$filePath = "components\submit-button.tsx"
$content = Get-Content -Path $filePath -Raw
$fixedContent = $content.Replace("</o>", "</output>")
Set-Content -Path $filePath -Value $fixedContent
Write-Host "File updated successfully."