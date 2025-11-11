# 🔍 ПРОВЕРКА ТАБЛИЦ ПОСЛЕ ИМПОРТА

## ✅ Команды для проверки таблиц:

### 1. Список всех таблиц:

```bash
# От пользователя yoddle_user
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"

# ИЛИ от postgres (более подробно)
sudo -u postgres psql yoddle_db -c "\dt"
```

### 2. Количество таблиц:

```bash
sudo -u postgres psql yoddle_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
```

### 3. Список таблиц с количеством записей:

```bash
sudo -u postgres psql yoddle_db << EOF
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
\q
EOF
```

### 4. Проверка основных таблиц:

```bash
# Проверьте наличие основных таблиц
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('enter', 'benefits', 'telegram_leads', 'user_progress', 'activity_log', 'ai_recommendations', 'ai_signals', 'feedback');"
```

### 5. Проверка данных в основных таблицах:

```bash
# Проверьте количество записей в основных таблицах
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db << EOF
SELECT 'enter' as table_name, COUNT(*) as count FROM enter
UNION ALL
SELECT 'benefits', COUNT(*) FROM benefits
UNION ALL
SELECT 'telegram_leads', COUNT(*) FROM telegram_leads
UNION ALL
SELECT 'user_progress', COUNT(*) FROM user_progress
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log
UNION ALL
SELECT 'ai_recommendations', COUNT(*) FROM ai_recommendations
UNION ALL
SELECT 'ai_signals', COUNT(*) FROM ai_signals
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback
ORDER BY table_name;
\q
EOF
```

### 6. Проверка структуры конкретной таблицы:

```bash
# Проверьте структуру таблицы enter
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\d enter"

# Проверьте структуру таблицы benefits
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\d benefits"
```

### 7. Проверка индексов:

```bash
sudo -u postgres psql yoddle_db -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';"
```

### 8. Проверка представлений (views):

```bash
sudo -u postgres psql yoddle_db -c "\dv"
```

---

## 📋 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:

После успешного импорта должно быть:
- ✅ ~29 таблиц (судя по бэкапу)
- ✅ Данные в таблицах (COPY операции показали импорт данных)
- ✅ Индексы созданы
- ✅ Представления (views) созданы

---

## 🎯 БЫСТРАЯ ПРОВЕРКА (все в одной команде):

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db << EOF
-- Количество таблиц
SELECT 'Tables:' as info, COUNT(*)::text as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
-- Количество функций
SELECT 'Functions:', COUNT(*)::text FROM information_schema.routines WHERE routine_schema = 'public'
UNION ALL
-- Количество представлений
SELECT 'Views:', COUNT(*)::text FROM information_schema.views WHERE table_schema = 'public'
UNION ALL
-- Количество индексов
SELECT 'Indexes:', COUNT(*)::text FROM pg_indexes WHERE schemaname = 'public';

-- Данные в основных таблицах
SELECT 'enter' as table_name, COUNT(*)::text as records FROM enter
UNION ALL
SELECT 'benefits', COUNT(*)::text FROM benefits
UNION ALL
SELECT 'telegram_leads', COUNT(*)::text FROM telegram_leads
UNION ALL
SELECT 'user_progress', COUNT(*)::text FROM user_progress;
\q
EOF
```

Выполните эти команды и сообщите результаты!




