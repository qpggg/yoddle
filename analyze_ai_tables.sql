-- =====================================================
-- АНАЛИЗ СТРУКТУРЫ И СОДЕРЖИМОГО AI ТАБЛИЦ
-- =====================================================

-- 1. АНАЛИЗ СТРУКТУРЫ ТАБЛИЦЫ ai_signals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ai_signals' 
ORDER BY ordinal_position;

-- 2. ПОСМОТРЕТЬ СОДЕРЖИМОЕ ai_signals (первые 10 записей)
SELECT 
    id,
    user_id,
    type,
    data,
    timestamp,
    created_at
FROM ai_signals 
ORDER BY timestamp DESC 
LIMIT 10;

-- 3. АНАЛИЗ СТРУКТУРЫ ai_insights
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ai_insights' 
ORDER BY ordinal_position;

-- 4. ПОСМОТРЕТЬ СОДЕРЖИМОЕ ai_insights
SELECT 
    id,
    user_id,
    type,
    content,
    metadata,
    created_at,
    read_at
FROM ai_insights 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. АНАЛИЗ СТРУКТУРЫ ai_recommendations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ai_recommendations' 
ORDER BY ordinal_position;

-- 6. ПОСМОТРЕТЬ СОДЕРЖИМОЕ ai_recommendations
SELECT 
    id,
    user_id,
    category,
    message,
    priority,
    action_taken,
    created_at,
    expires_at
FROM ai_recommendations 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. АНАЛИЗ СТРУКТУРЫ ai_user_preferences
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ai_user_preferences' 
ORDER BY ordinal_position;

-- 8. ПОСМОТРЕТЬ СОДЕРЖИМОЕ ai_user_preferences
SELECT 
    id,
    user_id,
    analysis_frequency,
    privacy_level,
    notification_preferences,
    ai_personality,
    created_at,
    updated_at
FROM ai_user_preferences 
ORDER BY created_at DESC 
LIMIT 10;

-- 9. АНАЛИЗ СТРУКТУРЫ ai_metrics
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ai_metrics' 
ORDER BY ordinal_position;

-- 10. ПОСМОТРЕТЬ СОДЕРЖИМОЕ ai_metrics
SELECT 
    id,
    user_id,
    metric_type,
    metric_value,
    metric_date,
    context,
    created_at
FROM ai_metrics 
ORDER BY metric_date DESC 
LIMIT 10;

-- 11. СТАТИСТИКА ПО ТИПАМ СИГНАЛОВ
SELECT 
    type,
    COUNT(*) as count,
    MIN(timestamp) as first_signal,
    MAX(timestamp) as last_signal
FROM ai_signals 
GROUP BY type 
ORDER BY count DESC;

-- 12. СТАТИСТИКА ПО ПОЛЬЗОВАТЕЛЯМ
SELECT 
    user_id,
    COUNT(*) as total_signals,
    COUNT(DISTINCT type) as unique_types,
    MIN(timestamp) as first_signal,
    MAX(timestamp) as last_signal
FROM ai_signals 
GROUP BY user_id 
ORDER BY total_signals DESC;

-- 13. ПОСЛЕДНИЕ 5 ЗАПИСЕЙ С РАЗБОРКОЙ JSON ДАННЫХ
SELECT 
    id,
    user_id,
    type,
    timestamp,
    data,
    CASE 
        WHEN data IS NOT NULL THEN 
            CASE 
                WHEN data ? 'mood' THEN 'mood: ' || (data->>'mood')::text
                WHEN data ? 'activity' THEN 'activity: ' || (data->>'activity')::text
                WHEN data ? 'notes' THEN 'notes: ' || (data->>'notes')::text
                WHEN data ? 'stressLevel' THEN 'stress: ' || (data->>'stressLevel')::text
                ELSE 'other data'
            END
        ELSE 'no data'
    END as data_summary
FROM ai_signals 
ORDER BY timestamp DESC 
LIMIT 5;

-- 14. ПРОВЕРКА СВЯЗЕЙ С ТАБЛИЦЕЙ enter (пользователи)
SELECT 
    e.id as user_id,
    e.email,
    COUNT(s.id) as signals_count,
    COUNT(i.id) as insights_count
FROM enter e
LEFT JOIN ai_signals s ON e.id = s.user_id
LEFT JOIN ai_insights i ON e.id = i.user_id
GROUP BY e.id, e.email
ORDER BY signals_count DESC
LIMIT 10;
