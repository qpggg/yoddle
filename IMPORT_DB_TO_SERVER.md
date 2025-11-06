# 🚀 ИМПОРТ БД НА СЕРВЕР И ПРОВЕРКА

## 🎯 ТРИ ВАРИАНТА:

### ✅ Вариант 1: Создать БД на сервере вручную (РЕКОМЕНДУЕТСЯ)

**Самый простой и быстрый!** Установите PostgreSQL на сервере и создайте БД локально.

👉 **См. подробную инструкцию:** `CREATE_DB_ON_SERVER.md`

### Вариант 2: Создать новую БД через GUI провайдера

Создайте новую БД через GUI провайдера и импортируйте бэкап.

👉 **См. подробную инструкцию:** `CREATE_NEW_DB_AND_IMPORT.md`

### Вариант 3: Использовать существующую БД

Если у вас уже есть БД `f1111323_base` и вы знаете параметры подключения:

---

## 🔌 Параметры подключения к существующей БД:

> ⚠️ **ВАЖНО**: БД была создана через GUI вашего хостинг-провайдера, поэтому параметры подключения могут отличаться от стандартных.

### Текущие параметры (уточните в панели управления провайдера):

- **Имя БД**: `f1111323_base`
- **Пользователь**: `f1111323_base`
- **Пароль**: `lJS2b1O3`
- **Хост**: `localhost` ⚠️ (может быть внешний IP или доменное имя)
- **Порт**: `5432` ⚠️ (может отличаться, проверьте в GUI)
- **SSL**: может быть обязательным для удаленных подключений

### 📋 Где найти правильные параметры в GUI провайдера:

1. **Хост (Host)**: Обычно указан как "Host", "Server", "Endpoint" или "Connection String"
   - Может быть: `localhost`, `127.0.0.1`, внешний IP или доменное имя типа `db.example.com`
   - Если БД на том же сервере → `localhost`
   - Если БД на отдельном сервере → внешний адрес

2. **Порт (Port)**: Обычно `5432`, но может быть другой (например, `5433`, `6543`)

3. **SSL**: Проверьте, требуется ли SSL подключение (обычно для удаленных БД)

4. **Connection String**: Некоторые провайдеры дают готовую строку подключения

---

## 📤 Шаг 1: Получение файла на сервере

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Перейдите в папку проекта
cd /root/yoddle  # или /root/yoddle1 (в зависимости от вашего пути)

# Обновите код из репозитория (файл backup_full1.sql будет в public/)
git checkout stable
git pull origin stable

# Проверьте наличие файла
ls -lh public/backup_full1.sql

# ИЛИ если файл уже загружен вручную, можно использовать его напрямую
```

---

## 🔍 Шаг 1.5: Установка PostgreSQL клиента и проверка подключения

### ⚠️ ВАЖНО: Установите PostgreSQL клиент на сервере

Если вы получили ошибку "You must install at least one postgresql-client-<version> package", выполните:

```bash
# Обновите список пакетов
apt update

# Установите PostgreSQL клиент (версия 15 или выше)
apt install -y postgresql-client-15

# ИЛИ установите последнюю доступную версию
apt install -y postgresql-client

# Проверьте установку
psql --version
```

### ❌ Ошибка "Connection refused" на localhost

Если вы получили ошибку:
```
psql: error: connection to server at "localhost" (::1), port 5432 failed: Connection refused
```

Это означает, что **БД находится НЕ на этом сервере**, а на удаленном сервере провайдера.

**Решение**: Найдите правильный хост в GUI вашего провайдера (см. раздел ниже "Как определить правильный хост").

### Вариант A: Если БД на том же сервере (localhost)

```bash
# На сервере проверьте подключение к БД
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT version();"

# Проверьте список таблиц (если они уже есть)
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "\dt"

# Проверьте размер БД
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT pg_size_pretty(pg_database_size('f1111323_base'));"
```

### Вариант B: Если БД на удаленном сервере (внешний хост) ⚠️ ВАШ СЛУЧАЙ

Если получили "Connection refused" на localhost, значит БД на удаленном сервере:

```bash
# 1. СНАЧАЛА найдите правильный хост в GUI провайдера (см. инструкцию ниже)
# 2. Замените YOUR_DB_HOST на реальный хост из GUI провайдера
#    Например: db.example.com, 185.123.45.67, или другой адрес

# Без SSL (попробуйте сначала этот вариант):
PGPASSWORD=lJS2b1O3 psql -h YOUR_DB_HOST -p 5432 -U f1111323_base -d f1111323_base -c "SELECT version();"

# С SSL (если без SSL не работает):
PGPASSWORD=lJS2b1O3 psql "host=YOUR_DB_HOST port=5432 dbname=f1111323_base user=f1111323_base password=lJS2b1O3 sslmode=require" -c "SELECT version();"

# Или через переменную окружения для SSL
export PGPASSWORD=lJS2b1O3
psql "postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base?sslmode=require" -c "SELECT version();"
```

```bash
# Замените YOUR_DB_HOST на реальный хост из GUI провайдера
# Например: db.example.com, 192.168.1.100, или другой адрес

# Без SSL (если не требуется)
PGPASSWORD=lJS2b1O3 psql -h YOUR_DB_HOST -p 5432 -U f1111323_base -d f1111323_base -c "SELECT version();"

# С SSL (если требуется провайдером)
PGPASSWORD=lJS2b1O3 psql "host=YOUR_DB_HOST port=5432 dbname=f1111323_base user=f1111323_base password=lJS2b1O3 sslmode=require" -c "SELECT version();"

# Или через переменную окружения для SSL
export PGPASSWORD=lJS2b1O3
psql "postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base?sslmode=require" -c "SELECT version();"
```

### 🔍 Как определить правильный хост:

1. **Войдите в панель управления вашего хостинг-провайдера**
2. **Найдите раздел "Базы данных" или "Databases"**
3. **Откройте информацию о вашей БД `f1111323_base`**
4. **Скопируйте параметры подключения:**
   - Host/Server/Endpoint
   - Port
   - Database name
   - Username
   - Password
   - SSL requirements

### 💡 Частые варианты хостов:

- **`localhost`** или **`127.0.0.1`** - БД на том же сервере
- **Внешний IP** (например, `185.123.45.67`) - БД на отдельном сервере
- **Доменное имя** (например, `db.yourhosting.com`) - управляемая БД провайдера

---

## 📥 Шаг 2: Импорт БД на сервере

### ⚠️ ВАЖНО: Перед импортом сделайте бэкап существующей БД!

```bash
# Создайте бэкап текущей БД (на всякий случай)
PGPASSWORD=lJS2b1O3 pg_dump -h localhost -U f1111323_base -d f1111323_base > backup_before_import_$(date +%Y%m%d_%H%M%S).sql
```

### Импорт данных из backup_full1.sql

#### Вариант 1: БД на том же сервере (localhost)

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Перейдите в папку проекта
cd /root/yoddle  # или /root/yoddle1

# Убедитесь, что файл есть (после git pull)
ls -lh public/backup_full1.sql

# Импортируйте БД из папки public в существующую БД
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -f public/backup_full1.sql

# ИЛИ с выводом ошибок в файл (рекомендуется):
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

#### Вариант 2: БД на удаленном сервере (внешний хост)

```bash
# Подключитесь к серверу приложения
ssh root@your_server_ip

# Перейдите в папку проекта
cd /root/yoddle  # или /root/yoddle1

# Убедитесь, что файл есть (после git pull)
ls -lh public/backup_full1.sql

# Замените YOUR_DB_HOST на реальный хост из GUI провайдера
# Импорт БЕЗ SSL (если не требуется):
PGPASSWORD=lJS2b1O3 psql -h YOUR_DB_HOST -p 5432 -U f1111323_base -d f1111323_base -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log

# Импорт С SSL (если требуется провайдером):
PGPASSWORD=lJS2b1O3 psql "postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base?sslmode=require" -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

**Примечание**: 
- Если в `backup_full1.sql` есть команды `CREATE DATABASE` или `\c`, они могут вызвать ошибки при импорте в существующую БД. Это нормально - просто пропустите эти строки.
- Для удаленных БД может потребоваться установка клиента PostgreSQL на сервере: `apt install postgresql-client`

### Альтернативный вариант: Если нужно создать новую БД

Если по какой-то причине вы хотите создать новую БД вместо использования существующей:

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Перейдите в папку проекта
cd /root/yoddle

# Убедитесь, что файл есть (после git pull)
ls -lh public/backup_full1.sql

# Создайте БД и пользователя (если еще не созданы)
sudo -u postgres psql << EOF
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\q
EOF

# Импортируйте БД из папки public
sudo -u postgres psql yoddle_db < public/backup_full1.sql

# Дайте права пользователю yoddle_user
sudo -u postgres psql yoddle_db << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
EOF
```

---

## ✅ Шаг 3: Проверка работоспособности после импорта

### Быстрая проверка

```bash
# На сервере
cd /root/yoddle
git pull origin stable  # Получить скрипт проверки

# Быстрая проверка количества записей (с вашими параметрами БД)
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT COUNT(*) FROM enter;"
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT COUNT(*) FROM benefits;"
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT COUNT(*) FROM telegram_leads;"
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT COUNT(*) FROM user_progress;"

# Проверьте список всех таблиц
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "\dt"
```

### Полная проверка через скрипт

```bash
# Запустите скрипт проверки (с вашими параметрами БД)
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -f check_database_health.sql

# ИЛИ быстрый скрипт
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -f check_db_quick.sql
```

### Проверка подключения приложения

```bash
# Проверьте, что приложение подключается к БД
pm2 logs yoddle-api --lines 20

# Проверьте логи бота
pm2 logs yoddle-tg --lines 20

# Проверьте статус процессов
pm2 status
```

---

## 🔄 Шаг 4: Обновление .env файла (ОБЯЗАТЕЛЬНО!)

```bash
# Убедитесь, что .env файл настроен правильно
cd /root/yoddle  # или /root/yoddle1
nano .env

# Обновите параметры БД на существующие:
# 
# ВАРИАНТ 1: Если БД на том же сервере (localhost)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=f1111323_base
# DB_USER=f1111323_base
# DB_PASSWORD=lJS2b1O3
#
# ВАРИАНТ 2: Если БД на удаленном сервере (замените YOUR_DB_HOST)
# DB_HOST=YOUR_DB_HOST  # Внешний IP или доменное имя из GUI провайдера
# DB_PORT=5432  # Может отличаться, проверьте в GUI
# DB_NAME=f1111323_base
# DB_USER=f1111323_base
# DB_PASSWORD=lJS2b1O3

# Также для db.js может потребоваться PG_CONNECTION_STRING или отдельные переменные:
#
# Для локальной БД:
# PG_CONNECTION_STRING=postgresql://f1111323_base:lJS2b1O3@localhost:5432/f1111323_base
#
# Для удаленной БД БЕЗ SSL:
# PG_CONNECTION_STRING=postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base
#
# Для удаленной БД С SSL (если требуется):
# PG_CONNECTION_STRING=postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base?sslmode=require
#
# ИЛИ отдельные переменные:
# PGHOST=localhost  # или YOUR_DB_HOST для удаленной БД
# PGPORT=5432
# PGDATABASE=f1111323_base
# PGUSER=f1111323_base
# PGPASSWORD=lJS2b1O3
# PGSSLMODE=require  # если требуется SSL для удаленной БД

# Сохраните файл (Ctrl+O, Enter, Ctrl+X)

# Перезапустите приложения
pm2 restart yoddle-api
pm2 restart yoddle-tg
```

---

## 📊 Сравнение данных (до и после)

### Проверка, что данные совпадают:

```bash
# На вашем компьютере (Docker):
$env:PGPASSWORD="Nei3wmOK"; psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -c "SELECT COUNT(*) FROM enter;" > local_count.txt

# На сервере (после импорта):
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT COUNT(*) FROM enter;" > server_count.txt

# Сравните файлы (должны совпадать)
cat local_count.txt
cat server_count.txt
```

---

## 🎯 Чеклист после импорта:

- [ ] Код обновлен через `git pull origin stable` на сервере
- [ ] Файл `public/backup_full1.sql` присутствует в проекте
- [ ] Создан бэкап существующей БД (на всякий случай)
- [ ] БД `f1111323_base` доступна на сервере
- [ ] Подключение к БД проверено командой `psql`
- [ ] БД импортирована из `public/backup_full1.sql` без критических ошибок
- [ ] Проверка количества записей выполнена
- [ ] `.env` файл обновлен с правильными параметрами БД:
  - [ ] `DB_NAME=f1111323_base`
  - [ ] `DB_USER=f1111323_base`
  - [ ] `DB_PASSWORD=lJS2b1O3`
  - [ ] `DB_HOST=localhost`
  - [ ] `DB_PORT=5432`
- [ ] Приложение `yoddle-api` перезапущено и подключается к БД
- [ ] Telegram бот `yoddle-tg` перезапущен и подключается к БД
- [ ] Логи показывают успешное подключение (проверьте `pm2 logs`)

---

## 🆘 Если возникли ошибки при импорте:

```bash
# Перейдите в папку проекта
cd /root/yoddle

# Проверьте ошибки импорта (с вашими параметрами БД)
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -f public/backup_full1.sql 2>&1 | tee import_errors.log

# Проверьте, какие таблицы создались
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "\dt"

# Проверьте логи импорта
cat import_errors.log | grep -i error

# Если импорт упал на середине, можно попробовать очистить проблемные таблицы:
# (ВНИМАНИЕ: Это удалит данные из этих таблиц!)
# PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "DROP TABLE IF EXISTS имя_проблемной_таблицы CASCADE;"

# Попробуйте импорт снова (только проблемные части)
# Или восстановите из бэкапа, который вы сделали перед импортом
```

### Частые ошибки и решения:

1. **Ошибка "relation already exists"** - Таблица уже существует. Это нормально, если вы импортируете в существующую БД. Можно пропустить или использовать `DROP TABLE IF EXISTS` перед импортом.

2. **Ошибка "database does not exist"** - Проверьте имя БД в команде импорта.

3. **Ошибка "permission denied"** - Убедитесь, что пользователь `f1111323_base` имеет права на создание таблиц в БД.

4. **Ошибка "CREATE DATABASE"** - Если в backup_full1.sql есть команда создания БД, она вызовет ошибку при импорте в существующую БД. Это можно игнорировать или отредактировать файл перед импортом.

