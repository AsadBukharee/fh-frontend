FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Native deps
RUN apk add --no-cache python3 make g++

# Copy dependency files first
COPY package*.json ./

# Install deps
RUN npm ci

# Copy app
COPY . .

# Build app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
