-- Проверка данных для недельного отчета пользователя 4
SELECT 
    type,
    COUNT(*) as count,
    MIN(timestamp) as first_record,
    MAX(timestamp) as last_record
FROM ai_signals
WHERE user_id = 4
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY type
ORDER BY type;
