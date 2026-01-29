-- Проверка данных пользователя 2

-- 1. Все записи настроения за последние 7 дней для пользователя 2
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
WHERE user_id = 2
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY DATE(timestamp) DESC, timestamp DESC;

-- 2. Средние значения за неделю для пользователя 2
SELECT 
    'Средние за неделю (последние 7 дней)' as metric,
    COUNT(*) as records,
    ROUND(AVG(mood_rating), 2) as avg_mood,
    ROUND(AVG(energy_rating), 2) as avg_energy,
    ROUND(AVG(stress_rating), 2) as avg_stress,
    ROUND(AVG(10 - stress_rating), 2) as avg_calmness,
    ROUND(AVG(mood_rating) * 10, 1) as mood_percent,
    ROUND(AVG(energy_rating) * 10, 1) as energy_percent,
    ROUND(AVG(10 - stress_rating) * 10, 1) as calmness_percent
FROM ai_signals
WHERE user_id = 2
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- 3. Разбивка по дням для пользователя 2
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
WHERE user_id = 2
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp), TO_CHAR(timestamp, 'Dy')
ORDER BY DATE(timestamp) DESC;

-- 4. Что возвращает функция для пользователя 2
SELECT 'Результат get_weekly_average_percentages(2):' as info;
SELECT * FROM get_weekly_average_percentages(2);

-- 5. Проверка данных за 28 число (среда) для всех пользователей
SELECT 
    user_id,
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'Dy') as day_name,
    COUNT(*) as records
FROM ai_signals
WHERE type IN ('mood', 'daily_mood_check')
AND DATE(timestamp) = '2026-01-28'
GROUP BY user_id, DATE(timestamp), TO_CHAR(timestamp, 'Dy')
ORDER BY user_id;
