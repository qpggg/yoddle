-- Тест вызова функций для пользователя ID 4
SELECT 
    'calculate_weekly_rating' as function_name,
    calculate_weekly_rating(4) as result
UNION ALL
SELECT 
    'calculate_monthly_rating' as function_name,
    calculate_monthly_rating(4) as result;

-- Проверяем схему функций
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('calculate_weekly_rating', 'calculate_monthly_rating')
ORDER BY n.nspname, p.proname;
