-- Отладка ошибки функции get_rating_vs_activities_chart
DO $$
BEGIN
    PERFORM get_rating_vs_activities_chart(4, 14);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;
