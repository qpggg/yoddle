-- ===================================================================
-- ИСПРАВЛЕНИЕ ФУНКЦИЙ РАСЧЕТА ПРОЦЕНТОВ НАСТРОЕНИЯ
-- ===================================================================
-- Функции должны возвращать ПРАВИЛЬНЫЕ проценты (0-100) за последние 7 дней
-- ===================================================================

-- Удаляем старые функции
DROP FUNCTION IF EXISTS get_weekly_average_percentages(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_weekly_mood_percentages(INTEGER) CASCADE;

-- Создаем ПРАВИЛЬНУЮ функцию для средних процентов за неделю
CREATE FUNCTION get_weekly_average_percentages(p_user_id INTEGER)
RETURNS TABLE(
    mood_average NUMERIC,
    energy_average NUMERIC,
    calmness_average NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Настроение: среднее значение * 10 для получения процентов (0-100)
        COALESCE(ROUND(AVG(mood_rating) * 10, 1), 0) as mood_average,
        -- Энергия: среднее значение * 10 для получения процентов (0-100)
        COALESCE(ROUND(AVG(energy_rating) * 10, 1), 0) as energy_average,
        -- Спокойствие: среднее значение (10 - stress_rating) * 10 для получения процентов (0-100)
        COALESCE(ROUND(AVG(10 - stress_rating) * 10, 1), 0) as calmness_average
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
    AND timestamp < CURRENT_DATE + INTERVAL '1 day'; -- До конца текущего дня
END;
$$ LANGUAGE plpgsql;

-- Создаем ПРАВИЛЬНУЮ функцию для ежедневных процентов за неделю
CREATE FUNCTION get_weekly_mood_percentages(p_user_id INTEGER)
RETURNS TABLE(
    date DATE,
    day_name TEXT,
    mood_percent NUMERIC,
    energy_percent NUMERIC,
    calmness_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ai.timestamp) as date,
        TO_CHAR(ai.timestamp, 'Dy') as day_name,
        -- Настроение: среднее значение * 10 для получения процентов (0-100)
        COALESCE(ROUND(AVG(ai.mood_rating) * 10, 1), 0) as mood_percent,
        -- Энергия: среднее значение * 10 для получения процентов (0-100)
        COALESCE(ROUND(AVG(ai.energy_rating) * 10, 1), 0) as energy_percent,
        -- Спокойствие: среднее значение (10 - stress_rating) * 10 для получения процентов (0-100)
        COALESCE(ROUND(AVG(10 - ai.stress_rating) * 10, 1), 0) as calmness_percent
    FROM ai_signals ai
    WHERE ai.user_id = p_user_id
    AND ai.type IN ('mood', 'daily_mood_check')
    AND ai.timestamp >= CURRENT_DATE - INTERVAL '7 days'
    AND ai.timestamp < CURRENT_DATE + INTERVAL '1 day'
    GROUP BY DATE(ai.timestamp), TO_CHAR(ai.timestamp, 'Dy')
    ORDER BY DATE(ai.timestamp) DESC;
END;
$$ LANGUAGE plpgsql;

-- Проверка функций
SELECT 
    'Функции обновлены' as status,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as signature
FROM pg_proc 
WHERE proname IN ('get_weekly_average_percentages', 'get_weekly_mood_percentages')
ORDER BY proname;

-- Тест для пользователя 4
SELECT 'Тест для пользователя 4:' as info;
SELECT * FROM get_weekly_average_percentages(4);

-- Тест для пользователя 4 - ежедневные данные
SELECT 'Ежедневные данные для пользователя 4:' as info;
SELECT * FROM get_weekly_mood_percentages(4)
ORDER BY date DESC;

-- Сравнение: что должно быть (ручной расчет)
SELECT 'Ручной расчет для пользователя 4 (для сравнения):' as info;
SELECT 
    ROUND(AVG(mood_rating) * 10, 1) as mood_percent,
    ROUND(AVG(energy_rating) * 10, 1) as energy_percent,
    ROUND(AVG(10 - stress_rating) * 10, 1) as calmness_percent
FROM ai_signals
WHERE user_id = 4
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- Тест для пользователя 2 (должен вернуть 0, 0, 0 если нет данных)
SELECT 'Тест для пользователя 2 (нет данных):' as info;
SELECT * FROM get_weekly_average_percentages(2);

-- Тест для пользователя 3
SELECT 'Тест для пользователя 3:' as info;
SELECT * FROM get_weekly_average_percentages(3);
