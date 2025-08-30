-- =====================================================
-- ОТКЛЮЧЕНИЕ ТРИГГЕРА ПРОДУКТИВНОСТИ
-- =====================================================
-- Отключаем триггер, который вызывает ошибку с достижениями

-- Отключаем триггер ai_signals_productivity_trigger
ALTER TABLE ai_signals DISABLE TRIGGER ai_signals_productivity_trigger;

-- Проверяем статус триггера
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as status
FROM pg_trigger 
WHERE tgname = 'ai_signals_productivity_trigger';
