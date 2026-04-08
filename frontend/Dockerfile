# Stage 1: Build the React application
FROM node:20.11.1-alpine3.19 AS builder

WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Cleanup
RUN rm -rf node_modules .npmrc

# Stage 2: Serve with Nginx
FROM nginx:1.27.0-alpine3.19

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl && rm -rf /var/cache/apk/*

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/50x.html

# Create non-root user for nginx
RUN addgroup -g 9999 -S nginx-app && adduser -S -D -H -u 9999 -h /var/cache/nginx -s /sbin/nologin -G nginx-app -g nginx-app nginx-app
# USER nginx-app

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
