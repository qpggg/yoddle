-- Финальная проверка всех данных для пользователя 4

-- 1. Проверка статистики графика
SELECT 
    'Статистика графика (14 дней)' as check_type,
    COUNT(*) as days,
    ROUND(AVG(rating), 2) as avg_rating,
    SUM(total_activities) as total_activities,
    SUM(successful_activities) as successful_activities,
    SUM(failed_activities) as failed_activities,
    CASE WHEN SUM(total_activities) > 0 THEN ROUND(SUM(successful_activities)::DECIMAL / SUM(total_activities) * 100, 0) ELSE 0 END as success_rate
FROM get_rating_vs_activities_chart(4, 14);

-- 2. Проверка процентов настроения
SELECT 
    'Проценты настроения за неделю' as check_type,
    mood_average,
    energy_average,
    calmness_average
FROM get_weekly_average_percentages(4);

-- 3. Проверка рейтинга продуктивности
SELECT 
    'Рейтинг продуктивности' as check_type,
    calculate_productivity_score(4, CURRENT_DATE) as current_rating,
    (SELECT productivity_score FROM user_progress WHERE user_id = 4) as stored_rating;

-- 4. Проверка данных для недельного отчета
SELECT 
    'Данные для недельного отчета' as check_type,
    COUNT(*) FILTER (WHERE type IN ('mood', 'daily_mood_check')) as mood_count,
    COUNT(*) FILTER (WHERE type IN ('activity', 'activity_analysis')) as activity_count,
    COUNT(*) as total_count
FROM ai_signals
WHERE user_id = 4
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
