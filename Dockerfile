FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --include=dev

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
