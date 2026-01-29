-- ===================================================================
-- СКРИПТ ДЛЯ АНАЛИЗА ВЛИЯНИЯ ЗАПИСИ АКТИВНОСТИ НА РЕЙТИНГ
-- Упрощенная версия без специальных команд
-- ===================================================================

-- 1. СТРУКТУРА ТАБЛИЦЫ ai_signals
SELECT 
    '=== СТРУКТУРА ТАБЛИЦЫ ai_signals ===' as info;
    
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_signals'
ORDER BY ordinal_position;

-- 2. ПРИМЕРЫ ЗАПИСЕЙ АКТИВНОСТИ (последние 10)
SELECT 
    '=== ПРИМЕРЫ ЗАПИСЕЙ АКТИВНОСТИ (последние 10) ===' as info;

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
    LEFT(notes, 50) as notes_preview,
    timestamp,
    CASE 
        WHEN data IS NOT NULL THEN 'JSONB data present'
        ELSE 'NULL'
    END as data_status
FROM ai_signals 
WHERE type IN ('activity', 'activity_analysis')
ORDER BY timestamp DESC 
LIMIT 10;

-- 3. СТАТИСТИКА ПО ТИПАМ ЗАПИСЕЙ
SELECT 
    '=== СТАТИСТИКА ПО ТИПАМ ЗАПИСЕЙ ===' as info;

SELECT 
    type,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT DATE(timestamp)) as unique_days,
    ROUND(AVG(success_rating)::numeric, 2) as avg_success_rating,
    ROUND(AVG(duration_minutes)::numeric, 2) as avg_duration,
    ROUND(AVG(quality_score)::numeric, 2) as avg_quality_score,
    ROUND(AVG(mood_rating)::numeric, 2) as avg_mood_rating,
    ROUND(AVG(energy_rating)::numeric, 2) as avg_energy_rating,
    ROUND(AVG(stress_rating)::numeric, 2) as avg_stress_rating
FROM ai_signals
GROUP BY type
ORDER BY total_records DESC;

-- 4. ПРИМЕРЫ ЗАПИСЕЙ АКТИВНОСТИ С JSONB data
SELECT 
    '=== ПРИМЕРЫ ЗАПИСЕЙ С JSONB DATA (последние 5) ===' as info;

SELECT 
    id,
    user_id,
    type,
    activity_category,
    duration_minutes,
    success_rating,
    quality_score,
    timestamp,
    CASE 
        WHEN data IS NOT NULL THEN data::text
        ELSE 'NULL'
    END as jsonb_data
FROM ai_signals 
WHERE type IN ('activity', 'activity_analysis')
ORDER BY timestamp DESC 
LIMIT 5;

-- 5. ОПРЕДЕЛЕНИЯ ФУНКЦИЙ РАСЧЕТА РЕЙТИНГА
SELECT 
    '=== ФУНКЦИЯ calculate_productivity_score ===' as info;

SELECT 
    proname,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'calculate_productivity_score';

SELECT 
    '=== ФУНКЦИЯ get_user_productivity_stats ===' as info;

SELECT 
    proname,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'get_user_productivity_stats';

-- 6. АНАЛИЗ ВЛИЯНИЯ АКТИВНОСТИ НА РЕЙТИНГ (для user_id = 3)
SELECT 
    '=== АНАЛИЗ АКТИВНОСТИ ПО ДНЯМ (user_id = 3) ===' as info;

SELECT 
    DATE(timestamp) as date,
    COUNT(*) as activities_count,
    ROUND(AVG(success_rating)::numeric, 2) as avg_success,
    ROUND(AVG(duration_minutes)::numeric, 2) as avg_duration,
    ROUND(AVG(quality_score)::numeric, 2) as avg_quality,
    STRING_AGG(DISTINCT activity_category, ', ') as categories
FROM ai_signals
WHERE user_id = 3 
    AND type IN ('activity', 'activity_analysis')
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 7;

-- 7. ПРОВЕРКА ИСПОЛЬЗОВАНИЯ ПОЛЕЙ mood_rating, energy_rating, stress_rating
SELECT 
    '=== ИСПОЛЬЗОВАНИЕ ПОЛЕЙ НАСТРОЕНИЯ В АКТИВНОСТЯХ ===' as info;

SELECT 
    COUNT(*) FILTER (WHERE mood_rating IS NOT NULL) as records_with_mood,
    COUNT(*) FILTER (WHERE energy_rating IS NOT NULL) as records_with_energy,
    COUNT(*) FILTER (WHERE stress_rating IS NOT NULL) as records_with_stress,
    COUNT(*) as total_activity_records,
    ROUND(100.0 * COUNT(*) FILTER (WHERE mood_rating IS NOT NULL) / COUNT(*), 2) as percent_with_mood,
    ROUND(100.0 * COUNT(*) FILTER (WHERE energy_rating IS NOT NULL) / COUNT(*), 2) as percent_with_energy,
    ROUND(100.0 * COUNT(*) FILTER (WHERE stress_rating IS NOT NULL) / COUNT(*), 2) as percent_with_stress
FROM ai_signals
WHERE type IN ('activity', 'activity_analysis');

-- 8. ТЕКУЩИЙ РЕЙТИНГ ПОЛЬЗОВАТЕЛЯ (user_id = 3)
SELECT 
    '=== ТЕКУЩИЙ РЕЙТИНГ ПРОДУКТИВНОСТИ (user_id = 3) ===' as info;

SELECT 
    calculate_productivity_score(3, CURRENT_DATE) as current_productivity_score;

SELECT 
    '=== СТАТИСТИКА ПРОДУКТИВНОСТИ (user_id = 3) ===' as info;

SELECT * FROM get_user_productivity_stats(3);

-- 9. ПРЕДСТАВЛЕНИЯ И ВИРТУАЛЬНЫЕ ТАБЛИЦЫ
SELECT 
    '=== ПРЕДСТАВЛЕНИЯ СВЯЗАННЫЕ С ПРОДУКТИВНОСТЬЮ ===' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name LIKE '%productivity%' OR table_name LIKE '%activity%')
ORDER BY table_name;

-- 10. ПОСЛЕДНИЕ ЗАПИСИ АКТИВНОСТИ С РЕЙТИНГОМ (user_id = 3)
SELECT 
    '=== ПОСЛЕДНИЕ ЗАПИСИ АКТИВНОСТИ (user_id = 3) ===' as info;

SELECT 
    id,
    timestamp,
    activity_category,
    success_rating,
    duration_minutes,
    quality_score,
    LEFT(notes, 100) as notes_preview
FROM ai_signals
WHERE user_id = 3 
    AND type IN ('activity', 'activity_analysis')
ORDER BY timestamp DESC
LIMIT 10;
