-- Проверка исправленного запроса (7 дней включая сегодня)
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE type IN ('mood', 'daily_mood_check')) as mood_count,
    COUNT(*) FILTER (WHERE type IN ('activity', 'activity_analysis')) as activity_count,
    MIN(DATE(timestamp)) as earliest_date,
    MAX(DATE(timestamp)) as latest_date
FROM ai_signals 
WHERE user_id = 4 
AND DATE(timestamp) >= (CURRENT_DATE - INTERVAL '6 days');
