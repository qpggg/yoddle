-- =====================================================
-- ПРОВЕРКА SQL ФУНКЦИЙ ПРОДУКТИВНОСТИ
-- Пользователь ID = 3
-- =====================================================

-- 1. Проверка что функции существуют
\df *mood*

-- 2. Проверка функции средних недельных процентов
SELECT '=== СРЕДНИЕ НЕДЕЛЬНЫЕ ПРОЦЕНТЫ ===' as info;
SELECT * FROM get_weekly_average_percentages(3);

-- 3. Проверка функции ежедневных процентов
SELECT '=== ЕЖЕДНЕВНЫЕ ПРОЦЕНТЫ ===' as info;
SELECT * FROM get_weekly_mood_percentages(3);

-- 4. Проверка функций расчета для конкретного дня (понедельник)
SELECT '=== ПРОЦЕНТЫ ЗА ПОНЕДЕЛЬНИК ===' as info;
SELECT 
    calculate_mood_percentage(3, CURRENT_DATE - 6) as mood_monday,
    calculate_energy_percentage(3, CURRENT_DATE - 6) as energy_monday,
    calculate_calmness_percentage(3, CURRENT_DATE - 6) as calmness_monday;

-- 5. Проверка сырых данных в таблице ai_signals
SELECT '=== СЫРЫЕ ДАННЫЕ AI_SIGNALS ===' as info;
SELECT 
    DATE(timestamp) as date,
    mood_rating,
    energy_rating,
    stress_rating,
    type,
    notes
FROM ai_signals 
WHERE user_id = 3 
AND timestamp >= CURRENT_DATE - 7
ORDER BY timestamp;

-- 6. Проверка структуры функций
SELECT '=== СТРУКТУРА ФУНКЦИЙ ===' as info;
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname LIKE '%mood%' OR proname LIKE '%percentage%';

-- 7. Проверка данных за каждый день недели
SELECT '=== ДАННЫЕ ПО ДНЯМ НЕДЕЛИ ===' as info;
SELECT 
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'Day') as day_name,
    COUNT(*) as records_count,
    AVG(mood_rating) as avg_mood,
    AVG(energy_rating) as avg_energy,
    AVG(stress_rating) as avg_stress
FROM ai_signals 
WHERE user_id = 3 
AND timestamp >= CURRENT_DATE - 7
GROUP BY DATE(timestamp), TO_CHAR(timestamp, 'Day')
ORDER BY DATE(timestamp);

-- 8. Проверка что данные действительно есть
SELECT '=== ПОДСЧЕТ ЗАПИСЕЙ ===' as info;
SELECT 
    'ai_signals' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT DATE(timestamp)) as days_with_data
FROM ai_signals
WHERE user_id = 3 AND timestamp >= CURRENT_DATE - 7
UNION ALL
SELECT
    'activity_log' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT DATE(created_at)) as days_with_data
FROM activity_log
WHERE user_id = 3 AND created_at >= CURRENT_DATE - 7;

-- 9. Проверка типов данных
SELECT '=== ТИПЫ ДАННЫХ ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_signals' 
AND column_name IN ('mood_rating', 'energy_rating', 'stress_rating')
ORDER BY column_name;
