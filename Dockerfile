# Railway Free Tier - Single service: API + static frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json (workspaces config)
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Build the React frontend
RUN cd client && npm run build

# --- Production stage ---
FROM node:18-alpine

WORKDIR /app

# Copy server with production deps only
COPY server/package.json ./server/
RUN cd server && npm install --production

# Copy server source
COPY --from=builder /app/server/src/ ./server/src/
COPY --from=builder /app/server/migrations/ ./server/migrations/

# Copy built React frontend
COPY --from=builder /app/client/dist/ ./client/dist/

# Railway sets PORT env var
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/src/start.js"]
