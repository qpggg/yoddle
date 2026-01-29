-- ===================================================================
-- АНАЛИЗ ПРАВДИВОСТИ ДАННЫХ ДЛЯ ПОЛЬЗОВАТЕЛЯ 4
-- ===================================================================

-- 1. Все записи настроения за последние 7 дней для пользователя 4
SELECT 
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'Dy') as day_name,
    TO_CHAR(timestamp, 'HH24:MI') as time,
    mood_rating,
    energy_rating,
    stress_rating,
    (mood_rating + energy_rating + (10 - stress_rating)) as mood_score_component,
    notes
FROM ai_signals
WHERE user_id = 4
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY DATE(timestamp) DESC, timestamp DESC;

-- 2. Средние значения за неделю для пользователя 4
SELECT 
    'Средние за неделю (последние 7 дней)' as metric,
    COUNT(*) as records,
    ROUND(AVG(mood_rating), 2) as avg_mood,
    ROUND(AVG(energy_rating), 2) as avg_energy,
    ROUND(AVG(stress_rating), 2) as avg_stress,
    ROUND(AVG(10 - stress_rating), 2) as avg_calmness,
    -- Проценты (нормализуем на 10, умножаем на 10)
    ROUND(AVG(mood_rating) * 10, 1) as mood_percent,
    ROUND(AVG(energy_rating) * 10, 1) as energy_percent,
    ROUND(AVG(10 - stress_rating) * 10, 1) as calmness_percent
FROM ai_signals
WHERE user_id = 4
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- 3. Разбивка по дням для пользователя 4
SELECT 
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'Dy') as day_name,
    COUNT(*) as records,
    ROUND(AVG(mood_rating), 2) as avg_mood,
    ROUND(AVG(energy_rating), 2) as avg_energy,
    ROUND(AVG(stress_rating), 2) as avg_stress,
    ROUND(AVG(10 - stress_rating), 2) as avg_calmness,
    ROUND(AVG(mood_rating) * 10, 1) as mood_percent,
    ROUND(AVG(energy_rating) * 10, 1) as energy_percent,
    ROUND(AVG(10 - stress_rating) * 10, 1) as calmness_percent
FROM ai_signals
WHERE user_id = 4
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp), TO_CHAR(timestamp, 'Dy')
ORDER BY DATE(timestamp) DESC;

-- 4. Ручной расчет рейтинга продуктивности для пользователя 4
WITH mood_data AS (
    SELECT 
        COUNT(*) as mood_entries,
        SUM(mood_rating + energy_rating + (10 - stress_rating)) as total_mood_score
    FROM ai_signals
    WHERE user_id = 4
    AND type IN ('mood', 'daily_mood_check')
    AND DATE(timestamp) <= CURRENT_DATE
),
activity_data AS (
    SELECT 
        COUNT(*) FILTER (WHERE success_rating >= 7) as successful,
        COUNT(*) FILTER (WHERE success_rating < 7) as failed
    FROM ai_signals
    WHERE user_id = 4
    AND type IN ('activity', 'activity_analysis')
    AND DATE(timestamp) <= CURRENT_DATE
),
platform_data AS (
    SELECT COUNT(*) as daily_actions
    FROM (
        SELECT 1 FROM ai_signals WHERE user_id = 4 AND DATE(timestamp) = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM activity_log WHERE user_id = 4 AND DATE(created_at) = CURRENT_DATE
    ) AS actions
)
SELECT 
    'Детальный расчет рейтинга для пользователя 4' as info,
    m.mood_entries,
    m.total_mood_score,
    ROUND(m.total_mood_score / NULLIF(m.mood_entries, 0) / 3.0, 4) as avg_mood_component,
    COALESCE(a.successful, 0) as successful_activities,
    COALESCE(a.failed, 0) as failed_activities,
    COALESCE(p.daily_actions, 0) as daily_platform_actions,
    GREATEST(0.6, LEAST(COALESCE(p.daily_actions, 0)::DECIMAL / 10.0, 1.0)) as platform_coefficient,
    -- Расчет рейтинга
    ROUND((
        (m.total_mood_score / NULLIF(m.mood_entries, 0) / 3.0) +
        (COALESCE(a.successful, 0) * 0.5) +
        (COALESCE(a.failed, 0) * (-0.5))
    ) * 1.2 * GREATEST(0.6, LEAST(COALESCE(p.daily_actions, 0)::DECIMAL / 10.0, 1.0)), 2) as calculated_rating,
    calculate_productivity_score(4, CURRENT_DATE) as function_rating,
    ABS(calculate_productivity_score(4, CURRENT_DATE) - (
        (m.total_mood_score / NULLIF(m.mood_entries, 0) / 3.0) +
        (COALESCE(a.successful, 0) * 0.5) +
        (COALESCE(a.failed, 0) * (-0.5))
    ) * 1.2 * GREATEST(0.6, LEAST(COALESCE(p.daily_actions, 0)::DECIMAL / 10.0, 1.0))) as difference
FROM mood_data m
CROSS JOIN activity_data a
CROSS JOIN platform_data p;

-- 5. Текущий рейтинг из БД
SELECT 
    'Текущий рейтинг из БД' as info,
    up.productivity_score as user_progress_rating,
    ps.final_score as productivity_scores_rating,
    ps.date as last_calculated_date,
    ps.mood_component,
    ps.activity_component,
    ps.platform_activity_coefficient,
    calculate_productivity_score(4, CURRENT_DATE) as function_rating
FROM user_progress up
LEFT JOIN productivity_scores ps ON ps.user_id = up.user_id AND ps.date = CURRENT_DATE
WHERE up.user_id = 4;

-- 6. Что возвращает функция get_weekly_average_percentages для пользователя 4
SELECT 'Результат get_weekly_average_percentages(4):' as info;
SELECT * FROM get_weekly_average_percentages(4);

-- 7. Все активности пользователя 4 за последние 7 дней
SELECT 
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'Dy') as day_name,
    success_rating,
    CASE 
        WHEN success_rating >= 7 THEN 'Успешная'
        ELSE 'Неуспешная'
    END as status,
    notes
FROM ai_signals
WHERE user_id = 4
AND type IN ('activity', 'activity_analysis')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY DATE(timestamp) DESC;

-- 8. Статистика по активностям за всю историю
SELECT 
    'Статистика активностей за всю историю' as info,
    COUNT(*) as total_activities,
    COUNT(*) FILTER (WHERE success_rating >= 7) as successful,
    COUNT(*) FILTER (WHERE success_rating < 7) as failed,
    ROUND(AVG(success_rating), 2) as avg_success_rating
FROM ai_signals
WHERE user_id = 4
AND type IN ('activity', 'activity_analysis')
AND DATE(timestamp) <= CURRENT_DATE;
