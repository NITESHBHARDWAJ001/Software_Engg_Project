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

CMD ["sh", "-c", "prisma db push --accept-data-loss --skip-generate && node src/server.js"]
