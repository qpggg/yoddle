-- ===================================================================
-- ЕЖЕМЕСЯЧНОЕ ОБНУЛЕНИЕ РЕЙТИНГА ПРОДУКТИВНОСТИ
-- ===================================================================
-- Скрипт для обнуления рейтинга продуктивности в начале каждого месяца
-- Можно запускать через cron или планировщик задач
-- ===================================================================

-- Функция для обнуления рейтинга всех пользователей
CREATE OR REPLACE FUNCTION reset_monthly_productivity_rating()
RETURNS TABLE(
    user_id INTEGER,
    old_rating NUMERIC,
    reset_date DATE
) AS $$
DECLARE
    v_reset_date DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
    -- Обнуляем рейтинг в user_progress
    UPDATE user_progress
    SET productivity_score = 0.0
    WHERE productivity_score > 0;
    
    -- Очищаем таблицу productivity_scores за предыдущий месяц
    DELETE FROM productivity_scores
    WHERE date < v_reset_date;
    
    -- Возвращаем информацию о сбросе
    RETURN QUERY
    SELECT 
        up.user_id,
        up.productivity_score as old_rating,
        v_reset_date as reset_date
    FROM user_progress up
    WHERE up.productivity_score = 0.0;
END;
$$ LANGUAGE plpgsql;

-- Проверка функции
-- SELECT * FROM reset_monthly_productivity_rating();

-- ===================================================================
-- АВТОМАТИЧЕСКИЙ ЗАПУСК ЧЕРЕЗ CRON (пример для PostgreSQL pg_cron)
-- ===================================================================
-- Если установлен pg_cron, можно настроить автоматический запуск:
-- SELECT cron.schedule('reset-productivity-rating', '0 0 1 * *', 'SELECT reset_monthly_productivity_rating();');
-- 
-- Или через внешний планировщик (systemd, cron на сервере):
-- 0 0 1 * * psql -U yoddle_user -d yoddle_db -c "SELECT reset_monthly_productivity_rating();"
-- ===================================================================
