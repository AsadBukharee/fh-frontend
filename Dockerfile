# ---------------------
# 1. Base dependencies
# ---------------------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./

# ---------------------
# 2. Install dependencies
# ---------------------
FROM base AS deps
RUN npm ci --omit=dev

# ---------------------
# 3. Build stage
# ---------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------
# 4. Runtime image
# ---------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.* ./   # next.config.js/ts
COPY --from=builder /app/tailwind.config.* ./  # if needed
COPY --from=builder /app/postcss.config.* ./   # if needed

EXPOSE 3000
CMD ["npm", "run", "start"]
