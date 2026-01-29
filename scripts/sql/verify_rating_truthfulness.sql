-- ===================================================================
-- ПРОВЕРКА ПРАВДИВОСТИ ДАННЫХ РЕЙТИНГА ПРОДУКТИВНОСТИ
-- ===================================================================
-- Ручной расчет для сравнения с отображаемыми значениями
-- ===================================================================

-- 1. Получаем данные настроения за последние 7 дней для всех пользователей
SELECT 
    user_id,
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'Dy') as day_name,
    mood_rating,
    energy_rating,
    stress_rating,
    (mood_rating + energy_rating + (10 - stress_rating)) as mood_score_component
FROM ai_signals
WHERE type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY user_id, DATE(timestamp) DESC;

-- 2. Средние значения настроения, энергии и спокойствия за неделю по пользователям
SELECT 
    user_id,
    COUNT(*) as mood_records,
    ROUND(AVG(mood_rating), 2) as avg_mood,
    ROUND(AVG(energy_rating), 2) as avg_energy,
    ROUND(AVG(stress_rating), 2) as avg_stress,
    ROUND(AVG(10 - stress_rating), 2) as avg_calmness,
    -- Проценты (нормализуем на 10)
    ROUND(AVG(mood_rating) * 10, 1) as mood_percent,
    ROUND(AVG(energy_rating) * 10, 1) as energy_percent,
    ROUND(AVG(10 - stress_rating) * 10, 1) as calmness_percent
FROM ai_signals
WHERE type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id
ORDER BY user_id;

-- 3. Детальная разбивка по дням недели для каждого пользователя
SELECT 
    user_id,
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'Dy') as day_name,
    COUNT(*) as records_count,
    ROUND(AVG(mood_rating), 2) as avg_mood,
    ROUND(AVG(energy_rating), 2) as avg_energy,
    ROUND(AVG(stress_rating), 2) as avg_stress,
    ROUND(AVG(10 - stress_rating), 2) as avg_calmness,
    -- Проценты для визуализации
    ROUND(AVG(mood_rating) * 10, 1) as mood_percent,
    ROUND(AVG(energy_rating) * 10, 1) as energy_percent,
    ROUND(AVG(10 - stress_rating) * 10, 1) as calmness_percent
FROM ai_signals
WHERE type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id, DATE(timestamp), TO_CHAR(timestamp, 'Dy')
ORDER BY user_id, DATE(timestamp) DESC;

-- 4. Ручной расчет рейтинга продуктивности для каждого пользователя
WITH mood_stats AS (
    SELECT 
        user_id,
        COUNT(*) as mood_entries,
        SUM(mood_rating + energy_rating + (10 - stress_rating)) as total_mood_score
    FROM ai_signals
    WHERE type IN ('mood', 'daily_mood_check')
    AND DATE(timestamp) <= CURRENT_DATE
    GROUP BY user_id
),
activity_stats AS (
    SELECT 
        user_id,
        COUNT(*) FILTER (WHERE success_rating >= 7) as successful_activities,
        COUNT(*) FILTER (WHERE success_rating < 7) as failed_activities
    FROM ai_signals
    WHERE type IN ('activity', 'activity_analysis')
    AND DATE(timestamp) <= CURRENT_DATE
    GROUP BY user_id
),
platform_activity AS (
    SELECT 
        user_id,
        COUNT(*) as daily_actions
    FROM (
        SELECT user_id FROM ai_signals 
        WHERE user_id IN (SELECT user_id FROM mood_stats)
        AND DATE(timestamp) = CURRENT_DATE
        UNION ALL
        SELECT user_id FROM activity_log
        WHERE user_id IN (SELECT user_id FROM mood_stats)
        AND DATE(created_at) = CURRENT_DATE
    ) AS all_actions
    GROUP BY user_id
)
SELECT 
    COALESCE(m.user_id, a.user_id, p.user_id) as user_id,
    COALESCE(m.mood_entries, 0) as mood_entries,
    COALESCE(m.total_mood_score, 0) as total_mood_score,
    COALESCE(m.total_mood_score / NULLIF(m.mood_entries, 0) / 3.0, 0) as avg_mood_component,
    COALESCE(a.successful_activities, 0) as successful_activities,
    COALESCE(a.failed_activities, 0) as failed_activities,
    COALESCE(p.daily_actions, 0) as daily_platform_actions,
    -- Коэффициент активности (минимум 0.6)
    GREATEST(0.6, LEAST(COALESCE(p.daily_actions, 0)::DECIMAL / 10.0, 1.0)) as platform_coefficient,
    -- Ручной расчет рейтинга
    (
        (COALESCE(m.total_mood_score / NULLIF(m.mood_entries, 0) / 3.0, 0)) +
        (COALESCE(a.successful_activities, 0) * 0.5) +
        (COALESCE(a.failed_activities, 0) * (-0.5))
    ) * 1.2 * GREATEST(0.6, LEAST(COALESCE(p.daily_actions, 0)::DECIMAL / 10.0, 1.0)) as manual_rating,
    -- Ограничиваем от 0 до 10
    GREATEST(0.0, LEAST(10.0, (
        (COALESCE(m.total_mood_score / NULLIF(m.mood_entries, 0) / 3.0, 0)) +
        (COALESCE(a.successful_activities, 0) * 0.5) +
        (COALESCE(a.failed_activities, 0) * (-0.5))
    ) * 1.2 * GREATEST(0.6, LEAST(COALESCE(p.daily_actions, 0)::DECIMAL / 10.0, 1.0)))) as final_manual_rating
FROM mood_stats m
FULL OUTER JOIN activity_stats a ON m.user_id = a.user_id
FULL OUTER JOIN platform_activity p ON COALESCE(m.user_id, a.user_id) = p.user_id
ORDER BY user_id;

-- 5. Сравнение с функцией calculate_productivity_score
SELECT 
    user_id,
    calculate_productivity_score(user_id, CURRENT_DATE) as function_rating,
    -- Получаем данные для ручного расчета
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = u.user_id AND type IN ('mood', 'daily_mood_check') AND DATE(timestamp) <= CURRENT_DATE) as mood_entries,
    (SELECT COUNT(*) FILTER (WHERE success_rating >= 7) FROM ai_signals WHERE user_id = u.user_id AND type IN ('activity', 'activity_analysis') AND DATE(timestamp) <= CURRENT_DATE) as successful_activities,
    (SELECT COUNT(*) FILTER (WHERE success_rating < 7) FROM ai_signals WHERE user_id = u.user_id AND type IN ('activity', 'activity_analysis') AND DATE(timestamp) <= CURRENT_DATE) as failed_activities
FROM (SELECT DISTINCT user_id FROM ai_signals WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') u
ORDER BY user_id;

-- 6. Текущий рейтинг из user_progress и productivity_scores
SELECT 
    up.user_id,
    up.productivity_score as user_progress_rating,
    ps.final_score as productivity_scores_rating,
    ps.date as last_calculated_date,
    ps.mood_component,
    ps.activity_component,
    ps.platform_activity_coefficient
FROM user_progress up
LEFT JOIN productivity_scores ps ON ps.user_id = up.user_id AND ps.date = CURRENT_DATE
WHERE up.user_id IN (SELECT DISTINCT user_id FROM ai_signals WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days')
ORDER BY up.user_id;

-- 7. Данные для пользователя с рейтингом около 7.1 (если есть)
SELECT 
    'Пользователи с рейтингом около 7.1' as info;
    
SELECT 
    up.user_id,
    up.productivity_score,
    calculate_productivity_score(up.user_id, CURRENT_DATE) as calculated_rating,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = up.user_id AND type IN ('mood', 'daily_mood_check') AND DATE(timestamp) <= CURRENT_DATE) as total_mood_records,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = up.user_id AND type IN ('activity', 'activity_analysis') AND DATE(timestamp) <= CURRENT_DATE) as total_activity_records
FROM user_progress up
WHERE ABS(up.productivity_score - 7.1) < 0.5
ORDER BY ABS(up.productivity_score - 7.1);
