# 🚀 МИГРАЦИЯ БД С DOCKER НА VDS СЕРВЕР

## 📋 Обзор миграции

### Текущее состояние:
- Docker Compose с PostgreSQL
- Node.js приложение в контейнере
- Данные в Docker volumes

### Целевое состояние:
- PostgreSQL на VDS сервере
- Node.js приложение на VDS или останется локально
- Данные в нативной PostgreSQL

---

## 🔧 ПОДГОТОВКА VDS СЕРВЕРА

### 1. Установка PostgreSQL на VDS

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb

# Запуск службы
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Настройка PostgreSQL

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE yoddle_prod;
CREATE USER yoddle_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE yoddle_prod TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
```

### 3. Настройка сетевого доступа

```bash
# Редактирование postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf

# Найти и изменить:
listen_addresses = '*'
port = 5432

# Редактирование pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Добавить строку для вашего IP:
host    all             all             YOUR_IP/32           md5
# Или для всех (менее безопасно):
host    all             all             0.0.0.0/0            md5

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
```

### 4. Настройка файрвола

```bash
# UFW (Ubuntu)
sudo ufw allow 5432/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
```

---

## 📦 ЭКСПОРТ ДАННЫХ ИЗ DOCKER

### 1. Создание дампа базы данных

```bash
# Подключение к Docker контейнеру PostgreSQL
docker exec -it <postgres_container_name> pg_dump -U postgres -d yoddle > yoddle_backup.sql

# Или если используете docker-compose
docker-compose exec postgres pg_dump -U postgres -d yoddle > yoddle_backup.sql

# Сжатый дамп (рекомендуется)
docker-compose exec postgres pg_dump -U postgres -d yoddle | gzip > yoddle_backup.sql.gz
```

### 2. Копирование дампа на VDS

```bash
# SCP
scp yoddle_backup.sql user@your-vds-server:/home/user/

# RSYNC (лучше для больших файлов)
rsync -avz yoddle_backup.sql user@your-vds-server:/home/user/
```

---

## 🔄 ИМПОРТ ДАННЫХ НА VDS

### 1. Восстановление базы данных

```bash
# Подключение к VDS
ssh user@your-vds-server

# Импорт дампа
psql -U yoddle_user -d yoddle_prod -f yoddle_backup.sql

# Или для сжатого дампа
gunzip -c yoddle_backup.sql.gz | psql -U yoddle_user -d yoddle_prod
```

### 2. Проверка импорта

```bash
# Подключение к базе
psql -U yoddle_user -d yoddle_prod

# Проверка таблиц
\dt

# Проверка данных
SELECT COUNT(*) FROM enter;
SELECT COUNT(*) FROM activity_log;
\q
```

---

## ⚙️ ОБНОВЛЕНИЕ КОНФИГУРАЦИИ ПРИЛОЖЕНИЯ

### 1. Обновление .env файла

```env
# Новая строка подключения к VDS
PG_CONNECTION_STRING=postgresql://yoddle_user:your_secure_password@your-vds-ip:5432/yoddle_prod

# Или отдельные переменные
PGHOST=your-vds-ip
PGPORT=5432
PGDATABASE=yoddle_prod
PGUSER=yoddle_user
PGPASSWORD=your_secure_password
```

### 2. Обновление docker-compose.yml (опционально)

```yaml
services:
  app:
    image: node:20
    working_dir: /app
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - PG_CONNECTION_STRING=postgresql://yoddle_user:your_secure_password@your-vds-ip:5432/yoddle_prod
    volumes:
      - .:/app
      - /app/node_modules
    command: sh -c "npm ci --no-audit --no-fund && npm run server"
    restart: unless-stopped
    # Удаляем зависимость от postgres контейнера
    # depends_on:
    #   - postgres

  # postgres контейнер больше не нужен
  # postgres:
  #   image: postgres:15
  #   environment:
  #     POSTGRES_DB: yoddle
  #     POSTGRES_USER: postgres
  #     POSTGRES_PASSWORD: password
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   ports:
  #     - "5432:5432"
```

---

## 🚀 АЛЬТЕРНАТИВЫ PM2 ДЛЯ DOCKER

### 1. Docker Compose (рекомендуется)
```bash
# Запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### 2. Systemd для автозапуска Docker
```bash
# Создание systemd сервиса
sudo nano /etc/systemd/system/yoddle.service

[Unit]
Description=Yoddle Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target

# Активация сервиса
sudo systemctl enable yoddle.service
sudo systemctl start yoddle.service
```

### 3. Portainer (веб-интерфейс)
```bash
# Установка Portainer
docker run -d -p 9000:9000 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce

# Доступ: http://your-server:9000
```

### 4. Docker Swarm (для продакшена)
```bash
# Инициализация swarm
docker swarm init

# Развертывание стека
docker stack deploy -c docker-compose.yml yoddle
```

---

## 🔒 БЕЗОПАСНОСТЬ И МОНИТОРИНГ

### 1. SSL/TLS для PostgreSQL
```bash
# Генерация сертификатов
sudo -u postgres openssl req -new -x509 -days 365 -nodes -text -out /etc/ssl/certs/server.crt -keyout /etc/ssl/private/server.key -subj "/CN=your-server"

# Настройка SSL в postgresql.conf
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
```

### 2. Мониторинг подключений
```bash
# Проверка активных подключений
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Мониторинг производительности
sudo -u postgres psql -c "SELECT * FROM pg_stat_database;"
```

---

## 🧪 ТЕСТИРОВАНИЕ МИГРАЦИИ

### 1. Проверка подключения
```bash
# Тест подключения из приложения
npm run test-login

# Проверка API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/login -X POST -H "Content-Type: application/json" -d '{"login":"test@example.com","password":"password"}'
```

### 2. Проверка производительности
```bash
# Тест скорости входа
npm run test-speed

# Тест геймификации
npm run test-gamification
```

---

## 📋 ЧЕКЛИСТ МИГРАЦИИ

- [ ] PostgreSQL установлен на VDS
- [ ] Создана база данных и пользователь
- [ ] Настроен сетевой доступ
- [ ] Экспортированы данные из Docker
- [ ] Импортированы данные на VDS
- [ ] Обновлен .env файл
- [ ] Обновлен docker-compose.yml
- [ ] Протестировано подключение
- [ ] Протестированы API endpoints
- [ ] Настроен мониторинг
- [ ] Настроена безопасность
- [ ] Создан план резервного копирования

---

## 🆘 РЕШЕНИЕ ПРОБЛЕМ

### Проблема: Не удается подключиться к PostgreSQL
```bash
# Проверка статуса службы
sudo systemctl status postgresql

# Проверка логов
sudo journalctl -u postgresql

# Проверка портов
sudo netstat -tlnp | grep 5432
```

### Проблема: Ошибки аутентификации
```bash
# Проверка pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
```

### Проблема: Медленная работа
```bash
# Анализ производительности
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Проверка индексов
sudo -u postgres psql -d yoddle_prod -c "\di"
```

---

## 🎯 РЕЗУЛЬТАТ

После успешной миграции вы получите:

✅ **Производительность**: Прямое подключение к PostgreSQL  
✅ **Надежность**: Нативная база данных без Docker overhead  
✅ **Масштабируемость**: Возможность настройки кластера  
✅ **Безопасность**: Прямой контроль над PostgreSQL  
✅ **Мониторинг**: Полный доступ к метрикам БД  

**Время миграции**: 2-4 часа  
**Простой**: Минимальный (если все настроено правильно)  
**Риски**: Низкие (при правильном бэкапе)







