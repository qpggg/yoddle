-- ===================================================================
-- СКРИПТ ДЛЯ АНАЛИЗА ВЛИЯНИЯ ЗАПИСИ АКТИВНОСТИ НА РЕЙТИНГ
-- ===================================================================
-- Этот скрипт выводит всю информацию о том, как активность влияет
-- на рейтинг продуктивности и недельные показатели
-- ===================================================================

\echo '==================================================================='
\echo '1. СТРУКТУРА ТАБЛИЦЫ ai_signals'
\echo '==================================================================='

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_signals'
ORDER BY ordinal_position;

\echo ''
\echo '==================================================================='
\echo '2. ПРИМЕРЫ ЗАПИСЕЙ АКТИВНОСТИ (последние 10)'
\echo '==================================================================='

SELECT 
    id,
    user_id,
    type,
    activity_category,
    duration_minutes,
    success_rating,
    mood_rating,
    energy_rating,
    stress_rating,
    quality_score,
    notes,
    timestamp,
    -- Показываем data если оно есть
    CASE 
        WHEN data IS NOT NULL THEN 'JSONB data present'
        ELSE 'NULL'
    END as data_status
FROM ai_signals 
WHERE type IN ('activity', 'activity_analysis')
ORDER BY timestamp DESC 
LIMIT 10;

\echo ''
\echo '==================================================================='
\echo '3. СТАТИСТИКА ПО ТИПАМ ЗАПИСЕЙ'
\echo '==================================================================='

SELECT 
    type,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT DATE(timestamp)) as unique_days,
    AVG(success_rating) as avg_success_rating,
    AVG(duration_minutes) as avg_duration,
    AVG(quality_score) as avg_quality_score,
    AVG(mood_rating) as avg_mood_rating,
    AVG(energy_rating) as avg_energy_rating,
    AVG(stress_rating) as avg_stress_rating
FROM ai_signals
GROUP BY type
ORDER BY total_records DESC;

\echo ''
\echo '==================================================================='
\echo '4. ПРИМЕРЫ ЗАПИСЕЙ АКТИВНОСТИ С ДЕТАЛЯМИ (JSONB data)'
\echo '==================================================================='

SELECT 
    id,
    user_id,
    type,
    activity_category,
    duration_minutes,
    success_rating,
    quality_score,
    timestamp,
    -- Извлекаем данные из JSONB если они есть
    CASE 
        WHEN data IS NOT NULL THEN data::text
        ELSE 'NULL'
    END as jsonb_data
FROM ai_signals 
WHERE type IN ('activity', 'activity_analysis')
ORDER BY timestamp DESC 
LIMIT 5;

\echo ''
\echo '==================================================================='
\echo '5. ОПРЕДЕЛЕНИЯ ФУНКЦИЙ РАСЧЕТА РЕЙТИНГА'
\echo '==================================================================='

-- Функция calculate_productivity_score
SELECT 
    'calculate_productivity_score' as function_name,
    proname,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'calculate_productivity_score';

\echo ''
\echo '---'

-- Функция get_user_productivity_stats
SELECT 
    'get_user_productivity_stats' as function_name,
    proname,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'get_user_productivity_stats';

\echo ''
\echo '==================================================================='
\echo '6. ПРИМЕР РАСЧЕТА РЕЙТИНГА ДЛЯ КОНКРЕТНОГО ПОЛЬЗОВАТЕЛЯ'
\echo '==================================================================='

-- Замените 3 на нужный user_id
DO $$
DECLARE
    test_user_id INTEGER := 3;
    calculated_score NUMERIC;
    stats_record RECORD;
BEGIN
    -- Показываем данные активности пользователя
    RAISE NOTICE 'Активности пользователя %:', test_user_id;
    
    -- Вызываем функцию расчета рейтинга
    SELECT calculate_productivity_score(test_user_id, CURRENT_DATE) INTO calculated_score;
    RAISE NOTICE 'Рассчитанный рейтинг продуктивности: %', calculated_score;
    
    -- Получаем статистику
    SELECT * INTO stats_record FROM get_user_productivity_stats(test_user_id);
    
    RAISE NOTICE 'Статистика продуктивности:';
    RAISE NOTICE '  overall_rating: %', stats_record.overall_rating;
    RAISE NOTICE '  total_records: %', stats_record.total_records;
    RAISE NOTICE '  mood_stability: %', stats_record.mood_stability;
    RAISE NOTICE '  energy_consistency: %', stats_record.energy_consistency;
    RAISE NOTICE '  stress_management: %', stats_record.stress_management;
END $$;

\echo ''
\echo '==================================================================='
\echo '7. АНАЛИЗ ВЛИЯНИЯ АКТИВНОСТИ НА РЕЙТИНГ (для user_id = 3)'
\echo '==================================================================='

SELECT 
    DATE(timestamp) as date,
    COUNT(*) as activities_count,
    AVG(success_rating) as avg_success,
    AVG(duration_minutes) as avg_duration,
    AVG(quality_score) as avg_quality,
    STRING_AGG(DISTINCT activity_category, ', ') as categories
FROM ai_signals
WHERE user_id = 3 
    AND type IN ('activity', 'activity_analysis')
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 7;

\echo ''
\echo '==================================================================='
\echo '8. СРАВНЕНИЕ РЕЙТИНГА ДО И ПОСЛЕ ЗАПИСИ АКТИВНОСТИ'
\echo '==================================================================='

-- Показываем последние записи активности и их влияние
WITH activity_records AS (
    SELECT 
        id,
        user_id,
        timestamp,
        success_rating,
        duration_minutes,
        quality_score,
        activity_category
    FROM ai_signals
    WHERE user_id = 3 
        AND type IN ('activity', 'activity_analysis')
    ORDER BY timestamp DESC
    LIMIT 5
)
SELECT 
    ar.id,
    ar.timestamp,
    ar.success_rating,
    ar.duration_minutes,
    ar.quality_score,
    ar.activity_category,
    -- Пытаемся получить рейтинг после этой записи
    (SELECT calculate_productivity_score(ar.user_id, DATE(ar.timestamp))) as productivity_score_after
FROM activity_records ar
ORDER BY ar.timestamp DESC;

\echo ''
\echo '==================================================================='
\echo '9. ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОЛЕЙ mood_rating, energy_rating, stress_rating'
\echo '==================================================================='

SELECT 
    COUNT(*) FILTER (WHERE mood_rating IS NOT NULL) as records_with_mood,
    COUNT(*) FILTER (WHERE energy_rating IS NOT NULL) as records_with_energy,
    COUNT(*) FILTER (WHERE stress_rating IS NOT NULL) as records_with_stress,
    COUNT(*) as total_activity_records
FROM ai_signals
WHERE type IN ('activity', 'activity_analysis');

\echo ''
\echo '==================================================================='
\echo '10. ПРЕДСТАВЛЕНИЯ И ВИРТУАЛЬНЫЕ ТАБЛИЦЫ СВЯЗАННЫЕ С ПРОДУКТИВНОСТЬЮ'
\echo '==================================================================='

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name LIKE '%productivity%' OR table_name LIKE '%activity%')
ORDER BY table_name;

\echo ''
\echo '==================================================================='
\echo 'АНАЛИЗ ЗАВЕРШЕН'
\echo '==================================================================='
