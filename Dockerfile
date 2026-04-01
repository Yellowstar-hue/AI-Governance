# AISafe Platform - Railway Deployment
# Multi-stage build: compile TypeScript, build React, run production

# ---- Stage 1: Build Backend ----
FROM node:18-alpine AS backend-builder

WORKDIR /app/Servers
COPY Servers/package.json Servers/package-lock.json* ./
RUN npm install

COPY Servers/ ./
RUN npm run build

# ---- Stage 2: Build Frontend ----
FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY version.json ./
COPY shared/ ./shared/

WORKDIR /app/Clients
COPY Clients/package.json Clients/package-lock.json* ./
RUN npm install

COPY Clients/ ./
RUN npm run build-dev

# ---- Stage 3: Production ----
FROM node:18-alpine

WORKDIR /app/Servers

# Install production deps only
COPY Servers/package.json Servers/package-lock.json* ./
RUN npm install --production && npm cache clean --force

# Copy compiled backend
COPY --from=backend-builder /app/Servers/dist/ ./dist/
COPY --from=backend-builder /app/Servers/database/ ./database/
COPY --from=backend-builder /app/Servers/structures/ ./structures/
COPY --from=backend-builder /app/Servers/scripts/ ./scripts/
COPY --from=backend-builder /app/Servers/.sequelizerc ./.sequelizerc
COPY --from=backend-builder /app/Servers/SQL_Commands.sql ./SQL_Commands.sql

# Copy built frontend
COPY --from=frontend-builder /app/Clients/dist/ ./public/

# Copy shared
COPY --from=frontend-builder /app/shared/ /app/shared/

# Copy patches if they exist
COPY Servers/patches/ ./patches/

ENV NODE_ENV=production
EXPOSE 3000

# Start: run migrations then start server
CMD ["sh", "-c", "npx sequelize db:migrate --debug && node dist/index.js"]
