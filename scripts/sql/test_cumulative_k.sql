-- Проверка кумулятивного K для пользователя 4

-- Показываем как меняется K по дням
SELECT 
    date,
    calculate_productivity_score(4, date::date) as rating,
    -- Ручной расчет K для проверки
    (
        SELECT GREATEST(0.6, LEAST(
            COALESCE(
                AVG(daily_actions::DECIMAL / 10.0),
                0.6
            ),
            1.0
        ))
        FROM (
            SELECT COUNT(*) as daily_actions
            FROM (
                SELECT DATE(timestamp) as action_date
                FROM ai_signals 
                WHERE user_id = 4 AND DATE(timestamp) <= date
                UNION ALL
                SELECT DATE(created_at) as action_date
                FROM activity_log
                WHERE user_id = 4 AND DATE(created_at) <= date
            ) AS all_actions
            GROUP BY action_date
        ) AS daily_stats
    ) as calculated_k
FROM generate_series('2026-01-15'::date, '2026-01-28'::date, '1 day'::interval) as date
ORDER BY date;
