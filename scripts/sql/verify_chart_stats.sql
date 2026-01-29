-- Проверка правильности статистики графика для пользователя 4

-- 1. Данные из функции get_rating_vs_activities_chart за 14 дней
WITH chart_data AS (
    SELECT * FROM get_rating_vs_activities_chart(4, 14)
    ORDER BY date ASC
)
SELECT 
    'Статистика из функции графика' as info,
    COUNT(*) as total_days,
    ROUND(AVG(rating), 2) as avg_rating,
    SUM(total_activities) as total_activities,
    SUM(successful_activities) as successful_activities,
    SUM(failed_activities) as failed_activities,
    CASE 
        WHEN SUM(total_activities) > 0 THEN 
            ROUND(SUM(successful_activities)::DECIMAL / SUM(total_activities) * 100, 0)
        ELSE 0
    END as success_rate_percent
FROM chart_data;

-- 2. Ручной расчет для сравнения
SELECT 
    'Ручной расчет статистики' as info,
    COUNT(DISTINCT DATE(timestamp)) as days_with_data,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND type IN ('activity', 'activity_analysis') AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '14 days') as total_activities,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND type IN ('activity', 'activity_analysis') AND success_rating >= 7 AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '14 days') as successful_activities,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND type IN ('activity', 'activity_analysis') AND success_rating < 7 AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '14 days') as failed_activities,
    CASE 
        WHEN (SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND type IN ('activity', 'activity_analysis') AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '14 days') > 0 THEN
            ROUND((SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND type IN ('activity', 'activity_analysis') AND success_rating >= 7 AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '14 days')::DECIMAL / 
                  (SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND type IN ('activity', 'activity_analysis') AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '14 days') * 100, 0)
        ELSE 0
    END as success_rate_percent;

-- 3. Средний рейтинг за 14 дней
SELECT 
    'Средний накопительный рейтинг за 14 дней' as info,
    ROUND(AVG(calculate_productivity_score(4, day_date::date)), 2) as avg_rating
FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval) as day_date;
