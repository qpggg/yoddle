# 🚀 ПОЛНАЯ МИГРАЦИЯ С DOCKER НА СЕРВЕР

## 📋 Что будет перенесено:
- ✅ База данных PostgreSQL (все данные и структура)
- ✅ Node.js приложение (yoddle-api)
- ✅ Telegram бот (yoddle-tg)
- ✅ Настройки окружения (.env)

---

## 🔧 ЭТАП 1: Подготовка сервера

### 1.1 Установка PostgreSQL на сервере

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Обновите систему
apt update && apt upgrade -y

# Установите PostgreSQL
apt install -y postgresql postgresql-contrib

# Запустите PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Проверьте статус
systemctl status postgresql
```

### 1.2 Создание базы данных и пользователя

```bash
# Переключитесь на пользователя postgres
sudo -u postgres psql

# В psql выполните:
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_надежный_пароль';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;

# Подключитесь к базе данных
\c yoddle_db

# Дайте права на схемы
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;

# Выйдите из psql
\q
```

---

## 💾 ЭТАП 2: Экспорт данных из Docker

### 2.1 Экспорт структуры БД (схемы)

```bash
# На вашем локальном компьютере (где работает Docker)
# Найдите контейнер PostgreSQL или локальную БД
docker ps  # Найдите контейнер с PostgreSQL

# Экспортируйте схему БД
docker exec -t ваш_контейнер_postgres pg_dump -U postgres -d yoddle_db --schema-only > schema.sql

# ИЛИ если PostgreSQL локально:
pg_dump -U postgres -d yoddle_db --schema-only > schema.sql
```

### 2.2 Экспорт данных (если нужно сохранить данные)

```bash
# Экспорт всех данных
docker exec -t ваш_контейнер_postgres pg_dump -U postgres -d yoddle_db --data-only > data.sql

# ИЛИ полный экспорт (схема + данные)
docker exec -t ваш_контейнер_postgres pg_dump -U postgres -d yoddle_db > full_backup.sql

# ИЛИ если PostgreSQL локально:
pg_dump -U postgres -d yoddle_db > full_backup.sql
```

### 2.3 Альтернатива: Использование готовых SQL файлов из проекта

Если у вас есть актуальные SQL файлы в проекте, используйте их:

```bash
# Основные файлы для инициализации:
# - database_setup_complete.sql (полная инициализация)
# - init.sql (базовая структура)
# - complete_db_automation.sql (автоматизация)
```

---

## 📤 ЭТАП 3: Перенос данных на сервер

### 3.1 Загрузка SQL файлов на сервер

```bash
# С локального компьютера загрузите файлы на сервер
scp schema.sql root@your_server_ip:/tmp/
scp data.sql root@your_server_ip:/tmp/  # если есть данные
# ИЛИ
scp database_setup_complete.sql root@your_server_ip:/tmp/
```

### 3.2 Импорт схемы на сервере

```bash
# На сервере подключитесь к PostgreSQL
sudo -u postgres psql yoddle_db < /tmp/schema.sql

# ИЛИ если используете готовый файл проекта:
sudo -u postgres psql yoddle_db < /tmp/database_setup_complete.sql

# ИЛИ через пользователя yoddle_user:
psql -U yoddle_user -d yoddle_db -f /tmp/database_setup_complete.sql
```

### 3.3 Импорт данных (если есть)

```bash
# Импорт данных
sudo -u postgres psql yoddle_db < /tmp/data.sql

# ИЛИ полный импорт
sudo -u postgres psql yoddle_db < /tmp/full_backup.sql
```

### 3.4 Проверка импорта

```bash
# Подключитесь к БД
sudo -u postgres psql yoddle_db

# Проверьте таблицы
\dt

# Проверьте количество записей
SELECT COUNT(*) FROM enter;  # пользователи
SELECT COUNT(*) FROM benefits;  # льготы
SELECT COUNT(*) FROM telegram_leads;  # лиды из бота

# Выйдите
\q
```

---

## 🚀 ЭТАП 4: Перенос приложения на сервер

### 4.1 Клонирование репозитория на сервере

```bash
# На сервере
cd /root
git clone https://github.com/qpggg/yoddle.git yoddle
# ИЛИ если уже есть папка:
cd /root/yoddle
git checkout stable
git pull origin stable
```

### 4.2 Установка зависимостей

```bash
# Установите Node.js (если еще не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установите PM2
npm install -g pm2

# Установите зависимости проекта
cd /root/yoddle
npm install

# Установите зависимости бота
cd /root/yoddle/telegram-bot
npm install
```

### 4.3 Настройка .env файла

```bash
# Создайте .env файл (см. инструкцию выше)
cd /root/yoddle
cp .env.example .env
nano .env

# Обязательно настройте:
# - DB_HOST=localhost
# - DB_PORT=5432
# - DB_NAME=yoddle_db
# - DB_USER=yoddle_user
# - DB_PASSWORD=ваш_пароль_из_этапа_1.2
# - BOT_TOKEN=ваш_токен_от_botfather
# - API_BASE_URL=http://localhost:3000
# - YODDLE_WEB_URL=https://yoddle.ru

# Установите права
chmod 600 .env
```

---

## 🔄 ЭТАП 5: Запуск приложений через PM2

### 5.1 Запуск основного сайта

```bash
cd /root/yoddle

# Остановите старые процессы (если есть)
pm2 stop yoddle-api
pm2 delete yoddle-api

# Запустите через ecosystem.config.js
pm2 start ecosystem.config.js

# Проверьте статус
pm2 status
pm2 logs yoddle-api
```

### 5.2 Запуск Telegram бота

```bash
cd /root/yoddle/telegram-bot

# Остановите старые процессы (если есть)
pm2 stop yoddle-tg
pm2 delete yoddle-tg

# Запустите через ecosystem.config.js
pm2 start ecosystem.config.js

# Проверьте статус
pm2 status
pm2 logs yoddle-tg
```

### 5.3 Настройка автозапуска

```bash
# Сохраните список процессов
pm2 save

# Настройте автозапуск при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2
```

---

## ✅ ЭТАП 6: Проверка работоспособности

### 6.1 Проверка базы данных

```bash
# Подключитесь к БД
sudo -u postgres psql yoddle_db

# Проверьте подключение приложения
SELECT COUNT(*) FROM enter;
SELECT COUNT(*) FROM benefits;
SELECT COUNT(*) FROM telegram_leads;

\q
```

### 6.2 Проверка приложений

```bash
# Проверьте статус всех процессов
pm2 status

# Проверьте логи
pm2 logs yoddle-api --lines 50
pm2 logs yoddle-tg --lines 50

# Проверьте доступность API
curl http://localhost:3000/api/health
# ИЛИ
curl http://localhost:3000/api/users
```

### 6.3 Проверка Telegram бота

```bash
# Найдите бота в Telegram
# Отправьте команду /start
# Проверьте, что бот отвечает
```

---

## 🔄 ЭТАП 7: Настройка Nginx (если нужно)

### 7.1 Базовая конфигурация Nginx

```bash
# Установите Nginx
apt install -y nginx

# Создайте конфигурацию
nano /etc/nginx/sites-available/yoddle
```

```nginx
server {
    listen 80;
    server_name yoddle.ru www.yoddle.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Активируйте конфигурацию
ln -s /etc/nginx/sites-available/yoddle /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезапустите Nginx
systemctl restart nginx
```

---

## 📊 ЧЕКЛИСТ МИГРАЦИИ

- [ ] PostgreSQL установлен и запущен на сервере
- [ ] База данных `yoddle_db` создана
- [ ] Пользователь `yoddle_user` создан с правами
- [ ] Схема БД импортирована
- [ ] Данные импортированы (если есть)
- [ ] Репозиторий клонирован на сервер
- [ ] Зависимости установлены (npm install)
- [ ] `.env` файл настроен с правильными параметрами БД
- [ ] Процесс `yoddle-api` запущен через PM2
- [ ] Процесс `yoddle-tg` запущен через PM2
- [ ] Автозапуск PM2 настроен
- [ ] Приложения работают и подключаются к БД
- [ ] Telegram бот отвечает на команды
- [ ] Nginx настроен (если нужно)

---

## 🆘 РЕШЕНИЕ ПРОБЛЕМ

### Проблема: БД не подключается

```bash
# Проверьте, что PostgreSQL запущен
systemctl status postgresql

# Проверьте, что пользователь может подключиться
psql -U yoddle_user -d yoddle_db -h localhost

# Проверьте логи подключения
tail -f /var/log/postgresql/postgresql-*.log
```

### Проблема: Приложение не запускается

```bash
# Проверьте логи PM2
pm2 logs yoddle-api --lines 100
pm2 logs yoddle-tg --lines 100

# Запустите приложение напрямую для отладки
cd /root/yoddle
node server.js
```

### Проблема: Данные не импортировались

```bash
# Проверьте ошибки импорта
sudo -u postgres psql yoddle_db < /tmp/database_setup_complete.sql 2>&1 | tee import_errors.log

# Проверьте таблицы
sudo -u postgres psql yoddle_db -c "\dt"
```

---

## 📝 ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **Резервное копирование**: Перед миграцией создайте бэкап Docker БД
2. **Тестирование**: Протестируйте все функции после миграции
3. **Мониторинг**: Настройте мониторинг PM2 процессов
4. **Обновления**: Регулярно делайте `git pull` и перезапускайте процессы

---

## 🎉 ГОТОВО!

После выполнения всех этапов ваше приложение будет работать на сервере постоянно!

