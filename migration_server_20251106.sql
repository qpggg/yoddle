-- =====================================================
-- МИГРАЦИЯ БД НА СЕРВЕР
-- Дата: 2025-11-06
-- Версия: 1.0
-- Описание: Миграция изменений БД на сервер
-- =====================================================

-- ВАЖНО: Перед применением сделайте бэкап БД!
-- Команда для бэкапа:
-- pg_dump -U yoddle_user -d yoddle_db -h localhost > backup_before_migration_20251106.sql

BEGIN;

-- =====================================================
-- 1. СОЗДАНИЕ ТАБЛИЦ (если нужно)
-- =====================================================

-- Пример создания таблицы:
-- CREATE TABLE IF NOT EXISTS migration_log (
--     id SERIAL PRIMARY KEY,
--     migration_name VARCHAR(255) NOT NULL,
--     applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     status VARCHAR(50) DEFAULT 'success'
-- );

-- =====================================================
-- 2. ИЗМЕНЕНИЕ СТРУКТУРЫ ТАБЛИЦ
-- =====================================================

-- Пример добавления колонки:
-- ALTER TABLE enter ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Пример изменения типа данных:
-- ALTER TABLE table_name ALTER COLUMN column_name TYPE VARCHAR(500);

-- =====================================================
-- 3. СОЗДАНИЕ ИНДЕКСОВ
-- =====================================================

-- Пример создания индекса:
-- CREATE INDEX IF NOT EXISTS idx_enter_login ON enter(login);
-- CREATE INDEX IF NOT EXISTS idx_enter_email ON enter(email);

-- =====================================================
-- 4. СОЗДАНИЕ ФУНКЦИЙ
-- =====================================================

-- Пример создания функции:
-- CREATE OR REPLACE FUNCTION update_last_login()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.last_login_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- =====================================================
-- 5. СОЗДАНИЕ ТРИГГЕРОВ
-- =====================================================

-- Пример создания триггера:
-- CREATE TRIGGER trigger_update_last_login
--     BEFORE UPDATE ON enter
--     FOR EACH ROW
--     EXECUTE FUNCTION update_last_login();

-- =====================================================
-- 6. ОБНОВЛЕНИЕ ДАННЫХ (если нужно)
-- =====================================================

-- Пример обновления данных:
-- UPDATE enter SET status = 'active' WHERE status IS NULL;

-- =====================================================
-- 7. ПРОВЕРКА ПРИМЕНЕНИЯ
-- =====================================================

-- Проверка структуры таблиц:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name, ordinal_position;

-- Проверка индексов:
-- SELECT tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public';

-- Проверка функций:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public';

COMMIT;

-- =====================================================
-- ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ НА СЕРВЕРЕ
-- =====================================================

-- 1. Подключитесь к серверу:
--    ssh root@your_server_ip

-- 2. Перейдите в папку проекта:
--    cd /root/yoddle

-- 3. Обновите код из репозитория:
--    git checkout stable
--    git pull origin stable

-- 4. Сделайте бэкап БД:
--    pg_dump -U yoddle_user -d yoddle_db -h localhost > backup_before_migration_20251106.sql

-- 5. Примените миграцию:
--    psql -U yoddle_user -d yoddle_db -h localhost -f migration_server_20251106.sql

-- 6. Проверьте результат:
--    psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT 'Миграция применена успешно!' AS result;"

-- =====================================================
-- ОТКАТ МИГРАЦИИ (если нужно)
-- =====================================================

-- В случае необходимости отката используйте бэкап:
-- psql -U yoddle_user -d yoddle_db -h localhost < backup_before_migration_20251106.sql

-- Или выполните команды отката вручную:
-- BEGIN;
-- -- Команды отката здесь
-- COMMIT;

