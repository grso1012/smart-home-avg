# Dockerfile für sensor-service
FROM node:18


RUN apt-get update && apt-get install -y mosquitto-clients

WORKDIR /app


COPY  ./tsconfig.base.json ./ package.json ./ tsconfig.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "start"]
