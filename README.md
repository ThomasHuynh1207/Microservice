# Spring Boot Microservices
http://localhost:3000 (User Frontend)
http://localhost:3001 (Admin Frontend - yeu cau dang nhap)
## Overview
docker compose up -d --build
## Default Admin Login

- admin@gmail.com / admin12345
- nguyenvanb@gmail.com / Nam12345

## Target Microservices Architecture

### Services Overview
1. **API Gateway** (Port 8080) - Routes requests and validates JWT
2. **Auth Service** (Port 8081) - User authentication, JWT generation, and admin user management APIs (`/api/admin/**`)
3. **User Service** (Port 8082) - User profiles and information
4. **Workout Service** (Port 8083) - Workout plans and sessions
5. **Progress Service** (Port 8084) - Progress tracking and logs
6. **AI Service** (Port 8085) - Chatbot using OpenAI API
7. **Nutrition Service** (Port 8086) - Meal plans and nutrition tracking

### Database per Service
- **auth-service**: `users` table
- **user-service**: `users`, `user_profile` tables
- **workout-service**: `workout_plan`, `workout_session` tables
- **progress-service**: `progress_log` table
- **ai-service**: `chat_history` table

## Step-by-Step Migration

### Step 1: Create API Gateway
✅ **COMPLETED**

**Files Created:**
- `Microservice/api-gateway/pom.xml`
- `Microservice/api-gateway/src/main/java/.../ApiGatewayApplication.java`
- `Microservice/api-gateway/src/main/java/.../config/JwtAuthenticationFilter.java`
- `Microservice/api-gateway/src/main/resources/application.yml`

**Key Components:**
- Spring Cloud Gateway for routing
- JWT validation filter
- Routes: `/api/auth/**` → auth-service, `/api/users/**` → user-service, etc.

**To Run:**
```bash
cd Microservice/api-gateway
mvn spring-boot:run
```

### Step 2: Create Auth Service
✅ **COMPLETED**

**Files Created:**
- `Microservice/auth-service/pom.xml`
- `Microservice/auth-service/src/main/java/.../AuthServiceApplication.java`
- `Microservice/auth-service/src/main/java/.../entity/User.java`
- `Microservice/auth-service/src/main/java/.../dto/LoginRequest.java`
- `Microservice/auth-service/src/main/java/.../dto/RegisterRequest.java`
- `Microservice/auth-service/src/main/java/.../repository/UserRepository.java`
- `Microservice/auth-service/src/main/java/.../service/AuthService.java`
- `Microservice/auth-service/src/main/java/.../controller/AuthController.java`
- `Microservice/auth-service/src/main/resources/application.yml`

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with JWT generation

**To Run:**
```bash
cd Microservice/auth-service
mvn spring-boot:run
```

### Step 3: Create User Service
✅ **COMPLETED**

**Files Created:**
- `Microservice/user-service/pom.xml`
- `Microservice/user-service/src/main/java/.../UserServiceApplication.java`
- `Microservice/user-service/src/main/java/.../entity/User.java`
- `Microservice/user-service/src/main/java/.../entity/UserProfile.java`
- `Microservice/user-service/src/main/java/.../dto/UserDTO.java`
- `Microservice/user-service/src/main/java/.../dto/UserProfileDTO.java`
- `Microservice/user-service/src/main/java/.../repository/UserRepository.java`
- `Microservice/user-service/src/main/java/.../repository/UserProfileRepository.java`
- `Microservice/user-service/src/main/java/.../service/UserService.java`
- `Microservice/user-service/src/main/java/.../controller/UserController.java`
- `Microservice/user-service/src/main/java/.../client/AuthServiceClient.java`
- `Microservice/user-service/src/main/resources/application.yml`

**Endpoints:**
- `GET /api/users/{id}` - Get user info
- `PUT /api/users/{id}` - Update user info
- `GET /api/users/{id}/profile` - Get user profile
- `PUT /api/users/{id}/profile` - Update/create user profile

**To Run:**
```bash
cd Microservice/user-service
mvn spring-boot:run
```

### Step 4: Create Workout Service
✅ **COMPLETED**

**Files Created:**
- `Microservice/workout-service/pom.xml`
- `Microservice/workout-service/src/main/java/.../WorkoutServiceApplication.java`
- `Microservice/workout-service/src/main/java/.../entity/WorkoutPlan.java`
- `Microservice/workout-service/src/main/java/.../entity/WorkoutSession.java`
- `Microservice/workout-service/src/main/java/.../dto/WorkoutPlanDTO.java`
- `Microservice/workout-service/src/main/java/.../dto/WorkoutSessionDTO.java`
- `Microservice/workout-service/src/main/java/.../repository/WorkoutPlanRepository.java`
- `Microservice/workout-service/src/main/java/.../repository/WorkoutSessionRepository.java`
- `Microservice/workout-service/src/main/java/.../service/WorkoutService.java`
- `Microservice/workout-service/src/main/java/.../controller/WorkoutController.java`
- `Microservice/workout-service/src/main/java/.../client/UserServiceClient.java`
- `Microservice/workout-service/src/main/resources/application.yml`

**Endpoints:**
- `GET /api/workouts/plans/user/{userId}` - Get user's workout plans
- `POST /api/workouts/plans` - Create workout plan
- `PUT /api/workouts/plans/{id}` - Update workout plan
- `GET /api/workouts/sessions/user/{userId}` - Get user's workout sessions
- `POST /api/workouts/sessions` - Start workout session
- `PUT /api/workouts/sessions/{id}/end` - End workout session

**To Run:**
```bash
cd Microservice/workout-service
mvn spring-boot:run
```

### Step 5: Create Progress Service
✅ **COMPLETED**

**Files Created:**
- `Microservice/progress-service/pom.xml`
- `Microservice/progress-service/src/main/java/.../ProgressServiceApplication.java`
- `Microservice/progress-service/src/main/java/.../entity/ProgressLog.java`
- `Microservice/progress-service/src/main/java/.../dto/ProgressLogDTO.java`
- `Microservice/progress-service/src/main/java/.../repository/ProgressLogRepository.java`
- `Microservice/progress-service/src/main/java/.../service/ProgressService.java`
- `Microservice/progress-service/src/main/java/.../controller/ProgressController.java`
- `Microservice/progress-service/src/main/java/.../client/UserServiceClient.java`
- `Microservice/progress-service/src/main/resources/application.yml`

**Endpoints:**
- `GET /api/progress/user/{userId}` - Get user's progress logs
- `GET /api/progress/user/{userId}/range?startDate=...&endDate=...` - Get progress in date range
- `POST /api/progress` - Create progress log
- `PUT /api/progress/{id}` - Update progress log

**To Run:**
```bash
cd Microservice/progress-service
mvn spring-boot:run
```

### Step 6: Create AI Service
✅ **COMPLETED**

**Files Created:**
- `Microservice/ai-service/pom.xml`
- `Microservice/ai-service/src/main/java/.../AiServiceApplication.java`
- `Microservice/ai-service/src/main/java/.../entity/ChatMessage.java`
- `Microservice/ai-service/src/main/java/.../dto/ChatMessageDTO.java`
- `Microservice/ai-service/src/main/java/.../dto/ChatRequestDTO.java`
- `Microservice/ai-service/src/main/java/.../repository/ChatMessageRepository.java`
- `Microservice/ai-service/src/main/java/.../service/AiService.java`
- `Microservice/ai-service/src/main/java/.../controller/AiController.java`
- `Microservice/ai-service/src/main/java/.../client/UserServiceClient.java`
- `Microservice/ai-service/src/main/resources/application.yml`

**Endpoints:**
- `POST /api/ai/chat` - Send message to AI chatbot
- `GET /api/ai/chat/history/{userId}` - Get chat history

**To Run:**
```bash
cd Microservice/ai-service
mvn spring-boot:run
```

## Running All Services

### Prerequisites
- Java 17+
- Maven 3.6+

### Sample Data Seeding

- Auth Service se tu dong tao tai khoan mau (USER + ADMIN) voi mat khau BCrypt.
- User Service se tu dong tao ho so nguoi dung mau.
- Workout Service se tu dong tao ke hoach tap va buoi tap mau.
- Progress Service se tu dong tao nhat ky tien do 7 ngay gan nhat.
- AI Service se tu dong tao lich su hoi thoai mau neu bang chat_history chua co du lieu.

### Start Order
1. Start API Gateway: `cd Microservice/api-gateway && mvn spring-boot:run`
2. Start Auth Service: `cd Microservice/auth-service && mvn spring-boot:run`
3. Start User Service: `cd Microservice/user-service && mvn spring-boot:run`
4. Start Workout Service: `cd Microservice/workout-service && mvn spring-boot:run`
5. Start Progress Service: `cd Microservice/progress-service && mvn spring-boot:run`
6. Start AI Service: `cd Microservice/ai-service && mvn spring-boot:run`

### Testing the Services

1. **Register a user:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. **Use JWT token for authenticated requests:**
```bash
curl -X GET http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Migration

Each service uses H2 in-memory database for simplicity. For production:
1. Change to MySQL/PostgreSQL in `application.yml`
2. Create separate databases for each service
3. Run database migration scripts

## Next Steps

1. **Add Service Discovery** (Eureka)
2. **Add Circuit Breaker** (Resilience4j)
3. **Add API Documentation** (SpringDoc OpenAPI)
4. **Add Monitoring** (Spring Boot Actuator, Micrometer)
5. **Add Docker** (Dockerfiles, docker-compose.yml)
6. **Add CI/CD** pipelines

## Architecture Benefits

- **Scalability**: Scale individual services independently
- **Technology Diversity**: Use different technologies per service
- **Team Autonomy**: Teams can work on different services
- **Fault Isolation**: Failure in one service doesn't affect others
- **Independent Deployment**: Deploy services independently

## Security Considerations

- JWT tokens are validated at the gateway
- Services extract role claims from JWT and enforce authorization locally
- Each service has its own database
- Inter-service communication via Feign clients

