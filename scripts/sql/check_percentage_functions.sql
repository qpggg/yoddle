-- Проверка функций расчета процентов настроения

-- 1. Проверяем существование функций
SELECT 
    proname,
    pg_get_function_identity_arguments(oid) as signature
FROM pg_proc 
WHERE proname IN ('get_weekly_average_percentages', 'get_weekly_mood_percentages');

-- 2. Тестируем функцию get_weekly_average_percentages для пользователя 3
SELECT 'Результат get_weekly_average_percentages(3):' as info;
SELECT * FROM get_weekly_average_percentages(3);

-- 3. Ручной расчет процентов для пользователя 3 за последние 7 дней
SELECT 'Ручной расчет процентов за последние 7 дней:' as info;
SELECT 
    ROUND(AVG(mood_rating) * 10, 1) as mood_percent,
    ROUND(AVG(energy_rating) * 10, 1) as energy_percent,
    ROUND(AVG(10 - stress_rating) * 10, 1) as calmness_percent,
    COUNT(*) as records_count
FROM ai_signals
WHERE user_id = 3
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- 4. Проверяем рейтинг продуктивности - детальный расчет
SELECT 'Детальный расчет рейтинга для пользователя 3:' as info;

WITH mood_calc AS (
    SELECT 
        COUNT(*) as entries,
        SUM(mood_rating + COALESCE(energy_rating, 5) + (10 - COALESCE(stress_rating, 5))) as total_score
    FROM ai_signals
    WHERE user_id = 3
    AND type IN ('mood', 'daily_mood_check')
    AND DATE(timestamp) <= CURRENT_DATE
),
activity_calc AS (
    SELECT 
        COUNT(*) FILTER (WHERE success_rating >= 7) as successful,
        COUNT(*) FILTER (WHERE success_rating < 7) as failed
    FROM ai_signals
    WHERE user_id = 3
    AND type IN ('activity', 'activity_analysis')
    AND DATE(timestamp) <= CURRENT_DATE
),
platform_calc AS (
    SELECT COUNT(*) as actions
    FROM (
        SELECT 1 FROM ai_signals WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM activity_log WHERE user_id = 3 AND DATE(created_at) = CURRENT_DATE
    ) AS a
)
SELECT 
    m.entries as mood_entries,
    m.total_score,
    ROUND(m.total_score / NULLIF(m.entries, 0) / 3.0, 4) as avg_mood_component,
    COALESCE(a.successful, 0) as successful_activities,
    COALESCE(a.failed, 0) as failed_activities,
    COALESCE(p.actions, 0) as daily_actions,
    GREATEST(0.6, LEAST(COALESCE(p.actions, 0)::DECIMAL / 10.0, 1.0)) as platform_coefficient,
    ROUND((
        (m.total_score / NULLIF(m.entries, 0) / 3.0) +
        (COALESCE(a.successful, 0) * 0.5) +
        (COALESCE(a.failed, 0) * (-0.5))
    ) * 1.2 * GREATEST(0.6, LEAST(COALESCE(p.actions, 0)::DECIMAL / 10.0, 1.0)), 2) as calculated_rating,
    calculate_productivity_score(3, CURRENT_DATE) as function_rating,
    ABS(calculate_productivity_score(3, CURRENT_DATE) - (
        (m.total_score / NULLIF(m.entries, 0) / 3.0) +
        (COALESCE(a.successful, 0) * 0.5) +
        (COALESCE(a.failed, 0) * (-0.5))
    ) * 1.2 * GREATEST(0.6, LEAST(COALESCE(p.actions, 0)::DECIMAL / 10.0, 1.0))) as difference
FROM mood_calc m
CROSS JOIN activity_calc a
CROSS JOIN platform_calc p;
