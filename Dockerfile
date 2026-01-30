# Builder stage: install deps and build the frontend
FROM node:20-slim AS builder
WORKDIR /app

# Copy package manifests and source
COPY package.json package-lock.json* ./
COPY . .

# Install dependencies (including dev) and build the frontend
RUN npm install
RUN npm run build

# Production stage: only runtime deps + built frontend
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copy package manifest and install production deps only
COPY package.json package-lock.json* ./
RUN npm install --only=production

# Copy built frontend and server/backend code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.cjs ./server.cjs
COPY --from=builder /app/backend ./backend

# Expose the backend port. Use 3001 so it matches the default
# backend constant and makes the container predictable.
EXPOSE 3001
ENV PORT=3001

CMD ["node", "./server.cjs"]
