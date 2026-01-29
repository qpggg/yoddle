-- Проверка структуры данных для недельного отчета
SELECT 
    type,
    mood_rating,
    energy_rating,
    stress_rating,
    success_rating,
    data
FROM ai_signals
WHERE user_id = 4
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY timestamp DESC
LIMIT 5;
