# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies first for better build cache.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source and Prisma schema.
COPY prisma ./prisma
COPY src ./src
COPY docs ./docs

# Generate Prisma client for runtime.
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO- http://127.0.0.1:4000/health/live || exit 1

CMD ["npm", "run", "start:docker"]
