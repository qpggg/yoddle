-- =====================================================
-- ВРЕМЕННОЕ ОТКЛЮЧЕНИЕ ТРИГГЕРА ПРОДУКТИВНОСТИ
-- =====================================================
-- Этот скрипт отключает триггер, который вызывает ошибку с достижениями

-- 1. Проверяем существующие триггеры на таблице ai_signals
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'ai_signals';

-- 2. Отключаем триггер trigger_productivity_calculation
ALTER TABLE ai_signals DISABLE TRIGGER trigger_productivity_calculation;

-- 3. Проверяем статус триггера
SELECT 
    schemaname,
    tablename,
    triggername,
    tgenabled
FROM pg_trigger 
WHERE triggername = 'trigger_productivity_calculation';

-- 4. Альтернативно - можно полностью удалить триггер (если нужно)
-- DROP TRIGGER IF EXISTS trigger_productivity_calculation ON ai_signals;

-- 5. Проверяем, что триггер отключен
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'ai_signals';
