-- ===================================================================
-- ДИАГНОСТИКА ПРОБЛЕМЫ С РЕЙТИНГОМ ДЛЯ ПОЛЬЗОВАТЕЛЯ ID 4
-- ===================================================================

-- 1. Проверяем что возвращает функция calculate_productivity_score
SELECT 
    'calculate_productivity_score' as function_name,
    calculate_productivity_score(4, CURRENT_DATE) as result;

-- 2. Проверяем коэффициент активности (как он рассчитывается сейчас)
WITH platform_actions AS (
    SELECT COUNT(*) as actions_count
    FROM ai_signals 
    WHERE user_id = 4 
    AND DATE(timestamp) = CURRENT_DATE
)
SELECT 
    'Текущий расчет коэффициента' as info,
    (SELECT actions_count FROM platform_actions) as actions_from_ai_signals,
    (SELECT actions_count FROM platform_actions)::DECIMAL / 10.0 as calculated_coefficient,
    LEAST((SELECT actions_count FROM platform_actions)::DECIMAL / 10.0, 1.0) as current_coefficient,
    GREATEST(0.6, LEAST((SELECT actions_count FROM platform_actions)::DECIMAL / 10.0, 1.0)) as should_be_coefficient;

-- 3. Проверяем действия из activity_log
SELECT 
    'Действия из activity_log за сегодня' as info,
    COUNT(*) as actions_count,
    action,
    description
FROM activity_log
WHERE user_id = 4 
AND DATE(created_at) = CURRENT_DATE
GROUP BY action, description
ORDER BY actions_count DESC;

-- 4. Проверяем что в productivity_scores
SELECT 
    'Данные в productivity_scores' as info,
    date,
    daily_score,
    mood_component,
    activity_component,
    platform_activity_coefficient,
    final_score,
    mood_entries_count,
    activity_entries_count
FROM productivity_scores
WHERE user_id = 4
ORDER BY date DESC
LIMIT 5;

-- 5. Проверяем что возвращает get_user_productivity_stats
SELECT 
    'get_user_productivity_stats' as function_name,
    overall_rating,
    total_records,
    mood_average,
    activity_average
FROM get_user_productivity_stats(4);
