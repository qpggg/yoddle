-- ===================================================================
-- РУЧНОЙ РАСЧЕТ РЕЙТИНГА ДЛЯ ПОЛЬЗОВАТЕЛЯ ID 4
-- ===================================================================

-- 1. Все записи настроения за последние 7 дней
SELECT 
    '=== ЗАПИСИ НАСТРОЕНИЯ ===' as section;
    
SELECT 
    id,
    DATE(timestamp) as date,
    mood_rating,
    energy_rating,
    stress_rating,
    timestamp
FROM ai_signals
WHERE user_id = 4
AND type = 'mood'
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- 2. Все записи активности за последние 7 дней
SELECT 
    '=== ЗАПИСИ АКТИВНОСТИ ===' as section;
    
SELECT 
    id,
    DATE(timestamp) as date,
    activity_category,
    duration_minutes,
    success_rating,
    quality_score,
    notes,
    timestamp
FROM ai_signals
WHERE user_id = 4
AND type IN ('activity', 'activity_analysis')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- 3. Расчет настроения (среднее за день)
SELECT 
    '=== РАСЧЕТ НАСТРОЕНИЯ ===' as section;
    
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as records_count,
    AVG(mood_rating) as avg_mood,
    AVG(energy_rating) as avg_energy,
    AVG(stress_rating) as avg_stress,
    -- Формула: (mood + energy + (10 - stress)) / 3
    (AVG(mood_rating) + AVG(energy_rating) + (10 - AVG(stress_rating))) / 3 as mood_score
FROM ai_signals
WHERE user_id = 4
AND type = 'mood'
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- 4. Расчет активности (успешные/неуспешные)
SELECT 
    '=== РАСЧЕТ АКТИВНОСТИ ===' as section;
    
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_activities,
    COUNT(*) FILTER (WHERE success_rating >= 7) as successful_activities,
    COUNT(*) FILTER (WHERE success_rating < 7) as unsuccessful_activities,
    -- Формула: успешные * 0.5 - неуспешные * 0.5
    (COUNT(*) FILTER (WHERE success_rating >= 7) * 0.5) - 
    (COUNT(*) FILTER (WHERE success_rating < 7) * 0.5) as activity_score
FROM ai_signals
WHERE user_id = 4
AND type IN ('activity', 'activity_analysis')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- 5. Общий расчет за сегодня (CURRENT_DATE)
SELECT 
    '=== РАСЧЕТ ЗА СЕГОДНЯ (' || CURRENT_DATE || ') ===' as section;

-- Настроение за сегодня
WITH today_mood AS (
    SELECT 
        AVG(mood_rating) as avg_mood,
        AVG(energy_rating) as avg_energy,
        AVG(stress_rating) as avg_stress
    FROM ai_signals
    WHERE user_id = 4
    AND type = 'mood'
    AND DATE(timestamp) = CURRENT_DATE
),
today_activities AS (
    SELECT 
        COUNT(*) FILTER (WHERE success_rating >= 7) as successful,
        COUNT(*) FILTER (WHERE success_rating < 7) as unsuccessful
    FROM ai_signals
    WHERE user_id = 4
    AND type IN ('activity', 'activity_analysis')
    AND DATE(timestamp) = CURRENT_DATE
),
activity_coefficient AS (
    -- Коэффициент активности на платформе (упрощенно: количество записей / 10, максимум 1.0)
    SELECT LEAST(COUNT(*)::numeric / 10.0, 1.0) as coeff
    FROM ai_signals
    WHERE user_id = 4
    AND DATE(timestamp) = CURRENT_DATE
)
SELECT 
    (SELECT avg_mood FROM today_mood) as mood_avg,
    (SELECT avg_energy FROM today_mood) as energy_avg,
    (SELECT avg_stress FROM today_mood) as stress_avg,
    (SELECT successful FROM today_activities) as successful_activities,
    (SELECT unsuccessful FROM today_activities) as unsuccessful_activities,
    (SELECT coeff FROM activity_coefficient) as activity_coefficient,
    -- Настроение: (mood + energy + (10 - stress)) / 3
    COALESCE(
        ((SELECT avg_mood FROM today_mood) + 
         (SELECT avg_energy FROM today_mood) + 
         (10 - (SELECT avg_stress FROM today_mood))) / 3, 
        0
    ) as mood_component,
    -- Активности: успешные * 0.5 - неуспешные * 0.5
    COALESCE(
        (SELECT successful FROM today_activities) * 0.5 - 
        (SELECT unsuccessful FROM today_activities) * 0.5,
        0
    ) as activity_component,
    -- Итоговая формула: (Настроение + Активности) × 1.2 × Коэффициент активности
    COALESCE(
        (
            ((SELECT avg_mood FROM today_mood) + 
             (SELECT avg_energy FROM today_mood) + 
             (10 - (SELECT avg_stress FROM today_mood))) / 3 +
            ((SELECT successful FROM today_activities) * 0.5 - 
             (SELECT unsuccessful FROM today_activities) * 0.5)
        ) * 1.2 * 
        (SELECT coeff FROM activity_coefficient),
        0
    ) as calculated_rating;

-- 6. Что возвращает функция calculate_productivity_score
SELECT 
    '=== РЕЗУЛЬТАТ ФУНКЦИИ calculate_productivity_score ===' as section;
    
SELECT 
    calculate_productivity_score(4, CURRENT_DATE) as function_result;

-- 7. Что возвращает функция calculate_simple_productivity_rating
SELECT 
    '=== РЕЗУЛЬТАТ ФУНКЦИИ calculate_simple_productivity_rating ===' as section;
    
SELECT 
    calculate_simple_productivity_rating(4) as function_result;
