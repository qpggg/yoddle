-- ===================================================================
-- ПРОВЕРКА ДАННЫХ ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ
-- ===================================================================

-- 1. Проверяем пользователя
SELECT 
    id,
    name,
    login,
    created_at
FROM enter
WHERE login = 'test_productivity@yoddle.test';

-- 2. Проверяем записи настроения
SELECT 
    id,
    user_id,
    type,
    mood_rating,
    energy_rating,
    stress_rating,
    timestamp,
    DATE(timestamp) as date_only
FROM ai_signals
WHERE user_id = (SELECT id FROM enter WHERE login = 'test_productivity@yoddle.test')
AND type = 'mood'
ORDER BY timestamp DESC;

-- 3. Проверяем записи активности
SELECT 
    id,
    user_id,
    type,
    activity_category,
    duration_minutes,
    success_rating,
    quality_score,
    timestamp,
    DATE(timestamp) as date_only
FROM ai_signals
WHERE user_id = (SELECT id FROM enter WHERE login = 'test_productivity@yoddle.test')
AND type = 'activity'
ORDER BY timestamp DESC;

-- 4. Проверяем расчет рейтинга через функцию
SELECT 
    calculate_simple_productivity_rating(
        (SELECT id FROM enter WHERE login = 'test_productivity@yoddle.test')
    ) as simple_rating;

-- 5. Проверяем полную статистику
SELECT * FROM get_user_productivity_stats(
    (SELECT id FROM enter WHERE login = 'test_productivity@yoddle.test')
);

-- 6. Проверяем расчет продуктивности за сегодня
SELECT 
    calculate_productivity_score(
        (SELECT id FROM enter WHERE login = 'test_productivity@yoddle.test'),
        CURRENT_DATE
    ) as today_score;

-- 7. Проверяем данные за последние 7 дней
SELECT 
    DATE(timestamp) as date,
    type,
    COUNT(*) as count,
    AVG(mood_rating) as avg_mood,
    AVG(energy_rating) as avg_energy,
    AVG(stress_rating) as avg_stress,
    AVG(success_rating) as avg_success
FROM ai_signals
WHERE user_id = (SELECT id FROM enter WHERE login = 'test_productivity@yoddle.test')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp), type
ORDER BY date DESC, type;
