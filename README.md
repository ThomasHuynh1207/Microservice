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
| activity-service | 8083 | Run/swim activity journal, stats, challenges |
| ai-service | 8085 | Local AI endurance coach and chat history |
| nutrition-service | 8086 | Nutrition plan, meal log, macro summary |
| eureka-server | 8761 | Service registry |
| postgres | 5432 | PostgreSQL databases per service |
| pgAdmin | 5050 | Database UI |

## Run

```powershell
docker compose up -d --build
```

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

Athlete:

- `GET /api/athletes/{userId}`
- `PUT /api/athletes/{userId}`
- `POST /api/athletes/{userId}/onboarding`
- `GET /api/athletes/leaderboard`

Activity:

- `GET /api/activities/user/{userId}`
- `POST /api/activities`
- `GET /api/activities/stats/{userId}`
- `GET /api/activities/challenges`

Nutrition:

- `GET /api/nutrition/{userId}/plan`
- `PUT /api/nutrition/{userId}/plan`
- `GET /api/nutrition/{userId}/meals`
- `POST /api/nutrition/meals`
- `GET /api/nutrition/{userId}/summary`
- `GET /api/nutrition/library`

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

Each service uses Hibernate `ddl-auto: update` for development schema creation.
