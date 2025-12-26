FROM node:18-slim
RUN apt-get update && apt-get install -y iputils-ping
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "app.js"]