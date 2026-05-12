# AI Coaching Integration with n8n Workflow

## Overview (Tổng Quan)

Hệ thống AI Coaching của bạn được tích hợp giữa **ai-service** (Spring Boot) và **n8n workflow** (ai-fitness) để cung cấp:
- Trò chuyện AI Coach với Gemini API
- Tích hợp context từ profile, activity, nutrition của user
- Guardrails để filter câu hỏi không liên quan
- Fallback đến Gemini API trực tiếp nếu n8n fail

---

## Architecture Flow

```
┌─────────────────┐
│   React Frontend│  POST /api/ai/chat (userId, message, context)
└────────┬────────┘
         │
┌────────▼────────────────┐
│   API Gateway (8080)    │  JWT validation
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│   AI Service (8085)     │  /api/ai/chat endpoint
│  - AiCoachService       │
└────────┬────────────────┘
         │
    ┌────▼─────────────────────────────────────┐
    │ Choose Provider based on AI_PROVIDER env │
    └────┬────────────────────────────────────┘
         │
    ┌─────────────────────────────────────────┐
    │ If provider = "n8n":                    │
    │ POST http://n8n:5678/webhook/ai-fitness│ (trong Docker)
    │                                          │
    └────┬─────────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │   n8n Workflow: AI Fitness Gemini     │
    │   - Webhook → Parse → Build Context   │
    │   - Prompt Engineering → Guardrail    │
    │   - Call Gemini API → Output Filter   │
    │   - Respond to Webhook                │
    └────┬──────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │   Gemini API Response                 │
    │   (candidates[0].content.parts[0])    │
    └────┬──────────────────────────────────┘
         │
    Return → AiCoachService → API Gateway → Frontend
```

---

## Key Components

### 1. AI Service Configuration

**File:** `ai-service/src/main/resources/application.yml`

```yaml
app:
  ai:
    provider: ${AI_PROVIDER:local}  # "n8n" hoặc "local"
    n8n-webhook-url: ${N8N_AI_WEBHOOK_URL:http://localhost:5678/webhook/ai-fitness}
    gemini-api-key: ${GEMINI_API_KEY:}
    gemini-model: ${GEMINI_MODEL:gemini-2.5-flash}
```

### 2. Environment Variables

**File:** `.env`

```env
# AI Provider Setting
AI_PROVIDER=n8n

# n8n Webhook URL (cho Docker: http://n8n:5678)
N8N_AI_WEBHOOK_URL=http://n8n:5678/webhook/ai-fitness

# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### 3. AI Coach Service Flow

**File:** `ai-service/src/main/java/com/tuan/aiservice/service/AiCoachService.java`

```java
public ChatResponse chat(ChatRequest request) {
    // 1. Save user message
    save(request.userId(), "user", request.message());
    
    // 2. Generate reply via provider
    GeneratedReply generatedReply = generateReply(request);
    
    // 3. Save assistant response
    save(request.userId(), "assistant", generatedReply.reply());
    
    return new ChatResponse(generatedReply.reply(), generatedReply.provider());
}

private GeneratedReply generateReply(ChatRequest request) {
    if (isN8nProvider()) {
        // Try n8n first
        Optional<String> n8nReply = requestN8n(request);
        if (n8nReply.isPresent()) {
            return new GeneratedReply(n8nReply.get(), "n8n-gemini");
        }
        
        // Fallback to direct Gemini
        Optional<String> geminiReply = requestGemini(request);
        if (geminiReply.isPresent()) {
            return new GeneratedReply(geminiReply.get(), "direct-gemini");
        }
        
        // Final fallback to local rules
        return new GeneratedReply(coachReply(...), "local-endurance-coach");
    }
    
    return new GeneratedReply(coachReply(...), "local-endurance-coach");
}
```

### 4. n8n Workflow Nodes

**File:** `n8n/workflows/ai-fitness.json`

| Node | Purpose | Input | Output |
|------|---------|-------|--------|
| **Webhook** | Listen POST requests | `/webhook/ai-fitness` | body data |
| **Parse & Validate** | Validate message field | body | validated JSON |
| **Build Context** | Enrich with profile/activity/nutrition | context object | systemContext |
| **Prompt Engineering** | Create system + user prompt | message + context | fullPrompt |
| **Input Guardrail** | Filter non-fitness questions | message | pass/reject |
| **Gemini API** | Call Gemini model | fullPrompt | candidates array |
| **Output Filter** | Extract text answer | Gemini response | clean answer |
| **Respond to Webhook** | Return to ai-service | answer | HTTP 200 response |

---

## API Endpoints

### Chat Endpoint

```
POST /api/ai/chat
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "userId": 1,
  "message": "Tạo lịch 7 ngày cho chạy và bơi",
  "context": {
    "profile": { "name": "John", "age": 30 },
    "activity": { "weeklyRunKm": 25, "weeklySwimMeters": 5000 },
    "nutrition": { "dailyCalories": 2500 }
  }
}
```

**Response:**
```json
{
  "reply": "Dựa trên thông tin của bạn...",
  "provider": "n8n-gemini"  // hoặc "direct-gemini" hoặc "local-endurance-coach"
}
```

### Chat History Endpoint

```
GET /api/ai/chat/{userId}
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "role": "user",
    "content": "Tạo lịch 7 ngày...",
    "createdAt": "2026-05-13T10:30:00Z"
  },
  {
    "id": 2,
    "userId": 1,
    "role": "assistant",
    "content": "Dựa trên thông tin...",
    "createdAt": "2026-05-13T10:30:05Z"
  }
]
```

### Insights Endpoint

```
POST /api/ai/insights
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "weeklyRunKm": 20,
  "weeklySwimMeters": 3000
}
```

**Response:**
```json
{
  "recommendation": "Tăng running gently..."
}
```

---

## How to Test

### 1. Via Frontend (UI)

1. Mở http://localhost:3000
2. Đăng nhập với: `runner@example.com` / `RunSwim123`
3. Vào trang **AI Coach**
4. Gõ câu hỏi: "Tạo lịch 7 ngày cho chạy và bơi"
5. Xem response từ AI

### 2. Via cURL

```bash
# Get JWT token first
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "runner@example.com",
    "password": "RunSwim123"
  }'

# Extract token từ response

# Send chat message
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "message": "Hôm nay nên chạy hay bơi?",
    "context": {
      "weeklyRunKm": 25,
      "weeklySwimMeters": 5000
    }
  }'
```

### 3. Via n8n Dashboard

1. Mở http://localhost:5678
2. Vào **Workflows** → **AI Fitness Gemini Orchestrator**
3. Click **Test**
4. Gửi test request:
```json
{
  "message": "Ăn gì trước buổi tempo?",
  "userId": "test-user",
  "context": {}
}
```

---

## Troubleshooting

### Issue 1: "n8n webhook call failed"

**Giải pháp:**
- Kiểm tra n8n running: `docker ps | grep n8n`
- Kiểm tra logs: `docker logs n8n`
- Xác minh webhook URL trong `.env` có đúng không
- Test URL trực tiếp: `curl http://localhost:5678/webhook/ai-fitness`

### Issue 2: "Gemini API key is not configured"

**Giải pháp:**
- Thêm `GEMINI_API_KEY` vào `.env`
- Restart ai-service: `docker restart ai-service`

### Issue 3: Response không return đúng format

**Giải pháp:**
- Check Output Filter node trong n8n
- Verify response structure:
```json
{
  "success": true,
  "answer": "...",
  "model": "gemini-2.5-flash"
}
```

### Issue 4: Workflow không active

**Giải pháp:**
```bash
# Import workflow
docker exec n8n n8n import:workflow --input=/workflows/ai-fitness.json

# Activate workflow
docker exec n8n n8n update:workflow --id=ai-fitness --active=true
```

---

## Provider Priority

System sử dụng provider theo thứ tự:

1. **n8n** (nếu `AI_PROVIDER=n8n`)
   - ✅ Nếu webhook thành công → trả về kết quả
   - ❌ Nếu webhook fail → fallback bước 2

2. **Direct Gemini API** (fallback từ n8n)
   - ✅ Nếu API key configured → trả về kết quả
   - ❌ Nếu không → fallback bước 3

3. **Local Rules** (final fallback)
   - Sử dụng hardcoded rules based on keywords
   - Không cần API calls

---

## Performance Considerations

| Component | Timeout | Notes |
|-----------|---------|-------|
| n8n Webhook | 75 seconds | Default timeout |
| Gemini API | 75 seconds | Default timeout |
| DB Query | N/A | Chat history là sync query |

**Optimization Tips:**
- Cache chat history locally (frontend side)
- Implement pagination cho /api/ai/chat/{userId}
- Add rate limiting nếu cần (vd: 5 requests/min)

---

## Database Schema

**Table:** `ai_chat_messages`

```sql
CREATE TABLE ai_chat_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role VARCHAR(20) NOT NULL,        -- "user" or "assistant"
  content VARCHAR(4000) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_id ON ai_chat_messages(user_id);
CREATE INDEX idx_created_at ON ai_chat_messages(created_at);
```

---

## Integration Checklist

- ✅ n8n workflow deployed (`ai-fitness.json`)
- ✅ Environment variables configured (`.env`)
- ✅ AI Service running (port 8085)
- ✅ Gemini API key added
- ✅ n8n webhook URL correct
- ✅ Database tables initialized
- ✅ Frontend calls `/api/ai/chat`
- ✅ JWT token validation working
- ⭕ Test from Frontend UI
- ⭕ Monitor logs for errors

---

## Next Steps

1. **Test thực tế** từ frontend UI
2. **Monitor logs** từ n8n và ai-service:
   ```bash
   docker logs -f n8n
   docker logs -f ai-service
   ```
3. **Optimize prompts** nếu kết quả không tốt
4. **Add metrics** cho usage tracking (optional)
5. **Set up alerting** nếu webhook fails

---

## References

- [n8n Documentation](https://docs.n8n.io)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Spring Boot WebClient](https://docs.spring.io/spring-framework/reference/web/webflux-webclient.html)
