# 🔍 БЫСТРАЯ ПРОВЕРКА РАБОТОСПОСОБНОСТИ БД

## Проверка БД в Docker (локально):

### Вариант 1: Быстрая проверка (PowerShell)

```powershell
# Установите переменную пароля
$env:PGPASSWORD="Nei3wmOK"

# Проверка подключения
psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -c "SELECT current_database(), current_user, now();"

# Проверка количества записей в основных таблицах
psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -c "SELECT COUNT(*) as users FROM enter;"
psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -c "SELECT COUNT(*) as benefits FROM benefits;"
psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -c "SELECT COUNT(*) as telegram_leads FROM telegram_leads;"
psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -c "SELECT COUNT(*) as activities FROM activity_log;"
```

### Вариант 2: Полная проверка через скрипт

```powershell
# Запустите скрипт проверки
$env:PGPASSWORD="Nei3wmOK"
psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -f check_db_quick.sql
```

### Вариант 3: Интерактивная проверка

```powershell
# Подключитесь к БД
$env:PGPASSWORD="Nei3wmOK"
psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full

# В psql выполните:
SELECT COUNT(*) FROM enter;
SELECT COUNT(*) FROM benefits;
SELECT COUNT(*) FROM telegram_leads;
SELECT COUNT(*) FROM user_progress;
\dt  -- список таблиц
\q   -- выход
```

---

## Проверка БД на сервере (после переноса):

```bash
# Быстрая проверка подключения
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT current_database(), current_user, now();"

# Проверка количества записей
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM enter;"
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM benefits;"
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM telegram_leads;"

# Полная проверка через скрипт
psql -U yoddle_user -d yoddle_db -h localhost -f check_database_health.sql
```

---

## ✅ Чеклист работоспособности:

- [ ] Подключение к БД работает
- [ ] Таблица `enter` существует и содержит данные
- [ ] Таблица `benefits` существует и содержит данные
- [ ] Таблица `telegram_leads` существует (может быть пустой)
- [ ] Таблица `user_progress` существует
- [ ] Таблица `activity_log` существует
- [ ] Количество записей совпадает с ожидаемым

---

## 🎯 Минимальная проверка (одна команда):

```powershell
# Проверка всех основных таблиц одной командой
$env:PGPASSWORD="Nei3wmOK"; psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -c "SELECT 'enter' as table_name, COUNT(*) as count FROM enter UNION ALL SELECT 'benefits', COUNT(*) FROM benefits UNION ALL SELECT 'telegram_leads', COUNT(*) FROM telegram_leads UNION ALL SELECT 'user_progress', COUNT(*) FROM user_progress;"
```

