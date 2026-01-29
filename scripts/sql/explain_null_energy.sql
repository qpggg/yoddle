-- Объяснение почему средняя энергия NULL и настроение большое

-- 1. Все записи настроения для пользователя 3 за последние 7 дней
SELECT 
    id,
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'HH24:MI:SS') as time,
    type,
    mood_rating,
    energy_rating,
    stress_rating,
    CASE 
        WHEN energy_rating IS NULL THEN 'NULL - поле не заполнено'
        ELSE 'Заполнено'
    END as energy_status,
    notes
FROM ai_signals
WHERE user_id = 3
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- 2. Все записи настроения для пользователя 3 за всю историю (последние 20)
SELECT 
    id,
    DATE(timestamp) as date,
    TO_CHAR(timestamp, 'HH24:MI:SS') as time,
    type,
    mood_rating,
    energy_rating,
    stress_rating,
    CASE 
        WHEN energy_rating IS NULL THEN 'NULL'
        ELSE energy_rating::text
    END as energy_value,
    notes
FROM ai_signals
WHERE user_id = 3
AND type IN ('mood', 'daily_mood_check')
ORDER BY timestamp DESC
LIMIT 20;

-- 3. Статистика по заполненности полей для пользователя 3
SELECT 
    'Статистика заполненности полей' as info,
    COUNT(*) as total_records,
    COUNT(mood_rating) as mood_filled,
    COUNT(energy_rating) as energy_filled,
    COUNT(stress_rating) as stress_filled,
    COUNT(*) - COUNT(mood_rating) as mood_null,
    COUNT(*) - COUNT(energy_rating) as energy_null,
    COUNT(*) - COUNT(stress_rating) as stress_null,
    ROUND(COUNT(mood_rating)::DECIMAL / COUNT(*) * 100, 1) as mood_fill_percent,
    ROUND(COUNT(energy_rating)::DECIMAL / COUNT(*) * 100, 1) as energy_fill_percent,
    ROUND(COUNT(stress_rating)::DECIMAL / COUNT(*) * 100, 1) as stress_fill_percent
FROM ai_signals
WHERE user_id = 3
AND type IN ('mood', 'daily_mood_check');

-- 4. Средние значения только для заполненных записей
SELECT 
    'Средние значения (только заполненные)' as info,
    COUNT(*) as total_records,
    ROUND(AVG(mood_rating), 2) as avg_mood,
    ROUND(AVG(energy_rating), 2) as avg_energy,
    ROUND(AVG(stress_rating), 2) as avg_stress,
    ROUND(AVG(mood_rating) * 10, 1) as mood_percent,
    ROUND(AVG(energy_rating) * 10, 1) as energy_percent,
    ROUND(AVG(10 - stress_rating) * 10, 1) as calmness_percent
FROM ai_signals
WHERE user_id = 3
AND type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- 5. Сравнение с другими пользователями
SELECT 
    user_id,
    COUNT(*) as total_records,
    COUNT(energy_rating) as energy_filled,
    ROUND(COUNT(energy_rating)::DECIMAL / COUNT(*) * 100, 1) as energy_fill_percent,
    ROUND(AVG(mood_rating), 2) as avg_mood,
    ROUND(AVG(energy_rating), 2) as avg_energy
FROM ai_signals
WHERE type IN ('mood', 'daily_mood_check')
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id
ORDER BY user_id;

-- 6. Проверка структуры таблицы ai_signals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ai_signals'
AND column_name IN ('mood_rating', 'energy_rating', 'stress_rating')
ORDER BY ordinal_position;
