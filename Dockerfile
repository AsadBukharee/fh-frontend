# Install dependencies only when needed
FROM node:18-alpine AS deps
WORKDIR /app

# Install openssl if you have Prisma or similar requirements
RUN apk add --no-cache openssl

COPY package.json package-lock.json* pnpm-lock.yaml* bun.lockb* ./

# Install dependencies
RUN npm install

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js app
RUN npm run build

# Production image, copy only necessary files
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Optional — if using next/image with static exports
ENV NEXT_TELEMETRY_DISABLED 1

# Copy only the built output and package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
