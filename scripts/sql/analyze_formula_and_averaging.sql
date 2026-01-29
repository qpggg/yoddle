-- ===================================================================
-- АНАЛИЗ ФОРМУЛЫ И УСРЕДНЕНИЯ
-- ===================================================================

-- 1. УЧИТЫВАЕТСЯ ЛИ ДЛИНА ТЕКСТА?
-- Ответ: ДА, через quality_score в API (но НЕ используется в формуле calculate_productivity_score)
SELECT 
    'Учет длины текста' as question,
    'ДА - через quality_score в API (1.0 если >=30 символов, 0.8 если >=20, 0.6 если >=10, 0.4 иначе)' as answer,
    'НО: quality_score НЕ используется в формуле calculate_productivity_score (сохраняется, но не влияет на рейтинг)' as note;

-- 2. КАК РАБОТАЕТ УСРЕДНЕНИЕ?
-- Проверяем как рассчитываются недельные и месячные рейтинги

-- Недельный рейтинг - среднее за 7 дней
SELECT 
    'Недельный рейтинг (calculate_weekly_rating)' as function_name,
    'Среднее значение final_score из productivity_scores за последние 7 дней' as how_it_works,
    calculate_weekly_rating(4) as result,
    'Если нет данных в productivity_scores, рассчитывает на лету для каждого дня и усредняет' as fallback;

-- Месячный рейтинг - среднее за 30 дней  
SELECT 
    'Месячный рейтинг (calculate_monthly_rating)' as function_name,
    'Среднее значение final_score из productivity_scores за последние 30 дней' as how_it_works,
    calculate_monthly_rating(4) as result,
    'Если нет данных в productivity_scores, рассчитывает на лету для каждого дня и усредняет' as fallback;

-- 3. ДАННЫЕ ДЛЯ ГРАФИКА - рейтинг по дням за последние 14 дней
SELECT 
    'Данные для графика изменения рейтинга' as info;

SELECT 
    date,
    COALESCE(final_score, calculate_productivity_score(4, date)) as rating,
    mood_component,
    activity_component,
    platform_activity_coefficient
FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval) as day_date
LEFT JOIN productivity_scores ps ON ps.user_id = 4 AND ps.date = day_date::date
ORDER BY date DESC;

-- 4. ПРОВЕРКА: Есть ли данные для графика?
SELECT 
    'Проверка данных для графика' as check_name,
    COUNT(*) as days_with_data,
    COUNT(*) FILTER (WHERE final_score IS NOT NULL) as days_with_saved_scores,
    AVG(final_score) as avg_rating,
    MIN(final_score) as min_rating,
    MAX(final_score) as max_rating
FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval) as day_date
LEFT JOIN productivity_scores ps ON ps.user_id = 4 AND ps.date = day_date::date;
