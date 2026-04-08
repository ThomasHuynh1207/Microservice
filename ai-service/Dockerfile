# ====================== Build Stage ======================
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml trước để cache dependencies (tăng tốc build)
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress

# Copy source code và build
COPY src ./src
RUN mvn clean package -DskipTests -B --no-transfer-progress

# ====================== Runtime Stage ======================
FROM eclipse-temurin:17-jre-alpine AS runtime

# Tạo user không root để tăng bảo mật
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy JAR từ build stage
COPY --from=build /app/target/*.jar app.jar

# Thay đổi quyền sở hữu
RUN chown -R appuser:appgroup /app

# Chạy với user không root
USER appuser

# Expose port (đồng bộ với application.yml)
EXPOSE 8085

# JVM flags tối ưu cho container
ENV JAVA_OPTS="\
    -XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseG1GC \
    -Dspring.profiles.active=docker"

# Entry point
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]