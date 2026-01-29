-- Исправление функции get_rating_vs_activities_chart

DROP FUNCTION IF EXISTS get_rating_vs_activities_chart(INTEGER, INTEGER) CASCADE;

CREATE FUNCTION get_rating_vs_activities_chart(p_user_id INTEGER, p_days INTEGER DEFAULT 14)
RETURNS TABLE(
    date DATE,
    rating NUMERIC,
    total_activities BIGINT,
    successful_activities BIGINT,
    failed_activities BIGINT,
    mood_records BIGINT,
    activity_log_actions BIGINT,
    cumulative_mood_score NUMERIC,
    cumulative_activity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT day_date::date as date
        FROM generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, '1 day'::interval) as day_date
    )
    SELECT 
        ds.date,
        -- Накопительный рейтинг на эту дату
        calculate_productivity_score(p_user_id, ds.date) as rating,
        -- Статистика активностей за эту дату (приводим к BIGINT)
        COALESCE(COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis')), 0)::BIGINT as total_activities,
        COALESCE(COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis') AND ai.success_rating >= 7), 0)::BIGINT as successful_activities,
        COALESCE(COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis') AND ai.success_rating < 7), 0)::BIGINT as failed_activities,
        COALESCE(COUNT(*) FILTER (WHERE ai.type IN ('mood', 'daily_mood_check')), 0)::BIGINT as mood_records,
        COALESCE((SELECT COUNT(*) FROM activity_log WHERE user_id = p_user_id AND DATE(created_at) = ds.date), 0)::BIGINT as activity_log_actions,
        -- Накопительные суммы до этой даты
        COALESCE(SUM(ai.mood_rating + ai.energy_rating + (10 - ai.stress_rating)) FILTER (WHERE ai.type IN ('mood', 'daily_mood_check') AND DATE(ai.timestamp) <= ds.date), 0)::NUMERIC as cumulative_mood_score,
        COALESCE(
            ((COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis') AND ai.success_rating >= 7 AND DATE(ai.timestamp) <= ds.date) * 0.5) -
             (COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis') AND ai.success_rating < 7 AND DATE(ai.timestamp) <= ds.date) * 0.5))::NUMERIC,
            0::NUMERIC
        ) as cumulative_activity_score
    FROM date_series ds
    LEFT JOIN ai_signals ai ON ai.user_id = p_user_id AND DATE(ai.timestamp) <= ds.date
    GROUP BY ds.date
    ORDER BY ds.date ASC;
END;
$$ LANGUAGE plpgsql;

-- Тест функции
SELECT 'Тест функции get_rating_vs_activities_chart(4, 14):' as info;
SELECT * FROM get_rating_vs_activities_chart(4, 14)
ORDER BY date ASC
LIMIT 5;
