# RunSwim Club Microservices

RunSwim Club is a Strava-inspired training support website focused on **running** and **swimming**. The old gym/workout/admin domain has been removed and the project now uses Spring Boot microservices, PostgreSQL, Eureka, an API Gateway, and a React frontend.

Reference used for product direction: Strava onboarding/login page at https://www.strava.com/onboarding.

## Services

| Service | Port | Responsibility |
| --- | ---: | --- |
| frontend | 3000 | React onboarding, training dashboard, activity logging, nutrition, AI coach |
| api-gateway | 8080 | Routes `/api/**` and validates JWT |
| auth-service | 8081 | Register, login, JWT, demo account |
| athlete-service | 8082 | Athlete profile, onboarding, leaderboard |
| activity-service | 8083 | Run/swim activity journal, stats |
| ai-service | 8085 | Local AI endurance coach and chat history |
| nutrition-service | 8086 | Nutrition plan, meal log, macro summary |
| payment-service | 8088 | PayPal payment processing, transaction history |
| eureka-server | 8761 | Service registry |
| postgres | 5432 | PostgreSQL databases per service |
| pgAdmin | 5050 | Database UI |

## Run

```powershell
docker compose down -v
docker compose up -d --build
```
tài khoản paypal: microservice123@gmail.com, mk:Nam12345 
Open:

- Web app: http://localhost:3000
- Gateway: http://localhost:8080
- Eureka: http://localhost:8761
- pgAdmin: http://localhost:5050

Demo login:

- `runner@example.com`
- `RunSwim123`

If you previously ran the old project and want a completely fresh database:

```powershell
docker compose down -v
docker compose up -d --build
```

## API Surface

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users/{userId}/premium-status`

Payment:

- `POST /api/payments/paypal/create-order`
- `POST /api/payments/paypal/capture/{orderId}`
- `GET /api/payments/users/{userId}/history`
- `GET /api/payments/users/{userId}/premium-status`

Athlete:

- `GET /api/athletes/{userId}`
- `PUT /api/athletes/{userId}`
- `POST /api/athletes/{userId}/onboarding`
- `GET /api/athletes/leaderboard`
- `GET /api/athletes/{userId}/following`
- `POST /api/athletes/{userId}/follow/{targetId}`
- `DELETE /api/athletes/{userId}/follow/{targetId}`

Activity:

- `GET /api/activities/user/{userId}`
- `GET /api/activities/{id}`
- `POST /api/activities`
- `PUT /api/activities/{id}?userId={userId}`
- `DELETE /api/activities/{id}?userId={userId}`
- `GET /api/activities/stats/{userId}`

Nutrition:

- `GET /api/nutrition/{userId}/plan`
- `PUT /api/nutrition/{userId}/plan`
- `GET /api/nutrition/{userId}/meals`
- `POST /api/nutrition/meals`
- `GET /api/nutrition/{userId}/summary`
- `GET /api/nutrition/library`
- `POST /api/nutrition/{userId}/water`
- `GET /api/nutrition/{userId}/water/today`

AI:

- `POST /api/ai/chat`
- `GET /api/ai/chat/{userId}`
- `POST /api/ai/insights`

## PostgreSQL

`init.sql` creates one database per service:

- `authdb`
- `athletedb`
- `activitydb`
- `nutritiondb`
- `aidb`
- `paymentdb`

Each service uses Hibernate `ddl-auto: update` for development schema creation.

## PayPal Integration

PayPal Sandbox credentials are pre-configured in docker-compose.yml.

Test buyer account (to use in PayPal sandbox checkout):

- Email: `microservice123@gmail.com`
- Password: `Nam12345`

The payment flow: frontend calls `/api/auth/payments/paypal/create-order` → PayPal JS SDK (or button) collects buyer payment → frontend calls `/api/auth/payments/paypal/capture/{orderId}` → backend marks `premiumActive = true` on the user account.

## New Features

- **MapLibre GL JS** — interactive map on the Maps page using OpenFreeMap tiles (no API key required)
- **GPS Tracking** — live Geolocation API tracking during run activity logging; distance and duration auto-filled on stop
- **Water Tracking** — daily water intake log with progress bar on Nutrition page
- **Analytics Charts** — recharts BarChart/LineChart for weekly distance and calories (premium)
- **Profile Page** — badges, personal records, history
- **Premium with PayPal** — real PayPal sandbox integration
