-- ===================================================================
-- ПОЛНЫЙ АНАЛИЗ ТЕСТОВЫХ ДАННЫХ И РЕЗУЛЬТАТОВ
-- ===================================================================

-- 1. ДАННЫЕ ПО ДНЯМ: Что было добавлено
SELECT 
    '=== ДАННЫЕ ПО ДНЯМ ===' as section;

SELECT 
    DATE(timestamp) as date,
    COUNT(*) FILTER (WHERE type = 'mood') as mood_records,
    COUNT(*) FILTER (WHERE type = 'activity') as activity_records,
    ROUND(AVG(mood_rating) FILTER (WHERE type = 'mood'), 2) as avg_mood,
    ROUND(AVG(energy_rating) FILTER (WHERE type = 'mood'), 2) as avg_energy,
    ROUND(AVG(stress_rating) FILTER (WHERE type = 'mood'), 2) as avg_stress,
    COUNT(*) FILTER (WHERE type = 'activity' AND success_rating >= 7) as successful_activities,
    COUNT(*) FILTER (WHERE type = 'activity' AND success_rating < 7) as unsuccessful_activities,
    (SELECT COUNT(*) FROM activity_log WHERE user_id = 4 AND DATE(created_at) = DATE(ai_signals.timestamp)) as activity_log_actions
FROM ai_signals
WHERE user_id = 4
AND timestamp >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- 2. РЕЙТИНГ ПО ДНЯМ: Как менялся рейтинг
SELECT 
    '=== ИЗМЕНЕНИЕ РЕЙТИНГА ПО ДНЯМ ===' as section;

SELECT 
    ps.date,
    ps.final_score as rating,
    ROUND(ps.mood_component::numeric, 2) as mood_component,
    ROUND(ps.activity_component::numeric, 2) as activity_component,
    ROUND(ps.platform_activity_coefficient::numeric, 2) as activity_coefficient,
    ps.mood_entries_count,
    ps.activity_entries_count,
    -- Проверка формулы вручную
    ROUND(
        (ps.mood_component + ps.activity_component) * 1.2 * ps.platform_activity_coefficient,
        2
    ) as calculated_rating_check,
    CASE 
        WHEN ABS(ps.final_score - ((ps.mood_component + ps.activity_component) * 1.2 * ps.platform_activity_coefficient)) < 0.01 
        THEN '✅ Валидно'
        ELSE '❌ Ошибка расчета'
    END as validation
FROM productivity_scores ps
WHERE ps.user_id = 4
AND ps.date >= CURRENT_DATE - INTERVAL '14 days'
ORDER BY ps.date DESC;

-- 3. СТАТИСТИКА ИЗМЕНЕНИЙ РЕЙТИНГА
SELECT 
    '=== СТАТИСТИКА ИЗМЕНЕНИЙ РЕЙТИНГА ===' as section;

WITH daily_ratings AS (
    SELECT 
        date,
        final_score as rating,
        LAG(final_score) OVER (ORDER BY date) as prev_rating
    FROM productivity_scores
    WHERE user_id = 4
    AND date >= CURRENT_DATE - INTERVAL '14 days'
)
SELECT 
    COUNT(*) as total_days,
    ROUND(AVG(rating)::numeric, 2) as avg_rating,
    ROUND(MIN(rating)::numeric, 2) as min_rating,
    ROUND(MAX(rating)::numeric, 2) as max_rating,
    ROUND(STDDEV(rating)::numeric, 2) as stddev_rating,
    COUNT(*) FILTER (WHERE rating >= 8) as excellent_days,
    COUNT(*) FILTER (WHERE rating >= 6 AND rating < 8) as good_days,
    COUNT(*) FILTER (WHERE rating >= 4 AND rating < 6) as average_days,
    COUNT(*) FILTER (WHERE rating < 4) as poor_days,
    COUNT(*) FILTER (WHERE rating > prev_rating) as days_improved,
    COUNT(*) FILTER (WHERE rating < prev_rating) as days_declined,
    COUNT(*) FILTER (WHERE rating = prev_rating) as days_stable
FROM daily_ratings;

-- 4. ДЕТАЛЬНЫЙ РАСЧЕТ ДЛЯ КАЖДОГО ДНЯ (проверка валидности)
SELECT 
    '=== ДЕТАЛЬНЫЙ РАСЧЕТ ПО ДНЯМ (ПРОВЕРКА ВАЛИДНОСТИ) ===' as section;

SELECT 
    ps.date,
    -- Исходные данные
    ps.mood_entries_count,
    ps.activity_entries_count,
    ROUND(ps.mood_component::numeric, 2) as mood_score,
    ROUND(ps.activity_component::numeric, 2) as activity_score,
    ROUND(ps.platform_activity_coefficient::numeric, 2) as coefficient,
    -- Расчет
    ROUND((ps.mood_component + ps.activity_component)::numeric, 2) as base_sum,
    ROUND((ps.mood_component + ps.activity_component) * 1.2::numeric, 2) as multiplied_by_1_2,
    ROUND(ps.final_score::numeric, 2) as final_rating,
    -- Проверка
    ROUND(
        ((ps.mood_component + ps.activity_component) * 1.2 * ps.platform_activity_coefficient)::numeric,
        2
    ) as expected_rating,
    CASE 
        WHEN ABS(ps.final_score - ((ps.mood_component + ps.activity_component) * 1.2 * ps.platform_activity_coefficient)) < 0.01 
        THEN '✅'
        ELSE '❌'
    END as is_valid
FROM productivity_scores ps
WHERE ps.user_id = 4
AND ps.date >= CURRENT_DATE - INTERVAL '14 days'
ORDER BY ps.date DESC;

-- 5. АНАЛИЗ КОЭФФИЦИЕНТА АКТИВНОСТИ
SELECT 
    '=== АНАЛИЗ КОЭФФИЦИЕНТА АКТИВНОСТИ ===' as section;

SELECT 
    ps.date,
    ps.platform_activity_coefficient,
    ps.mood_entries_count + ps.activity_entries_count as ai_signals_count,
    (SELECT COUNT(*) FROM activity_log WHERE user_id = 4 AND DATE(created_at) = ps.date) as activity_log_count,
    ps.mood_entries_count + ps.activity_entries_count + 
    (SELECT COUNT(*) FROM activity_log WHERE user_id = 4 AND DATE(created_at) = ps.date) as total_actions,
    CASE 
        WHEN ps.platform_activity_coefficient = 0.6 THEN 'Минимум (0.6)'
        WHEN ps.platform_activity_coefficient >= 0.9 THEN 'Высокий (≥0.9)'
        WHEN ps.platform_activity_coefficient >= 0.7 THEN 'Средний (0.7-0.9)'
        ELSE 'Низкий (<0.7)'
    END as coefficient_category
FROM productivity_scores ps
WHERE ps.user_id = 4
AND ps.date >= CURRENT_DATE - INTERVAL '14 days'
ORDER BY ps.date DESC;

-- 6. ИТОГОВАЯ СТАТИСТИКА
SELECT 
    '=== ИТОГОВАЯ СТАТИСТИКА ===' as section;

SELECT 
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND timestamp >= CURRENT_DATE - INTERVAL '14 days') as total_ai_signals,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND type = 'mood' AND timestamp >= CURRENT_DATE - INTERVAL '14 days') as total_mood_records,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = 4 AND type = 'activity' AND timestamp >= CURRENT_DATE - INTERVAL '14 days') as total_activity_records,
    (SELECT COUNT(*) FROM activity_log WHERE user_id = 4 AND DATE(created_at) >= CURRENT_DATE - INTERVAL '14 days') as total_activity_log_actions,
    (SELECT COUNT(DISTINCT DATE(timestamp)) FROM ai_signals WHERE user_id = 4 AND timestamp >= CURRENT_DATE - INTERVAL '14 days') as days_with_data,
    (SELECT COUNT(*) FROM productivity_scores WHERE user_id = 4 AND date >= CURRENT_DATE - INTERVAL '14 days') as days_with_ratings;

-- 7. РЕЗУЛЬТАТЫ ФУНКЦИЙ
SELECT 
    '=== РЕЗУЛЬТАТЫ ФУНКЦИЙ ===' as section;

SELECT 
    'calculate_simple_productivity_rating' as function_name,
    calculate_simple_productivity_rating(4) as result,
    'Среднее за последние 7 дней из productivity_scores' as description
UNION ALL
SELECT 
    'calculate_weekly_rating' as function_name,
    calculate_weekly_rating(4) as result,
    'Среднее за последние 7 дней' as description
UNION ALL
SELECT 
    'calculate_monthly_rating' as function_name,
    calculate_monthly_rating(4) as result,
    'Среднее за последние 30 дней' as description
UNION ALL
SELECT 
    'get_user_productivity_stats.overall_rating' as function_name,
    (SELECT overall_rating FROM get_user_productivity_stats(4)) as result,
    'Текущий общий рейтинг' as description;

-- 8. ПРОВЕРКА ВАЛИДНОСТИ: Все ли дни рассчитаны правильно?
SELECT 
    '=== ПРОВЕРКА ВАЛИДНОСТИ РАСЧЕТОВ ===' as section;

WITH validation_check AS (
    SELECT 
        ps.date,
        ps.final_score,
        (ps.mood_component + ps.activity_component) * 1.2 * ps.platform_activity_coefficient as expected,
        ABS(ps.final_score - ((ps.mood_component + ps.activity_component) * 1.2 * ps.platform_activity_coefficient)) as difference
    FROM productivity_scores ps
    WHERE ps.user_id = 4
    AND ps.date >= CURRENT_DATE - INTERVAL '14 days'
)
SELECT 
    COUNT(*) as total_days,
    COUNT(*) FILTER (WHERE difference < 0.01) as valid_days,
    COUNT(*) FILTER (WHERE difference >= 0.01) as invalid_days,
    ROUND(MAX(difference)::numeric, 4) as max_difference,
    CASE 
        WHEN COUNT(*) FILTER (WHERE difference >= 0.01) = 0 THEN '✅ Все расчеты валидны'
        ELSE '❌ Есть ошибки в расчетах'
    END as validation_status
FROM validation_check;
