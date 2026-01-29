-- Проверка кумулятивного K - показываем среднее количество действий за день

SELECT 
    date,
    -- Среднее количество действий за день за всю историю до этой даты
    (
        SELECT COALESCE(AVG(daily_count), 0)
        FROM (
            SELECT COUNT(*) as daily_count
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
    ) as avg_actions_per_day,
    -- K = среднее / 10 (возможные действия), минимум 0.6
    GREATEST(0.6, LEAST(
        (
            SELECT COALESCE(AVG(daily_count::DECIMAL / 10.0), 0.6)
            FROM (
                SELECT COUNT(*) as daily_count
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
        ),
        1.0
    )) as k_coefficient,
    calculate_productivity_score(4, date::date) as rating
FROM generate_series('2026-01-15'::date, '2026-01-28'::date, '1 day'::interval) as date
ORDER BY date;
