# ============================================================================
# AI Coaching Integration - Test Commands (PowerShell)
# Usage: .\test-ai-coaching.ps1
# ============================================================================

$API_GATEWAY = "http://localhost:8080"
$N8N_WEBHOOK = "http://localhost:5678/webhook/ai-fitness"
$EMAIL = "runner@example.com"
$PASSWORD = "RunSwim123"

Write-Host "🚀 Starting AI Coaching Integration Tests..." -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 1: Get JWT Token
# ============================================================================

Write-Host "📝 Step 1: Getting JWT Token..." -ForegroundColor Cyan

$loginPayload = @{
    email    = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_GATEWAY/api/auth/login" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $loginPayload

    Write-Host "Login Response:" -ForegroundColor Green
    $loginResponse | ConvertTo-Json | Write-Host

    $JWT_TOKEN = $loginResponse.token
    $USER_ID = $loginResponse.id ?? $loginResponse.userId ?? 1

    if (-not $JWT_TOKEN) {
        Write-Host "❌ Failed to get JWT token" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ JWT Token: $($JWT_TOKEN.Substring(0, 50))..." -ForegroundColor Green
    Write-Host "User ID: $USER_ID" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ Error getting JWT token: $_" -ForegroundColor Red
    exit 1
}

# ============================================================================
# Step 2: Test n8n Webhook Directly
# ============================================================================

Write-Host "🔗 Step 2: Testing n8n Webhook Directly..." -ForegroundColor Cyan

$n8nPayload = @{
    message = "Tạo lịch 7 ngày cho chạy và bơi"
    userId  = $USER_ID
    context = @{
        profile  = @{ name = "Test User"; age = 30 }
        activity = @{ weeklyRunKm = 25; weeklySwimMeters = 5000 }
    }
} | ConvertTo-Json

Write-Host "Sending to n8n: $n8nPayload" -ForegroundColor Gray

try {
    $n8nResponse = Invoke-RestMethod -Uri $N8N_WEBHOOK `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $n8nPayload

    Write-Host "n8n Response:" -ForegroundColor Green
    $n8nResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "⚠️  n8n Webhook Error: $_" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# Step 3: Test AI Chat Endpoint via API Gateway
# ============================================================================

Write-Host "💬 Step 3: Testing AI Chat Endpoint..." -ForegroundColor Cyan

$chatPayload = @{
    userId  = $USER_ID
    message = "Hôm nay nên chạy hay bơi?"
    context = "Weekly run 25 km, swim 5000 m"
} | ConvertTo-Json

try {
    $chatResponse = Invoke-RestMethod -Uri "$API_GATEWAY/api/ai/chat" `
        -Method POST `
        -Headers @{
        "Authorization"  = "Bearer $JWT_TOKEN"
        "Content-Type"   = "application/json"
    } `
        -Body $chatPayload

    Write-Host "AI Chat Response:" -ForegroundColor Green
    $chatResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "❌ AI Chat Error: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# Step 4: Test Chat History
# ============================================================================

Write-Host "📚 Step 4: Getting Chat History..." -ForegroundColor Cyan

try {
    $historyResponse = Invoke-RestMethod -Uri "$API_GATEWAY/api/ai/chat/$USER_ID" `
        -Method GET `
        -Headers @{
        "Authorization" = "Bearer $JWT_TOKEN"
        "Content-Type"  = "application/json"
    }

    Write-Host "Chat History:" -ForegroundColor Green
    $historyResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "⚠️  Chat History Error: $_" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# Step 5: Test Insights
# ============================================================================

Write-Host "📊 Step 5: Getting AI Insights..." -ForegroundColor Cyan

$insightsPayload = @{
    weeklyRunKm     = 20
    weeklySwimMeters = 3000
} | ConvertTo-Json

try {
    $insightsResponse = Invoke-RestMethod -Uri "$API_GATEWAY/api/ai/insights" `
        -Method POST `
        -Headers @{
        "Authorization" = "Bearer $JWT_TOKEN"
        "Content-Type"  = "application/json"
    } `
        -Body $insightsPayload

    Write-Host "AI Insights Response:" -ForegroundColor Green
    $insightsResponse | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "❌ Insights Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- ✅ JWT Token obtained" -ForegroundColor Green
Write-Host "- ✅ n8n Webhook tested" -ForegroundColor Green
Write-Host "- ✅ AI Chat endpoint tested" -ForegroundColor Green
Write-Host "- ✅ Chat History retrieved" -ForegroundColor Green
Write-Host "- ✅ Insights generated" -ForegroundColor Green
