# 🚀 Гайд по деплою Yoddle на VDS/VPS

## 📋 Архитектура

```
VDS Сервер (Ubuntu 22.04)
├── PostgreSQL (порт 5432)
├── Nginx (порт 80/443)
├── Node.js приложения:
│   ├── Main API (порт 3000)
│   ├── Telegram Bot (внутренний процесс)
│   └── Landing (статика через Nginx)
└── PM2 (менеджер процессов)
```

## 🛠️ Шаг 1: Подготовка сервера

### 1.1 Подключение к серверу
```bash
ssh root@your_server_ip
```

### 1.2 Обновление системы
```bash
apt update && apt upgrade -y
```

### 1.3 Установка необходимых пакетов
```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Nginx
apt install -y nginx

# Git
apt install -y git

# PM2 (менеджер процессов)
npm install -g pm2

# Certbot (для SSL)
apt install -y certbot python3-certbot-nginx
```

## 🗄️ Шаг 2: Настройка PostgreSQL

### 2.1 Создание базы данных и пользователя
```bash
# Переключитесь на пользователя postgres
sudo -u postgres psql

# В psql:
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\q
```

### 2.2 Настройка удаленного доступа (если нужно)
```bash
# Отредактируйте postgresql.conf
nano /etc/postgresql/15/main/postgresql.conf

# Найдите и измените:
listen_addresses = 'localhost'  # или '*' для внешнего доступа

# Отредактируйте pg_hba.conf
nano /etc/postgresql/15/main/pg_hba.conf

# Добавьте:
local   all             yoddle_user                             md5
host    yoddle_db       yoddle_user     127.0.0.1/32           md5

# Перезапустите PostgreSQL
systemctl restart postgresql
```

### 2.3 Инициализация структуры БД
```bash
# Загрузите SQL файл на сервер
scp database_setup_complete.sql root@your_server_ip:/tmp/

# На сервере выполните:
psql -U yoddle_user -d yoddle_db -f /tmp/database_setup_complete.sql
```

## 📦 Шаг 3: Деплой приложения

### 3.1 Создание структуры каталогов
```bash
mkdir -p /var/www/yoddle
cd /var/www/yoddle
```

### 3.2 Клонирование репозитория
```bash
# Если у вас Git репозиторий:
git clone https://github.com/your-username/yoddle.git .

# Или загрузите файлы вручную:
scp -r yoddle1/* root@your_server_ip:/var/www/yoddle/
```

### 3.3 Установка зависимостей
```bash
# Main API
cd /var/www/yoddle
npm install

# Telegram Bot
cd /var/www/yoddle/telegram-bot
npm install
```

### 3.4 Настройка .env файлов
```bash
# Основной .env
nano /var/www/yoddle/.env
```

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yoddle_db
DB_USER=yoddle_user
DB_PASSWORD=your_strong_password

# Server
PORT=3000
NODE_ENV=production
API_BASE_URL=https://yoddle.com

# AI
CLAUDE_API_KEY=your_claude_key
OPENROUTER_API_KEY=your_openrouter_key

# Telegram Bot
BOT_TOKEN=your_bot_token
BOT_USERNAME=YoddleBot
ADMIN_CHAT_ID=your_telegram_id

# Security
JWT_SECRET=your_very_long_random_secret_string

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ADMIN_EMAIL=admin@yoddle.com
```

## 🔄 Шаг 4: Запуск с PM2

### 4.1 Создание ecosystem.config.js
```bash
nano /var/www/yoddle/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'yoddle-api',
      script: './server.js',
      cwd: '/var/www/yoddle',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/yoddle-api-error.log',
      out_file: '/var/log/pm2/yoddle-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'yoddle-telegram-bot',
      script: './src/bot.js',
      cwd: '/var/www/yoddle/telegram-bot',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/telegram-bot-error.log',
      out_file: '/var/log/pm2/telegram-bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

### 4.2 Запуск приложений
```bash
# Создайте директорию для логов
mkdir -p /var/log/pm2

# Запустите все приложения
cd /var/www/yoddle
pm2 start ecosystem.config.js

# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

## 🌐 Шаг 5: Настройка Nginx

### 5.1 Создание конфигурации
```bash
nano /etc/nginx/sites-available/yoddle
```

```nginx
# HTTP → HTTPS редирект
server {
    listen 80;
    server_name yoddle.ru www.yoddle.ru;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name yoddle.ru www.yoddle.ru;

    # SSL (будет настроено Certbot)
    ssl_certificate /etc/letsencrypt/live/yoddle.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yoddle.ru/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Лендинг (статика)
    location / {
        root /var/www/yoddle/public;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы с кешированием
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /var/www/yoddle/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
}
```

### 5.2 Активация конфигурации
```bash
# Создайте символическую ссылку
ln -s /etc/nginx/sites-available/yoddle /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезагрузите Nginx
systemctl reload nginx
```

### 5.3 Настройка SSL с Let's Encrypt
```bash
# Получите SSL сертификат
certbot --nginx -d yoddle.ru -d www.yoddle.ru

# Автообновление сертификата (проверка)
certbot renew --dry-run
```

## 🔥 Шаг 6: Настройка Firewall

```bash
# UFW (если используется)
ufw allow 'Nginx Full'
ufw allow 22/tcp
ufw allow 5432/tcp  # только если нужен внешний доступ к БД
ufw enable
ufw status
```

## 📊 Шаг 7: Мониторинг и логи

### 7.1 Логи приложения
```bash
# PM2 логи
pm2 logs yoddle-api
pm2 logs yoddle-telegram-bot

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 7.2 Мониторинг через PM2
```bash
pm2 monit
```

### 7.3 Настройка PM2 веб-дашборда (опционально)
```bash
pm2 plus
```

## 🔄 Шаг 8: CI/CD (автоматический деплой)

### 8.1 Создание deploy скрипта
```bash
nano /var/www/yoddle/deploy.sh
```

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Переход в директорию проекта
cd /var/www/yoddle

# Получение последних изменений
echo "📥 Pulling latest changes..."
git pull origin main

# Установка зависимостей
echo "📦 Installing dependencies..."
npm install

cd telegram-bot
npm install
cd ..

# Применение миграций БД (если есть)
echo "🗄️ Running database migrations..."
# psql -U yoddle_user -d yoddle_db -f migrations/latest.sql

# Перезапуск приложений
echo "🔄 Restarting applications..."
pm2 restart all

# Очистка кеша Nginx (опционально)
# nginx -s reload

echo "✅ Deployment completed!"
pm2 status
```

```bash
chmod +x /var/www/yoddle/deploy.sh
```

## 🔐 Шаг 9: Безопасность

### 9.1 Создание отдельного пользователя
```bash
# Создайте пользователя для приложения
useradd -m -s /bin/bash yoddle
usermod -aG sudo yoddle

# Передайте права на файлы
chown -R yoddle:yoddle /var/www/yoddle

# Запустите PM2 под этим пользователем
su - yoddle
pm2 start ecosystem.config.js
```

### 9.2 Ограничение доступа к .env
```bash
chmod 600 /var/www/yoddle/.env
chmod 600 /var/www/yoddle/telegram-bot/.env
```

## 📱 Шаг 10: Проверка работы

### 10.1 Проверка API
```bash
curl https://yoddle.ru/api/health
```

### 10.2 Проверка лендинга
```bash
curl https://yoddle.ru
```

### 10.3 Проверка Telegram бота
```
Откройте Telegram → @YoddleBot → /start
```

### 10.4 Проверка базы данных
```bash
psql -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM telegram_leads;"
```

## 🆘 Troubleshooting

### Бот не отвечает
```bash
pm2 logs yoddle-telegram-bot
pm2 restart yoddle-telegram-bot
```

### API не работает
```bash
pm2 logs yoddle-api
curl http://localhost:3000/api/health
```

### Ошибки БД
```bash
tail -f /var/log/postgresql/postgresql-15-main.log
psql -U yoddle_user -d yoddle_db
```

### Nginx ошибки
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

## 📊 Мониторинг метрик

### Установка мониторинга (опционально)
```bash
# Grafana + Prometheus
# TODO: добавить инструкции
```

## 🔄 Backup базы данных

### Автоматический бэкап
```bash
# Создайте скрипт бэкапа
nano /usr/local/bin/backup_yoddle_db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/yoddle"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

pg_dump -U yoddle_user yoddle_db | gzip > $BACKUP_DIR/yoddle_db_$TIMESTAMP.sql.gz

# Удалить бэкапы старше 30 дней
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: yoddle_db_$TIMESTAMP.sql.gz"
```

```bash
chmod +x /usr/local/bin/backup_yoddle_db.sh

# Добавьте в crontab (ежедневно в 2:00)
crontab -e
# 0 2 * * * /usr/local/bin/backup_yoddle_db.sh >> /var/log/yoddle_backup.log 2>&1
```

---

## ✅ Чеклист деплоя

- [ ] Сервер настроен и обновлен
- [ ] PostgreSQL установлен и настроен
- [ ] База данных создана и инициализирована
- [ ] Node.js приложения развернуты
- [ ] PM2 настроен и приложения запущены
- [ ] Nginx настроен и работает
- [ ] SSL сертификат получен и активен
- [ ] Firewall настроен
- [ ] Telegram бот отвечает
- [ ] API доступен через HTTPS
- [ ] Лендинг открывается
- [ ] Логи настроены
- [ ] Бэкапы настроены

---

**Yoddle готов к работе! 🚀**

