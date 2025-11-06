# 🔧 РЕШЕНИЕ ОШИБКИ "unknown user postgres"

## ❌ Ошибка:

```
sudo: unknown user postgres
sudo: error initializing audit plugin sudoers_audit
```

## ✅ Что это означает:

Пользователь `postgres` не был создан при установке PostgreSQL, или PostgreSQL установлен некорректно.

---

## 🔍 ШАГ 1: Проверьте установку PostgreSQL

```bash
# Проверьте, установлен ли PostgreSQL
which psql
psql --version

# Проверьте статус службы
systemctl status postgresql

# Проверьте, существует ли пользователь postgres
id postgres
```

---

## 🔧 ШАГ 2: Решение проблемы

### Вариант 1: Переустановите PostgreSQL (рекомендуется)

```bash
# Удалите PostgreSQL полностью
apt remove --purge postgresql postgresql-* -y
apt autoremove -y

# Очистите кэш пакетов
apt clean

# Обновите список пакетов
apt update

# Установите PostgreSQL заново
apt install -y postgresql postgresql-contrib

# Проверьте, что пользователь создан
id postgres

# Запустите PostgreSQL
systemctl start postgresql
systemctl enable postgresql
```

### Вариант 2: Создайте пользователя postgres вручную

```bash
# Создайте системного пользователя postgres
useradd -r -s /bin/bash postgres

# Создайте домашнюю директорию
mkdir -p /var/lib/postgresql
chown postgres:postgres /var/lib/postgresql

# Проверьте создание
id postgres
```

### Вариант 3: Используйте root для создания БД (быстрое решение)

Если не хотите переустанавливать PostgreSQL, можно использовать `root`:

```bash
# Убедитесь, что PostgreSQL запущен
systemctl start postgresql

# Подключитесь к PostgreSQL от имени root
psql postgres

# ИЛИ попробуйте без указания пользователя:
psql
```

---

## 📋 ШАГ 3: Создайте БД без использования sudo -u postgres

### Способ 1: Используя psql напрямую

```bash
# Подключитесь к PostgreSQL
psql postgres

# В psql выполните:
```

```sql
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\c yoddle_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
```

### Способ 2: Одной командой без sudo

```bash
psql postgres << EOF
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

---

## 🔍 ШАГ 4: Проверьте подключение к БД

```bash
# Проверьте подключение (замените YOUR_PASSWORD на пароль)
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"

# ИЛИ если подключение от root работает без пароля:
psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"
```

---

## 🆘 Если psql не работает:

### Проверьте конфигурацию PostgreSQL

```bash
# Найдите файл конфигурации
find /etc -name "pg_hba.conf" 2>/dev/null

# Или проверьте стандартное расположение
ls -la /etc/postgresql/*/main/pg_hba.conf

# Отредактируйте файл для разрешения локальных подключений
nano /etc/postgresql/*/main/pg_hba.conf

# Убедитесь, что есть строка:
# local   all             all                                     peer
# или
# local   all             all                                     trust

# Перезапустите PostgreSQL
systemctl restart postgresql
```

---

## 💡 Быстрое решение (если ничего не помогает):

```bash
# 1. Установите PostgreSQL клиент (если еще не установлен)
apt update
apt install -y postgresql-client

# 2. Попробуйте подключиться напрямую
psql -h localhost -U postgres -d postgres

# Если не работает, попробуйте:
psql -h 127.0.0.1 -U postgres -d postgres

# Или без указания пользователя:
psql -h localhost -d postgres
```

---

## ✅ После успешного создания БД:

Продолжите с импортом бэкапа (см. `CREATE_DB_ON_SERVER.md`, Шаг 5)

