-- ===================================================================
-- ДЕТАЛЬНАЯ ПРОВЕРКА ДАННЫХ ДЛЯ ПОЛЬЗОВАТЕЛЯ 3 (рейтинг 7.13)
-- ===================================================================

-- 1. Все записи настроения за последние 7 дней для пользователя 3
SELECT 
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'Dy') as day_name,
    mood_rating,
    energy_rating,
    stress_rating,
    (mood_rating + energy_rating + (10 - COALESCE(stress_rating, 5))) as mood_score_component
FROM ai_signals
WHERE user_id = 3
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY DATE(timestamp) DESC, timestamp DESC;

-- 2. Средние значения за неделю для пользователя 3
SELECT 
    'Средние за неделю' as metric,
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
WHERE user_id = 3
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- 3. Разбивка по дням для пользователя 3
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
WHERE user_id = 3
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp), TO_CHAR(timestamp, 'Dy')
ORDER BY DATE(timestamp) DESC;

-- 4. Ручной расчет рейтинга продуктивности для пользователя 3
WITH mood_data AS (
    SELECT 
        COUNT(*) as mood_entries,
        SUM(mood_rating + COALESCE(energy_rating, 5) + (10 - COALESCE(stress_rating, 5))) as total_mood_score
    FROM ai_signals
    WHERE user_id = 3
    AND type IN ('mood', 'daily_mood_check')
    AND DATE(timestamp) <= CURRENT_DATE
),
activity_data AS (
    SELECT 
        COUNT(*) FILTER (WHERE success_rating >= 7) as successful,
        COUNT(*) FILTER (WHERE success_rating < 7) as failed
    FROM ai_signals
    WHERE user_id = 3
    AND type IN ('activity', 'activity_analysis')
    AND DATE(timestamp) <= CURRENT_DATE
),
platform_data AS (
    SELECT COUNT(*) as daily_actions
    FROM (
        SELECT 1 FROM ai_signals WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM activity_log WHERE user_id = 3 AND DATE(created_at) = CURRENT_DATE
    ) AS actions
)
SELECT 
    m.mood_entries,
    m.total_mood_score,
    ROUND(m.total_mood_score / NULLIF(m.mood_entries, 0) / 3.0, 2) as avg_mood_component,
    COALESCE(a.successful, 0) as successful_activities,
    COALESCE(a.failed, 0) as failed_activities,
    COALESCE(p.daily_actions, 0) as daily_platform_actions,
    GREATEST(0.6, LEAST(COALESCE(p.daily_actions, 0)::DECIMAL / 10.0, 1.0)) as platform_coefficient,
    -- Расчет рейтинга
    ROUND((
        (m.total_mood_score / NULLIF(m.mood_entries, 0) / 3.0) +
        (COALESCE(a.successful, 0) * 0.5) +
        (COALESCE(a.failed, 0) * (-0.5))
    ) * 1.2 * GREATEST(0.6, LEAST(COALESCE(p.daily_actions, 0)::DECIMAL / 10.0, 1.0)), 2) as calculated_rating
FROM mood_data m
CROSS JOIN activity_data a
CROSS JOIN platform_data p;

-- 5. Сравнение с функцией
SELECT 
    'Сравнение с функцией' as info,
    calculate_productivity_score(3, CURRENT_DATE) as function_rating,
    (SELECT productivity_score FROM user_progress WHERE user_id = 3) as user_progress_rating;

-- 6. Проверка данных из API (что может показываться на фронтенде)
SELECT 
    'Данные для API' as info,
    (SELECT * FROM get_user_productivity_stats(3)) as stats;
