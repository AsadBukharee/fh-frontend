# Step 1: Use a specific node image with required version
FROM node:22.16.0-alpine AS base

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Set working directory
WORKDIR /app

# Install dependencies in separate step
COPY package*.json ./
COPY .npmrc .npmrc

# Install npm version 11.4.2 specifically
RUN npm install -g npm@11.4.2

# Install dependencies
RUN npm ci

# Copy rest of the application
COPY . .

# Build the app (production build)
RUN npm run build

# Step 2: Use a smaller image for serving the app
FROM node:22.16.0-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create app directory
WORKDIR /app

# Copy only necessary files from the build step
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Expose the port used by the app
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
