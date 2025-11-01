-- ===================================================================
-- ПРОВЕРКА РАБОТОСПОСОБНОСТИ БД YODDLE
-- Простые SELECT запросы для проверки всех основных таблиц
-- ===================================================================

-- 1. Проверка подключения и базовой информации
SELECT 
    current_database() as database_name,
    version() as postgresql_version,
    current_user as current_user,
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

-- 8. Проверка транзакций кошелька (если есть)
SELECT 
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    COUNT(DISTINCT user_id) as users_with_transactions
FROM coin_transactions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coin_transactions');

-- 9. Проверка балансов пользователей (если есть)
SELECT 
    COUNT(*) as total_balances,
    SUM(balance) as total_balance,
    SUM(total_earned) as total_earned_all_time
FROM user_balance
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_balance');

-- 10. Общая статистика БД
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_count,
    (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public') as sequences_count;

-- 11. Проверка индексов (для производительности)
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname
LIMIT 20;

-- 12. Проверка последних записей (примеры данных)
SELECT 'Последние 5 пользователей:' as info;
SELECT id, name, login, position, created_at 
FROM enter 
ORDER BY id DESC 
LIMIT 5;

SELECT 'Последние 5 активностей:' as info;
SELECT id, user_id, action, xp_earned, created_at 
FROM activity_log 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Последние 5 лидов из Telegram:' as info;
SELECT id, first_name, email, role, created_at 
FROM telegram_leads 
ORDER BY created_at DESC 
LIMIT 5;

-- 13. Проверка целостности данных (foreign keys)
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = 'public'::regnamespace
LIMIT 10;

