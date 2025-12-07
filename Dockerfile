##############################
# Stage 1: Build React (Vite)
##############################
FROM node:20-alpine AS frontend-build

WORKDIR /app/client

# Build argument for Maps API key
ARG VITE_MAPS_API_KEY
ENV VITE_MAPS_API_KEY=$VITE_MAPS_API_KEY

# Copy client package files
COPY client/package*.json ./
RUN npm ci

# Copy client source
COPY client/ ./

# Build frontend
RUN npm run build

##############################
# Stage 2: Build Server
##############################
FROM node:20-alpine AS server-build

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/
COPY shared/ ./shared/

WORKDIR /app/server
RUN npm ci

# Copy server source
COPY server/src ./src
COPY server/prisma ./prisma
COPY server/tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

##############################
# Stage 3: Production Runtime
##############################
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install production dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy built server
COPY --from=server-build /app/server/dist ./dist

# Copy built frontend (served as static files)
COPY --from=frontend-build /app/client/dist ./public

# Copy shared types
COPY shared/ ./shared/

# Copy start script
COPY server/start.sh ./start.sh
RUN chmod +x /app/start.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set proper permissions
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

USER nodejs

# Environment
ENV NODE_ENV=production

EXPOSE 8080

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["/app/start.sh"]
