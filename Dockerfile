FROM node:18

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Установка nodemon для автоперезагрузки
RUN npm install -g nodemon

# Копирование исходного кода
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev:server"]