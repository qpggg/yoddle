-- Пересчет рейтинга для пользователя 1 за последние 14 дней

-- Пересчитываем рейтинг для каждого дня
DO $$
DECLARE
    rec_date DATE;
    calculated_rating NUMERIC;
BEGIN
    FOR rec_date IN 
        SELECT DISTINCT DATE(timestamp) 
        FROM ai_signals 
        WHERE user_id = 1 
        AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '14 days'
        ORDER BY DATE(timestamp)
    LOOP
        SELECT calculate_productivity_score(1, rec_date) INTO calculated_rating;
        RAISE NOTICE 'Дата: %, Рейтинг: %', rec_date, calculated_rating;
    END LOOP;
    
    -- Пересчитываем текущий рейтинг
    SELECT calculate_productivity_score(1, CURRENT_DATE) INTO calculated_rating;
    RAISE NOTICE 'Текущий рейтинг: %', calculated_rating;
END $$;

-- Проверяем итоговый рейтинг
SELECT 
    calculate_productivity_score(1, CURRENT_DATE) as current_rating,
    (SELECT overall_rating FROM get_user_productivity_stats(1)) as stats_rating;
