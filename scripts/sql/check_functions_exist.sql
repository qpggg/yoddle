-- Проверка существования функций расчета рейтинга
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as signature
FROM pg_proc 
WHERE proname IN (
    'calculate_simple_productivity_rating',
    'count_total_records',
    'get_user_productivity_stats',
    'calculate_weekly_rating',
    'calculate_monthly_rating',
    'calculate_productivity_score'
)
ORDER BY proname;
