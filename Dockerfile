FROM node:current-alpine3.21

WORKDIR /var/www/fosterhartley
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

