#!/bin/bash

# ============================================================================
# AI Coaching Integration - Test Commands
# Usage: chmod +x test-ai-coaching.sh && ./test-ai-coaching.sh
# ============================================================================

set -e

API_GATEWAY="http://localhost:8080"
N8N_WEBHOOK="http://localhost:5678/webhook/ai-fitness"
EMAIL="runner@example.com"
PASSWORD="RunSwim123"

echo "🚀 Starting AI Coaching Integration Tests..."
echo ""

# ============================================================================
# Step 1: Get JWT Token
# ============================================================================

echo "📝 Step 1: Getting JWT Token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
  echo "❌ Failed to get JWT token"
  exit 1
fi

echo "✅ JWT Token: ${JWT_TOKEN:0:50}..."
echo ""

# Extract userId from token (assuming it's in response)
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.id // .userId // 1' 2>/dev/null)
echo "User ID: $USER_ID"
echo ""

# ============================================================================
# Step 2: Test n8n Webhook Directly
# ============================================================================

echo "🔗 Step 2: Testing n8n Webhook Directly..."
N8N_REQUEST='{
  "message": "Tạo lịch 7 ngày cho chạy và bơi",
  "userId": "'$USER_ID'",
  "context": {
    "profile": { "name": "Test User", "age": 30 },
    "activity": { "weeklyRunKm": 25, "weeklySwimMeters": 5000 }
  }
}'

echo "Sending to n8n: $N8N_REQUEST"
N8N_RESPONSE=$(curl -s -X POST "$N8N_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$N8N_REQUEST")

echo "n8n Response:"
echo "$N8N_RESPONSE" | jq '.' 2>/dev/null || echo "$N8N_RESPONSE"
echo ""

# ============================================================================
# Step 3: Test AI Chat Endpoint via API Gateway
# ============================================================================

echo "💬 Step 3: Testing AI Chat Endpoint..."
CHAT_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/ai/chat" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"message\": \"Hôm nay nên chạy hay bơi?\",
    \"context\": \"Weekly run 25 km, swim 5000 m\"
  }")

echo "AI Chat Response:"
echo "$CHAT_RESPONSE" | jq '.' 2>/dev/null || echo "$CHAT_RESPONSE"
echo ""

# ============================================================================
# Step 4: Test Chat History
# ============================================================================

echo "📚 Step 4: Getting Chat History..."
HISTORY_RESPONSE=$(curl -s -X GET "$API_GATEWAY/api/ai/chat/$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Chat History:"
echo "$HISTORY_RESPONSE" | jq '.' 2>/dev/null || echo "$HISTORY_RESPONSE"
echo ""

# ============================================================================
# Step 5: Test Insights
# ============================================================================

echo "📊 Step 5: Getting AI Insights..."
INSIGHTS_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/ai/insights" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"weeklyRunKm\": 20,
    \"weeklySwimMeters\": 3000
  }")

echo "AI Insights Response:"
echo "$INSIGHTS_RESPONSE" | jq '.' 2>/dev/null || echo "$INSIGHTS_RESPONSE"
echo ""

echo "✅ All tests completed!"
echo ""
echo "Summary:"
echo "- ✅ JWT Token obtained"
echo "- ✅ n8n Webhook tested"
echo "- ✅ AI Chat endpoint tested"
echo "- ✅ Chat History retrieved"
echo "- ✅ Insights generated"
