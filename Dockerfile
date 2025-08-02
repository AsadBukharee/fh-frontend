# Step 1: Base image with correct node version
FROM node:22.16.0-alpine AS base

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install dependencies cleanly
COPY package*.json ./

# Optional: Remove `.npmrc` if not used
# COPY .npmrc .npmrc

# Use specified npm version
RUN npm install -g npm@11.4.2

# Install app deps
RUN npm ci

# Copy rest of the app
COPY . .

# Build for production
RUN npm run build

# Step 2: Runtime image
FROM node:22.16.0-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Copy from builder
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
