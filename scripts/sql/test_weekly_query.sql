-- Проверка запроса для недельного отчета
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE type IN ('mood', 'daily_mood_check')) as mood_count,
    COUNT(*) FILTER (WHERE type IN ('activity', 'activity_analysis')) as activity_count
FROM ai_signals 
WHERE user_id = 4 
AND timestamp >= NOW() - INTERVAL '7 days';

-- Проверка с CURRENT_DATE
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE type IN ('mood', 'daily_mood_check')) as mood_count,
    COUNT(*) FILTER (WHERE type IN ('activity', 'activity_analysis')) as activity_count
FROM ai_signals 
WHERE user_id = 4 
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
