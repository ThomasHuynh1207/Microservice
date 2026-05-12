# ============================================================================
# AI Coaching Integration - Services Restart Guide
# ============================================================================

## 🚀 Quick Start

### 1. Full Fresh Start (Recommended)
```powershell
# Stop everything
docker compose down -v

# Rebuild and start
docker compose up -d --build

# Wait for services to be healthy (2-3 minutes)
docker ps
```

### 2. Restart Only AI-Related Services
```powershell
# Restart n8n (workflow engine)
docker restart n8n

# Restart ai-service
docker restart ai-service

# Verify services are running
docker ps | findstr "n8n\|ai-service"
```

### 3. Reload n8n Workflow
```powershell
# Import workflow
docker exec n8n n8n import:workflow --input=/workflows/ai-fitness.json

# Activate workflow  
docker exec n8n n8n update:workflow --id=ai-fitness --active=true

# Verify
docker exec n8n n8n list:workflows
```

## 📊 Health Checks

### Check n8n Health
```powershell
# Test n8n is running
curl http://localhost:5678/

# Test webhook endpoint
curl -X POST http://localhost:5678/webhook/ai-fitness `
  -H "Content-Type: application/json" `
  -d '{
    "message": "Test",
    "userId": 1,
    "context": {}
  }'
```

### Check AI Service Health
```powershell
# Check API Gateway health
curl http://localhost:8080/api/auth/me `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check AI Service directly (if exposed)
curl http://localhost:8085/actuator/health
```

### Check Database Connection
```powershell
# Check if databases exist
docker exec postgres psql -U runswim -d postgres -c "\l"

# Check ai_chat_messages table
docker exec postgres psql -U runswim -d aidb -c "\dt ai_chat_messages"
```

## 🔍 Logs Monitoring

### Real-time Logs
```powershell
# n8n logs
docker logs -f n8n

# AI Service logs
docker logs -f ai-service

# API Gateway logs
docker logs -f api-gateway

# Database logs
docker logs -f postgres
```

### Search Logs for Errors
```powershell
# Find errors in n8n
docker logs n8n 2>&1 | findstr "ERROR\|error\|fail"

# Find errors in ai-service
docker logs ai-service 2>&1 | findstr "ERROR\|error\|fail"
```

## 🧪 Testing

### Test All Components
```powershell
# Run PowerShell test script
.\test-ai-coaching.ps1

# Or run individual tests
# Step 1: Get JWT token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"email":"runner@example.com","password":"RunSwim123"}'

# Step 2: Test n8n webhook
$jwt = $loginResponse.token
Invoke-RestMethod -Uri "http://localhost:5678/webhook/ai-fitness" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"message":"Test","userId":1,"context":{}}'

# Step 3: Test AI Chat
Invoke-RestMethod -Uri "http://localhost:8080/api/ai/chat" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "application/json"
  } `
  -Body '{"userId":1,"message":"Hôm nay nên chạy hay bơi?","context":""}'
```

## 🔧 Troubleshooting

### Issue: n8n webhook returns 404
```powershell
# Solution: Check if workflow is imported and active
docker exec n8n n8n list:workflows

# If not active, import it
docker exec n8n n8n import:workflow --input=/workflows/ai-fitness.json
docker exec n8n n8n update:workflow --id=ai-fitness --active=true

# Restart n8n
docker restart n8n
```

### Issue: "Gemini API key is not configured"
```powershell
# Solution: Check .env file has GEMINI_API_KEY
type .env | findstr "GEMINI_API_KEY"

# If missing, add it to .env and restart
docker restart ai-service
```

### Issue: n8n returns 502 Bad Gateway
```powershell
# Solution: n8n might be starting or out of memory
docker logs n8n

# Wait 30 seconds and try again, or restart
docker restart n8n

# Wait for it to be healthy
docker ps --filter "name=n8n"
```

### Issue: "Connection refused" to ai-service
```powershell
# Solution: Service might not be ready yet
docker logs ai-service | Select-Object -Last 20

# Wait for database migration to complete
Start-Sleep -Seconds 10

# Restart ai-service
docker restart ai-service
```

## 📝 Configuration Files

### Update .env Settings
```powershell
# Edit .env
notepad .env

# Changes to make (if needed):
# AI_PROVIDER=n8n                              # Use n8n
# N8N_AI_WEBHOOK_URL=http://n8n:5678/webhook/ai-fitness
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-2.5-flash

# Restart services to apply
docker compose restart ai-service n8n
```

### Update Workflow
```powershell
# Edit workflow (if needed)
code n8n\workflows\ai-fitness.json

# Reimport workflow
docker exec n8n n8n import:workflow --input=/workflows/ai-fitness.json --overwrite

# Activate
docker exec n8n n8n update:workflow --id=ai-fitness --active=true
```

## 🧹 Cleanup

### Remove Old Data
```powershell
# Stop containers
docker compose down

# Remove volumes (⚠️ This deletes all data!)
docker volume rm runswim_postgres_data runswim_n8n_data

# Restart fresh
docker compose up -d --build
```

### Clear Chat History (Keep Database)
```powershell
# Connect to database
docker exec -it postgres psql -U runswim -d aidb

# Delete all chat messages
# DELETE FROM ai_chat_messages;

# Exit
# \q
```

## 📱 Frontend Testing

### Access from Browser
```
Frontend: http://localhost:3000
Login: runner@example.com / RunSwim123
Navigate to: AI Coach section
```

### Test AI Responses
1. Open http://localhost:3000
2. Login
3. Go to **AI Coach** page
4. Type question: "Tạo lịch 7 ngày cho chạy và bơi"
5. Wait for response (should come from n8n + Gemini)
6. Check response provider in Network tab or browser console

## 🎯 Expected Behavior

### When Everything Works ✅
- Frontend loads AI Coach page
- User can type messages
- Response appears within 5-10 seconds
- Provider shows: "n8n-gemini" (preferred) or "direct-gemini" (fallback) or "local-endurance-coach" (fallback)
- Chat history is saved

### Debug Response Provider
```javascript
// Open browser console (F12)
// You'll see in responses:
// {"reply":"...", "provider":"n8n-gemini"} ✅ n8n working
// {"reply":"...", "provider":"direct-gemini"} ⚠️ n8n failed, using Gemini API
// {"reply":"...", "provider":"local-endurance-coach"} ⚠️ Both failed, using local rules
```

## 📞 Quick Support

### Restart Everything
```powershell
docker compose down -v && docker compose up -d --build
```

### Check All Services Status
```powershell
docker ps
```

### View Recent Logs
```powershell
docker logs -f ai-service --tail 50
```

### Run Integration Test
```powershell
.\test-ai-coaching.ps1
```

---

**Questions? Check logs first!** 🔍
```powershell
docker logs -f n8n
docker logs -f ai-service
```
