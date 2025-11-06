# 🔧 РЕШЕНИЕ ОШИБКИ "Tenant or user not found"

## ❌ Проблема:

Ошибка `Tenant or user not found` с `TLSSocket` означает, что приложение пытается подключиться к Supabase/managed PostgreSQL вместо локальной БД.

## 🔍 ПРИЧИНА:

В `db.js` есть логика, которая определяет Supabase по hostname и включает SSL. Но для localhost SSL не нужен и может вызывать проблемы.

---

## ✅ РЕШЕНИЕ:

### ШАГ 1: Проверьте строку подключения в .env

```bash
cd /root/yoddle
cat .env | grep PG_CONNECTION_STRING
```

Должно быть:
```
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db
```

**БЕЗ** `?sslmode=require` или других SSL параметров.

### ШАГ 2: Убедитесь, что SSL отключен для localhost

Добавьте явное отключение SSL в строку подключения:

```bash
cd /root/yoddle
nano .env
```

Измените строку подключения на:

```env
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db?sslmode=disable
```

Сохраните (Ctrl+O, Enter, Ctrl+X)

### ШАГ 3: Проверьте, нет ли других переменных окружения

```bash
# Проверьте все переменные PG*
env | grep PG
```

Убедитесь, что нет старых переменных от Supabase.

### ШАГ 4: Перезапустите приложение

```bash
pm2 restart all
pm2 logs yoddle-api --lines 50
```

---

## 🔧 АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ: Используйте отдельные переменные

Если строка подключения не работает, используйте отдельные переменные:

```bash
cd /root/yoddle
nano .env
```

Закомментируйте `PG_CONNECTION_STRING` и используйте:

```env
# PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db?sslmode=disable

PGHOST=localhost
PGPORT=5432
PGDATABASE=yoddle_db
PGUSER=yoddle_user
PGPASSWORD=1WIzL7aP_F
```

---

## 🎯 БЫСТРОЕ РЕШЕНИЕ:

```bash
# 1. Обновите .env с явным отключением SSL
cd /root/yoddle
cat >> .env << 'EOF'

# Явно отключаем SSL для localhost
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db?sslmode=disable
EOF

# 2. Перезапустите приложение
pm2 restart all

# 3. Проверьте логи
pm2 logs yoddle-api --lines 30
```

---

## 📋 ПРОВЕРКА:

После обновления проверьте:

```bash
# Проверьте подключение к БД напрямую
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT 1;"

# Проверьте логи приложения
pm2 logs yoddle-api --lines 30
```

Ошибка "Tenant or user not found" должна исчезнуть.

Выполните команды и сообщите результат!

