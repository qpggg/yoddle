-- Сравнение данных пользователей 1 и 4

-- 1. Структура данных настроения
SELECT 
    'User 1' as user_type,
    type,
    COUNT(*) as count,
    COUNT(mood_rating) as has_mood,
    COUNT(energy_rating) as has_energy,
    COUNT(stress_rating) as has_stress,
    AVG(mood_rating) as avg_mood,
    AVG(energy_rating) as avg_energy,
    AVG(stress_rating) as avg_stress
FROM ai_signals
WHERE user_id = 1
AND type IN ('mood', 'daily_mood_check')
GROUP BY type

UNION ALL

SELECT 
    'User 4' as user_type,
    type,
    COUNT(*) as count,
    COUNT(mood_rating) as has_mood,
    COUNT(energy_rating) as has_energy,
    COUNT(stress_rating) as has_stress,
    AVG(mood_rating) as avg_mood,
    AVG(energy_rating) as avg_energy,
    AVG(stress_rating) as avg_stress
FROM ai_signals
WHERE user_id = 4
AND type IN ('mood', 'daily_mood_check')
GROUP BY type;

-- 2. Структура данных активностей
SELECT 
    'User 1' as user_type,
    COUNT(*) as total,
    COUNT(success_rating) as has_success_rating,
    COUNT(*) FILTER (WHERE success_rating IS NULL) as null_success,
    COUNT(*) FILTER (WHERE success_rating >= 5) as successful_5,
    COUNT(*) FILTER (WHERE success_rating >= 7) as successful_7,
    AVG(success_rating) as avg_success
FROM ai_signals
WHERE user_id = 1
AND type IN ('activity', 'activity_analysis')

UNION ALL

SELECT 
    'User 4' as user_type,
    COUNT(*) as total,
    COUNT(success_rating) as has_success_rating,
    COUNT(*) FILTER (WHERE success_rating IS NULL) as null_success,
    COUNT(*) FILTER (WHERE success_rating >= 5) as successful_5,
    COUNT(*) FILTER (WHERE success_rating >= 7) as successful_7,
    AVG(success_rating) as avg_success
FROM ai_signals
WHERE user_id = 4
AND type IN ('activity', 'activity_analysis');

-- 3. Примеры записей
SELECT 'User 1 sample' as info, id, type, mood_rating, energy_rating, stress_rating, success_rating, timestamp
FROM ai_signals
WHERE user_id = 1
ORDER BY timestamp DESC
LIMIT 5

UNION ALL

SELECT 'User 4 sample' as info, id, type, mood_rating, energy_rating, stress_rating, success_rating, timestamp
FROM ai_signals
WHERE user_id = 4
ORDER BY timestamp DESC
LIMIT 5;
