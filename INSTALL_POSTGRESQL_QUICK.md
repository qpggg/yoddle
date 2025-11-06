# 🚀 БЫСТРАЯ УСТАНОВКА POSTGRESQL И СОЗДАНИЕ БД

## ✅ Ваша ситуация:

- PostgreSQL НЕ установлен (`systemctl status postgresql` - не найден)
- Пользователь `postgres` не существует

## 📋 ПОЛНАЯ ИНСТРУКЦИЯ:

### ШАГ 1: Установите PostgreSQL

```bash
# Обновите список пакетов
apt update

# Установите PostgreSQL сервер и клиент
apt install -y postgresql postgresql-contrib

# Запустите PostgreSQL
systemctl start postgresql

# Включите автозапуск при загрузке сервера
systemctl enable postgresql

# Проверьте статус (должен быть "active")
systemctl status postgresql
```

### ШАГ 2: Проверьте установку

```bash
# Проверьте версию
psql --version

# Проверьте, что пользователь postgres создан
id postgres

# Должно показать что-то вроде:
# uid=XXX(postgres) gid=XXX(postgres) groups=XXX(postgres)
```

### ШАГ 3: Создайте БД и пользователя

```bash
# Подключитесь к PostgreSQL от имени пользователя postgres
sudo -u postgres psql
```

В psql выполните:

```sql
-- Создайте базу данных
CREATE DATABASE yoddle_db;

-- Создайте пользователя с паролем (замените 'ваш_пароль' на реальный)
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_пароль';

-- Дайте права на базу данных
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;

-- Подключитесь к созданной БД
\c yoddle_db

-- Дайте права на схему public
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;

-- Выйдите из psql
\q
```

### ИЛИ одной командой (без входа в psql):

```bash
sudo -u postgres psql << EOF
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\c yoddle_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
EOF
```

**Замените `ваш_пароль` на реальный пароль!**

### ШАГ 4: Проверьте создание БД

```bash
# Проверьте подключение к новой БД
# Замените YOUR_PASSWORD на пароль, который вы указали
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"

# Проверьте список баз данных
sudo -u postgres psql -c "\l" | grep yoddle_db
```

---

## 🎯 ВСЕ КОМАНДЫ ОДНИМ БЛОКОМ:

```bash
# 1. Установка PostgreSQL
apt update
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 2. Проверка
psql --version
id postgres

# 3. Создание БД (замените 'ваш_пароль' на реальный пароль)
sudo -u postgres psql << EOF
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\c yoddle_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
EOF

# 4. Проверка подключения (замените YOUR_PASSWORD)
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"
```

---

## ✅ После успешного создания БД:

Продолжите с импортом бэкапа (см. `CREATE_DB_ON_SERVER.md`, Шаг 5)

