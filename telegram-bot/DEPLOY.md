# 🚀 Деплой Telegram бота на сервер yoddle.ru

## 📋 Быстрый старт

### Вариант 1: Через Git (рекомендуется)

```bash
# 1. Подключитесь к серверу
ssh root@yoddle.ru  # или IP адрес сервера

# 2. Перейдите в директорию проекта
cd /var/www/yoddle/telegram-bot

# 3. Получите последние изменения
git pull origin main

# 4. Установите зависимости (если нужно)
npm install

# 5. Перезапустите бота
pm2 restart yoddle-telegram-bot

# Или если используете npm напрямую:
pm2 restart bot-simple
```

### Вариант 2: Через SCP (загрузка файлов)

```bash
# С локального компьютера (Windows PowerShell)
# Загрузите всю папку telegram-bot на сервер

# 1. Создайте архив
cd C:\Users\user\Desktop\yoddle1
Compress-Archive -Path telegram-bot -DestinationPath telegram-bot.zip

# 2. Загрузите на сервер
scp telegram-bot.zip root@yoddle.ru:/tmp/

# 3. На сервере распакуйте
ssh root@yoddle.ru
cd /var/www/yoddle
unzip /tmp/telegram-bot.zip -d .
cd telegram-bot
npm install
pm2 restart yoddle-telegram-bot
```

## 🔧 Настройка на сервере

### 1. Создание структуры директорий

```bash
mkdir -p /var/www/yoddle/telegram-bot
cd /var/www/yoddle/telegram-bot
```

### 2. Установка зависимостей

```bash
# Если еще не установлены зависимости
npm install
```

### 3. Настройка .env файла

```bash
nano /var/www/yoddle/telegram-bot/.env
```

```env
# Telegram Bot Token
BOT_TOKEN=8287973233:AAFWussCdMTQvptTnhA_a4eUgLV8iTZhoL8

# Database (если используете)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yoddle_db
DB_USER=postgres
DB_PASSWORD=your_password

# Presentation URL (для продакшена)
PRESENTATION_URL=https://yoddle.ru/presentation.pdf

# Или локальный путь (если файл загружен на сервер)
# PRESENTATION_LOCAL_PATH=/var/www/yoddle/presentation.pdf

# Website URL
YODDLE_WEB_URL=https://yoddle.ru
```

### 4. Загрузка PDF файла презентации (опционально)

```bash
# Загрузите файл на сервер
scp C:\Users\user\Desktop\yoddle1\01.07_Yoddle.pdf root@yoddle.ru:/var/www/yoddle/presentation.pdf

# Или через веб-сервер (если файл доступен по URL)
# Просто загрузите файл в папку public на вашем сайте
```

### 5. Настройка PM2 для автозапуска

```bash
# Создайте конфигурацию PM2
nano /var/www/yoddle/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'yoddle-telegram-bot',
      script: './src/bot-simple.js',
      cwd: '/var/www/yoddle/telegram-bot',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/telegram-bot-error.log',
      out_file: '/var/log/pm2/telegram-bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
```

### 6. Запуск бота через PM2

```bash
cd /var/www/yoddle
pm2 start ecosystem.config.js

# Или напрямую:
cd /var/www/yoddle/telegram-bot
pm2 start src/bot-simple.js --name yoddle-telegram-bot

# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs yoddle-telegram-bot

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

## 🔄 Обновление кода

### Быстрое обновление:

```bash
# На сервере
cd /var/www/yoddle/telegram-bot
git pull origin main  # или загрузите файлы через SCP
npm install  # если были новые зависимости
pm2 restart yoddle-telegram-bot
```

### Проверка работы:

```bash
# Смотрим логи
pm2 logs yoddle-telegram-bot --lines 50

# Проверяем статус
pm2 status

# Тестируем бота в Telegram
# Отправьте /start боту
```

## 🐛 Решение проблем

### Бот не отвечает:

```bash
# Проверьте логи
pm2 logs yoddle-telegram-bot

# Проверьте, что бот запущен
pm2 status

# Перезапустите бота
pm2 restart yoddle-telegram-bot
```

### Ошибка подключения к БД:

```bash
# Проверьте настройки БД в .env
cat /var/www/yoddle/telegram-bot/.env | grep DB_

# Проверьте доступность PostgreSQL
psql -U postgres -h localhost -c "SELECT 1;"
```

### Файл презентации не отправляется:

```bash
# Проверьте наличие файла
ls -la /var/www/yoddle/presentation.pdf

# Проверьте URL в .env
cat /var/www/yoddle/telegram-bot/.env | grep PRESENTATION_URL

# Проверьте доступность URL
curl -I https://yoddle.ru/presentation.pdf
```

## 📝 Полезные команды PM2

```bash
# Просмотр всех процессов
pm2 list

# Просмотр логов в реальном времени
pm2 logs yoddle-telegram-bot --lines 100

# Перезапуск
pm2 restart yoddle-telegram-bot

# Остановка
pm2 stop yoddle-telegram-bot

# Удаление из PM2
pm2 delete yoddle-telegram-bot

# Мониторинг ресурсов
pm2 monit

# Сохранение текущей конфигурации
pm2 save
```

## 🔐 Безопасность

1. **Не храните .env в Git** - используйте `.env.example`
2. **Ограничьте доступ к .env файлу:**
   ```bash
   chmod 600 /var/www/yoddle/telegram-bot/.env
   ```
3. **Используйте firewall** для защиты сервера
4. **Регулярно обновляйте зависимости:**
   ```bash
   npm audit
   npm audit fix
   ```

## 📦 Альтернативные варианты деплоя

### Docker (если используете)

```bash
# Создайте Dockerfile в telegram-bot/
docker build -t yoddle-telegram-bot .
docker run -d --name telegram-bot --env-file .env yoddle-telegram-bot
```

### Systemd service (альтернатива PM2)

```bash
# Создайте service файл
sudo nano /etc/systemd/system/yoddle-telegram-bot.service
```

```ini
[Unit]
Description=Yoddle Telegram Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/yoddle/telegram-bot
ExecStart=/usr/bin/node src/bot-simple.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=yoddle-telegram-bot

[Install]
WantedBy=multi-user.target
```

```bash
# Запуск
sudo systemctl enable yoddle-telegram-bot
sudo systemctl start yoddle-telegram-bot
sudo systemctl status yoddle-telegram-bot
```

