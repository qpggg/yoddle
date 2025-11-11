# 🔍 ПРОВЕРКА ИМПОРТА ФУНКЦИЙ И ИСПРАВЛЕНИЕ

## ⚠️ ВАЖНО: Проверьте функции!

Ошибки про роль `f1111323_yoddle` могут означать, что функции не импортировались правильно.

---

## 🔍 ШАГ 1: Проверьте, какие функции есть в БД

```bash
# Проверьте список функций
sudo -u postgres psql yoddle_db -c "SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;"

# ИЛИ более подробно:
sudo -u postgres psql yoddle_db -c "\df"
```

---

## ✅ ШАГ 2: Создайте роль f1111323_yoddle (если функций нет)

Если функций мало или их нет, создайте роль и переимпортируйте:

```bash
# Создайте роль f1111323_yoddle
sudo -u postgres psql << EOF
CREATE ROLE f1111323_yoddle;
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO f1111323_yoddle;
\c yoddle_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO f1111323_yoddle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO f1111323_yoddle;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO f1111323_yoddle;
\q
EOF
```

---

## 🔄 ШАГ 3: Переимпортируйте функции (если нужно)

### Вариант A: Переимпортируйте только функции из бэкапа

```bash
# Извлеките только функции из бэкапа и импортируйте
cd /root/yoddle
grep -A 50 "CREATE FUNCTION" public/backup_full1.sql > functions_only.sql

# Импортируйте функции
sudo -u postgres psql yoddle_db -f functions_only.sql 2>&1 | tee functions_import.log
```

### Вариант B: Переимпортируйте весь бэкап заново (после создания роли)

```bash
# 1. Удалите БД и создайте заново
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS yoddle_db;
CREATE DATABASE yoddle_db OWNER yoddle_user;
\c yoddle_db
ALTER SCHEMA public OWNER TO yoddle_user;
CREATE ROLE f1111323_yoddle;
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO f1111323_yoddle;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO f1111323_yoddle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO f1111323_yoddle;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO f1111323_yoddle;
\q
EOF

# 2. Импортируйте бэкап заново
cd /root/yoddle
sudo -u postgres psql yoddle_db -f public/backup_full1.sql 2>&1 | tee import_log_clean_$(date +%Y%m%d_%H%M%S).log

# 3. Дайте права пользователю yoddle_user
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

---

## 🔍 ШАГ 4: Проверьте критичные функции

Проверьте наличие важных функций:

```bash
# Проверьте функции продуктивности
sudo -u postgres psql yoddle_db -c "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%productivity%';"

# Проверьте функции расчета
sudo -u postgres psql yoddle_db -c "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%calculate%';"

# Проверьте все функции
sudo -u postgres psql yoddle_db -c "\df"
```

---

## 📋 ОЖИДАЕМЫЕ ФУНКЦИИ (из ошибок):

Должны быть функции типа:
- `calculate_productivity_score`
- `check_productivity_achievements`
- `get_productivity_level`
- И другие функции из бэкапа

---

## ✅ РЕКОМЕНДУЕМЫЙ ПОДХОД:

1. **Сначала проверьте** - сколько функций есть сейчас
2. **Если функций мало** - создайте роль `f1111323_yoddle` и переимпортируйте
3. **Если функций достаточно** - просто дайте права пользователю

Выполните проверку и сообщите результат!




