# 🔧 РЕШЕНИЕ ОШИБОК ПРИ ИМПОРТЕ БЭКАПА

## ❌ Проблемы:

1. **"permission denied for schema public"** - недостаточно прав
2. **"role f1111323_yoddle does not exist"** - старые роли из Docker БД
3. **"unrecognized configuration parameter transaction_timeout"** - параметр Supabase

## ✅ РЕШЕНИЕ 1: Дайте пользователю права владельца БД

```bash
# Подключитесь от имени postgres
sudo -u postgres psql

# В psql выполните:
```

```sql
-- Сделайте пользователя владельцем БД
ALTER DATABASE yoddle_db OWNER TO yoddle_user;

-- Подключитесь к БД
\c yoddle_db

-- Дайте пользователю права на схему public
ALTER SCHEMA public OWNER TO yoddle_user;

-- Выйдите
\q
```

### Или одной командой:

```bash
sudo -u postgres psql << EOF
ALTER DATABASE yoddle_db OWNER TO yoddle_user;
\c yoddle_db
ALTER SCHEMA public OWNER TO yoddle_user;
\q
EOF
```

---

## ✅ РЕШЕНИЕ 2: Импортируйте от имени postgres (рекомендуется)

Если права не помогают, импортируйте от имени postgres:

```bash
# Импорт от имени postgres (без пароля, так как локальное подключение)
sudo -u postgres psql yoddle_db -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

После импорта дайте права пользователю `yoddle_user`:

```bash
sudo -u postgres psql yoddle_db << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
EOF
```

---

## ✅ РЕШЕНИЕ 3: Создайте старую роль (если нужно)

Если бэкап требует роль `f1111323_yoddle`, создайте её:

```bash
sudo -u postgres psql << EOF
CREATE ROLE f1111323_yoddle;
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO f1111323_yoddle;
\c yoddle_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO f1111323_yoddle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO f1111323_yoddle;
\q
EOF
```

---

## 🎯 РЕКОМЕНДУЕМЫЙ ПОРЯДОК ДЕЙСТВИЙ:

### Шаг 1: Дайте права владельца

```bash
sudo -u postgres psql << EOF
ALTER DATABASE yoddle_db OWNER TO yoddle_user;
\c yoddle_db
ALTER SCHEMA public OWNER TO yoddle_user;
\q
EOF
```

### Шаг 2: Импортируйте от имени postgres

```bash
cd /root/yoddle
sudo -u postgres psql yoddle_db -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

### Шаг 3: Дайте права пользователю yoddle_user после импорта

```bash
sudo -u postgres psql yoddle_db << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO yoddle_user;
\q
EOF
```

### Шаг 4: Проверьте импорт

```bash
# Проверьте таблицы
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"

# Проверьте количество записей
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM enter;"
```

---

## 📝 Примечания:

- Ошибки про `transaction_timeout` можно игнорировать - это параметр Supabase
- Ошибки про `\N` и `\n` в конце - это проблемы с форматом COPY, но данные должны импортироваться
- Ошибки про `f1111323_yoddle` можно игнорировать, если импортируете от postgres
- Главное - проверить, что таблицы созданы и данные импортированы




