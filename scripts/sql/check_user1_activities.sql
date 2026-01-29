-- Проверка активностей пользователя 1

-- Проверяем распределение success_rating
SELECT 
    success_rating,
    COUNT(*) as count,
    CASE 
        WHEN success_rating >= 7 THEN 'successful (>=7)'
        WHEN success_rating >= 5 THEN 'medium (5-6)'
        ELSE 'failed (<5)'
    END as category
FROM ai_signals 
WHERE user_id = 1 
AND type IN ('activity', 'activity_analysis')
GROUP BY success_rating
ORDER BY success_rating DESC;

-- Проверяем сколько активностей считается успешными при разных порогах
SELECT 
    COUNT(*) FILTER (WHERE success_rating >= 7) as successful_7,
    COUNT(*) FILTER (WHERE success_rating >= 5) as successful_5,
    COUNT(*) FILTER (WHERE success_rating < 7) as failed_7,
    COUNT(*) FILTER (WHERE success_rating < 5) as failed_5,
    COUNT(*) as total
FROM ai_signals 
WHERE user_id = 1 
AND type IN ('activity', 'activity_analysis');
