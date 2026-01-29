-- Проверка разницы между NOW() и CURRENT_DATE
SELECT 
    'NOW() - 7 days' as query_type,
    COUNT(*) as count
FROM ai_signals 
WHERE user_id = 4 
AND timestamp >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'CURRENT_DATE - 7 days' as query_type,
    COUNT(*) as count
FROM ai_signals 
WHERE user_id = 4 
AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days';
