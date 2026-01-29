-- Проверка значений рейтинга по дням для пользователя 4

SELECT 
    date,
    rating,
    total_activities,
    successful_activities,
    failed_activities,
    mood_records,
    activity_log_actions,
    cumulative_mood_score,
    cumulative_activity_score
FROM get_rating_vs_activities_chart(4, 14)
ORDER BY date ASC;
