# 🔍 ПРОВЕРКА: Будет ли дублирование при повторном импорте

## ❓ Ваша ситуация:

Вы уже пытались импортировать бэкап, но получили много ошибок:
- "permission denied" - таблицы НЕ создались
- "role f1111323_yoddle does not exist" - ошибки прав

## ✅ Что произошло при первом импорте:

Судя по ошибкам, **таблицы НЕ были созданы** из-за проблем с правами доступа. Поэтому при повторном импорте дублирования быть не должно.

---

## 🔍 ПРОВЕРКА: Проверьте текущее состояние БД

Перед повторным импортом проверьте, что уже есть в БД:

```bash
# Проверьте список таблиц
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"

# ИЛИ от postgres:
sudo -u postgres psql yoddle_db -c "\dt"
```

### Если таблиц НЕТ или их очень мало:

✅ **Можно импортировать** - дублирования не будет, так как таблицы не созданы.

### Если таблиц МНОГО:

⚠️ **Нужно решить:**
- Очистить БД и импортировать заново (чистый импорт)
- Или импортировать с игнорированием ошибок "relation already exists"

---

## 🎯 РЕКОМЕНДУЕМЫЙ ПОДХОД:

### Вариант 1: Очистить БД и импортировать заново (РЕКОМЕНДУЕТСЯ)

```bash
# 1. Удалите БД и создайте заново
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS yoddle_db;
CREATE DATABASE yoddle_db OWNER yoddle_user;
\c yoddle_db
ALTER SCHEMA public OWNER TO yoddle_user;
\q
EOF

# 2. Импортируйте бэкап от postgres
cd /root/yoddle
sudo -u postgres psql yoddle_db -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log

# 3. Дайте права пользователю
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

### Вариант 2: Импортировать поверх существующего (если таблицы частично созданы)

```bash
# Импорт с игнорированием ошибок "already exists"
cd /root/yoddle
sudo -u postgres psql yoddle_db -f public/backup_full1.sql 2>&1 | grep -v "already exists" | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

⚠️ **Внимание**: При этом варианте могут быть проблемы с данными, если таблицы уже частично заполнены.

---

## ✅ ПОСЛЕ ИМПОРТА: Проверьте результат

```bash
# Проверьте количество таблиц
sudo -u postgres psql yoddle_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Проверьте основные таблицы
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"

# Проверьте данные
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM enter;"
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM benefits;"
```

---

## 💡 РЕКОМЕНДАЦИЯ:

**Лучше очистить БД и импортировать заново** - так будет чище и без проблем с дублированием.

Выполните команды из Варианта 1 выше.




