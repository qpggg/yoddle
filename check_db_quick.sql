-- ===================================================================
-- БЫСТРАЯ ПРОВЕРКА РАБОТОСПОСОБНОСТИ БД YODDLE
-- Простые SELECT запросы для проверки основных таблиц
-- ===================================================================

-- 1. Проверка подключения
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    now() as current_time;

-- 2. Проверка существования основных таблиц
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. Проверка пользователей (таблица enter)
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN login IS NOT NULL THEN 1 END) as users_with_login,
    COUNT(CASE WHEN password IS NOT NULL THEN 1 END) as users_with_password
FROM enter;

-- 4. Проверка льгот (таблица benefits)
SELECT 
    COUNT(*) as total_benefits,
    COUNT(DISTINCT category) as categories_count
FROM benefits;

-- 5. Проверка прогресса пользователей (таблица user_progress)
SELECT 
    COUNT(*) as total_progress_records,
    SUM(xp) as total_xp,
    AVG(level) as average_level,
    MAX(level) as max_level
FROM user_progress;

-- 6. Проверка активности (таблица activity_log)
SELECT 
    COUNT(*) as total_activities,
    COUNT(DISTINCT user_id) as active_users,
    MAX(created_at) as last_activity
FROM activity_log;

-- 7. Проверка лидов из Telegram бота
SELECT 
    COUNT(*) as total_telegram_leads,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as leads_with_email,
    COUNT(DISTINCT role) as unique_roles
FROM telegram_leads;

-- 8. Общая статистика БД
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_count;

-- 9. Примеры данных (последние 3 записи)
SELECT 'Последние 3 пользователя:' as info;
SELECT id, name, login, position 
FROM enter 
ORDER BY id DESC 
LIMIT 3;

SELECT 'Последние 3 активности:' as info;
SELECT id, user_id, action, xp_earned, created_at 
FROM activity_log 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'Последние 3 лида из Telegram:' as info;
SELECT id, first_name, email, role, created_at 
FROM telegram_leads 
ORDER BY created_at DESC 
LIMIT 3;

