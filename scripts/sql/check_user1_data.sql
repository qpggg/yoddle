-- Проверка данных пользователя 1

-- 1. Проверка рейтинга
SELECT calculate_productivity_score(1, CURRENT_DATE) as rating;

-- 2. Проверка статистики
SELECT * FROM get_user_productivity_stats(1);

-- 3. Проверка записей настроения
SELECT COUNT(*) as mood_count, type 
FROM ai_signals 
WHERE user_id = 1 
AND type IN ('mood', 'daily_mood_check')
GROUP BY type;

-- 4. Проверка записей активностей
SELECT COUNT(*) as activity_count, type 
FROM ai_signals 
WHERE user_id = 1 
AND type IN ('activity', 'activity_analysis')
GROUP BY type;

-- 5. Последние записи
SELECT id, type, mood_rating, energy_rating, stress_rating, success_rating, timestamp
FROM ai_signals 
WHERE user_id = 1 
ORDER BY timestamp DESC 
LIMIT 10;

-- 6. Проверка данных для графика
SELECT * FROM get_rating_vs_activities_chart(1, 14) ORDER BY date DESC LIMIT 5;
