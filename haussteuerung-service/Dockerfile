FROM node:18

WORKDIR /app

COPY ./tsconfig.base.json ./package.json ./tsconfig.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "start"]
