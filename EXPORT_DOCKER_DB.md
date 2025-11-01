# 🚀 БЫСТРЫЙ ЭКСПОРТ БД ИЗ DOCKER

## Команды для вашего случая:

### 1. Экспорт БД из контейнера yoddle-pg

```bash
# Полный экспорт (схема + данные)
docker exec -t yoddle-pg pg_dump -U postgres -d yoddle_db > backup_full.sql

# Только схема (структура таблиц)
docker exec -t yoddle-pg pg_dump -U postgres -d yoddle_db --schema-only > backup_schema.sql

# Только данные (без структуры)
docker exec -t yoddle-pg pg_dump -U postgres -d yoddle_db --data-only > backup_data.sql

# Сжатый вариант (рекомендуется для больших БД)
docker exec -t yoddle-pg pg_dump -U postgres -d yoddle_db | gzip > backup_full.sql.gz
```

### 2. Быстрая проверка БД перед экспортом

```bash
# Подключитесь к БД в контейнере
docker exec -it yoddle-pg psql -U postgres -d yoddle_db

# Выполните проверочные запросы:
SELECT COUNT(*) FROM enter;
SELECT COUNT(*) FROM benefits;
SELECT COUNT(*) FROM telegram_leads;
SELECT COUNT(*) FROM user_progress;

# Проверьте список таблиц
\dt

# Выйдите
\q
```

### 3. Проверка имени БД (если yoddle_db не подходит)

```bash
# Подключитесь к PostgreSQL
docker exec -it yoddle-pg psql -U postgres

# Посмотрите список баз данных
\l

# Подключитесь к нужной БД
\c имя_базы_данных

# Проверьте таблицы
\dt

# Выйдите
\q
```

### 4. Загрузка на сервер

```bash
# Загрузите файл на сервер
scp backup_full.sql root@your_server_ip:/tmp/

# ИЛИ сжатый вариант
scp backup_full.sql.gz root@your_server_ip:/tmp/
```

### 5. Импорт на сервере

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Импорт (обычный файл)
sudo -u postgres psql yoddle_db < /tmp/backup_full.sql

# ИЛИ импорт сжатого файла
gunzip -c /tmp/backup_full.sql.gz | sudo -u postgres psql yoddle_db

# ИЛИ через пользователя yoddle_user
psql -U yoddle_user -d yoddle_db -h localhost -f /tmp/backup_full.sql
```

### 6. Проверка после импорта

```bash
# На сервере
cd /root/yoddle
git pull origin stable  # Получить скрипт проверки

# Запустите скрипт проверки
psql -U yoddle_user -d yoddle_db -h localhost -f check_database_health.sql

# ИЛИ быстрая проверка
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM enter;"
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM benefits;"
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM telegram_leads;"
```

---

## ⚡ Самый быстрый способ (одна команда):

```bash
# Экспорт + загрузка на сервер одной командой
docker exec -t yoddle-pg pg_dump -U postgres -d yoddle_db | ssh root@your_server_ip "sudo -u postgres psql yoddle_db"
```

---

## 📝 Примечания:

- **Контейнер**: `yoddle-pg`
- **Пользователь БД**: `postgres` (по умолчанию в контейнере)
- **Порт на хосте**: `6543` (внутри контейнера `5432`)
- **Имя БД**: возможно `yoddle_db` или другое (проверьте командой `\l`)

