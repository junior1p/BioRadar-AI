# BioTender GLM API PowerShell Test
# 用法: .\test-glm-curl.ps1 YOUR_API_KEY

param(
    [string]$ApiKey = "your-api-key"
)

$endpoint = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

Write-Host "🧪 Testing GLM API with PowerShell..." -ForegroundColor Cyan
Write-Host "API Key: $($ApiKey.Substring(0,10))...$($ApiKey.Substring($ApiKey.Length-10))" -ForegroundColor Yellow
Write-Host "Endpoint: $endpoint" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ApiKey"
}

$body = @{
    model = "glm-5"
    messages = @(
        @{
            role = "user"
            content = "用一句话解释什么是AlphaFold"
        }
    )
    thinking = @{
        type = "enabled"
    }
    max_tokens = 4096
    temperature = 1.0
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending request..."

try {
    $response = Invoke-WebRequest -Uri $endpoint `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "📥 Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    
    $content = $response.Content | ConvertFrom-Json
    
    if ($content.choices -and $content.choices[0].message) {
        Write-Host "✅ GLM API Connection SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Response:" -ForegroundColor Cyan
        Write-Host "───────────────────────────────────────"
        Write-Host $content.choices[0].message.content
        Write-Host "───────────────────────────────────────"
        Write-Host ""
        Write-Host "✨ Your API Key is valid and ready to use!" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected response format:" -ForegroundColor Red
        Write-Host ($content | ConvertTo-Json)
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check your internet connection"
    Write-Host "  2. Verify API Key is correct"
    Write-Host "  3. Ensure your account has sufficient balance"
    Write-Host "  4. Check if GLM API is accessible in your region"
}
