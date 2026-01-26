FROM node:20

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Установка nodemon для автоперезагрузки
RUN npm install -g nodemon

# Копирование исходного кода
COPY . .

EXPOSE 3001 5173

# По умолчанию запускаем бэкенд
CMD ["npm", "run", "dev:server"]