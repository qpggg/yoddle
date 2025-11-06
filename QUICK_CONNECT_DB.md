# 🔌 БЫСТРОЕ ПОДКЛЮЧЕНИЕ К БД НА СЕРВЕРЕ

## Параметры подключения:

> ⚠️ **ВАЖНО**: БД создана через GUI хостинг-провайдера. Уточните правильный хост в панели управления!

- **Имя БД**: `f1111323_base`
- **Пользователь**: `f1111323_base`
- **Пароль**: `lJS2b1O3`
- **Хост**: `localhost` ⚠️ (может быть внешний IP или доменное имя - проверьте в GUI)
- **Порт**: `5432` ⚠️ (может отличаться - проверьте в GUI)
- **SSL**: может быть обязательным для удаленных подключений

---

## ⚠️ ПРЕДВАРИТЕЛЬНАЯ УСТАНОВКА:

Если вы получили ошибку "You must install at least one postgresql-client-<version> package", установите клиент:

```bash
# Обновите список пакетов
apt update

# Установите PostgreSQL клиент
apt install -y postgresql-client-15

# ИЛИ последнюю доступную версию
apt install -y postgresql-client

# Проверьте установку
psql --version
```

---

## 📝 Команды для подключения:

### 1. Подключение к БД через psql:

#### Если БД на том же сервере (localhost):
```bash
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base
```

#### Если БД на удаленном сервере (замените YOUR_DB_HOST):
```bash
# Без SSL
PGPASSWORD=lJS2b1O3 psql -h YOUR_DB_HOST -p 5432 -U f1111323_base -d f1111323_base

# С SSL (если требуется)
PGPASSWORD=lJS2b1O3 psql "postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base?sslmode=require"
```

### 2. Выполнение одной команды без входа в psql:

```bash
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT version();"
```

### 3. Просмотр списка таблиц:

```bash
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "\dt"
```

### 4. Просмотр структуры таблицы:

```bash
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "\d enter"
```

### 5. Подсчет записей в таблице:

```bash
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT COUNT(*) FROM enter;"
```

### 6. Выполнение SQL файла:

```bash
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -f путь/к/файлу.sql
```

### 7. Создание бэкапа БД:

```bash
PGPASSWORD=lJS2b1O3 pg_dump -h localhost -U f1111323_base -d f1111323_base > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 8. Импорт SQL файла:

#### Для локальной БД:
```bash
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -f public/backup_full1.sql
```

#### Для удаленной БД (замените YOUR_DB_HOST):
```bash
# Без SSL
PGPASSWORD=lJS2b1O3 psql -h YOUR_DB_HOST -p 5432 -U f1111323_base -d f1111323_base -f public/backup_full1.sql

# С SSL
PGPASSWORD=lJS2b1O3 psql "postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base?sslmode=require" -f public/backup_full1.sql
```

---

## 🔧 Настройка .env файла:

Добавьте в `.env` файл на сервере:

### Вариант 1: БД на том же сервере (localhost)

```env
# Параметры БД для приложения
DB_HOST=localhost
DB_PORT=5432
DB_NAME=f1111323_base
DB_USER=f1111323_base
DB_PASSWORD=lJS2b1O3

# Для db.js (альтернативный вариант)
PG_CONNECTION_STRING=postgresql://f1111323_base:lJS2b1O3@localhost:5432/f1111323_base

# ИЛИ отдельные переменные для db.js
PGHOST=localhost
PGPORT=5432
PGDATABASE=f1111323_base
PGUSER=f1111323_base
PGPASSWORD=lJS2b1O3
```

### Вариант 2: БД на удаленном сервере (замените YOUR_DB_HOST)

```env
# Параметры БД для приложения
DB_HOST=YOUR_DB_HOST  # Внешний IP или доменное имя из GUI провайдера
DB_PORT=5432  # Может отличаться, проверьте в GUI
DB_NAME=f1111323_base
DB_USER=f1111323_base
DB_PASSWORD=lJS2b1O3

# Для db.js БЕЗ SSL
PG_CONNECTION_STRING=postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base

# Для db.js С SSL (если требуется провайдером)
PG_CONNECTION_STRING=postgresql://f1111323_base:lJS2b1O3@YOUR_DB_HOST:5432/f1111323_base?sslmode=require

# ИЛИ отдельные переменные для db.js
PGHOST=YOUR_DB_HOST
PGPORT=5432
PGDATABASE=f1111323_base
PGUSER=f1111323_base
PGPASSWORD=lJS2b1O3
PGSSLMODE=require  # если требуется SSL
```

---

## ✅ Быстрая проверка подключения:

```bash
# Проверка версии PostgreSQL
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT version();"

# Проверка размера БД
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT pg_size_pretty(pg_database_size('f1111323_base'));"

# Проверка количества таблиц
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

