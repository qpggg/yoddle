-- =====================================================
-- АНАЛИЗ ДЕЙСТВИЙ ЗА КОНКРЕТНЫЙ ДЕНЬ
-- =====================================================

-- 1. Показать все возможные типы действий в системе
SELECT '=== ВСЕ ВОЗМОЖНЫЕ ДЕЙСТВИЯ В СИСТЕМЕ ===' as info;
SELECT 
    id,
    action_code,
    name,
    description,
    xp_reward,
    category
FROM activity_types 
ORDER BY category, xp_reward DESC;

-- 2. Показать количество действий за конкретный день (2025-08-26)
SELECT '=== ДЕЙСТВИЯ ЗА 2025-08-26 ===' as info;

-- Действия из ai_signals
SELECT 
    'ai_signals' as source,
    type as action_type,
    COUNT(*) as count,
    'Записи настроения/активности' as description
FROM ai_signals 
WHERE user_id = 3 
AND DATE(timestamp) = '2025-08-26'
GROUP BY type
ORDER BY count DESC;

-- Действия из activity_log
SELECT 
    'activity_log' as source,
    action as action_type,
    COUNT(*) as count,
    at.name as description
FROM activity_log al
LEFT JOIN activity_types at ON al.action = at.action_code
WHERE al.user_id = 3 
AND DATE(al.created_at) = '2025-08-26'
GROUP BY al.action, at.name
ORDER BY count DESC;

-- 3. Общий подсчет действий за день (для K коэффициента)
SELECT '=== ОБЩИЙ ПОДСЧЕТ ДЛЯ K КОЭФФИЦИЕНТА ===' as info;

-- ai_signals (исключая отчеты)
SELECT 
    'ai_signals (без отчетов)' as source,
    COUNT(*) as total_actions
FROM ai_signals
WHERE user_id = 3 
AND DATE(timestamp) = '2025-08-26'
AND type NOT IN ('daily_mood_report', 'daily_activity_report');

-- activity_log (только нужные действия)
SELECT 
    'activity_log (нужные действия)' as source,
    COUNT(*) as total_actions
FROM activity_log
WHERE user_id = 3 
AND DATE(created_at) = '2025-08-26'
AND action NOT IN (SELECT code FROM achievements)
AND action IN (
    'login', 'first_login_today', 'profile_update', 'avatar_upload',
    'benefit_added', 'benefit_used', 'preferences_test',
    'recommendations_received', 'progress_view'
);

-- 4. Детальный анализ по типам
SELECT '=== ДЕТАЛЬНЫЙ АНАЛИЗ ПО ТИПАМ ===' as info;

-- Все записи ai_signals за день
SELECT 
    id,
    type,
    mood_rating,
    energy_rating,
    stress_rating,
    success_rating,
    timestamp
FROM ai_signals
WHERE user_id = 3 
AND DATE(timestamp) = '2025-08-26'
ORDER BY timestamp;

-- Все записи activity_log за день
SELECT 
    al.id,
    al.action,
    at.name as action_name,
    at.xp_reward,
    al.created_at
FROM activity_log al
LEFT JOIN activity_types at ON al.action = at.action_code
WHERE al.user_id = 3 
AND DATE(al.created_at) = '2025-08-26'
ORDER BY al.created_at;

-- 5. Проверка функций продуктивности
SELECT '=== ПРОВЕРКА ФУНКЦИЙ ПРОДУКТИВНОСТИ ===' as info;

SELECT 
    'Настроение' as metric,
    calculate_mood_percentage(3, '2025-08-26'::DATE) as percentage
UNION ALL
SELECT 
    'Энергия' as metric,
    calculate_energy_percentage(3, '2025-08-26'::DATE) as percentage
UNION ALL
SELECT 
    'Спокойствие' as metric,
    calculate_calmness_percentage(3, '2025-08-26'::DATE) as percentage;

-- 6. Сводка по дням недели
SELECT '=== СВОДКА ПО ДНЯМ НЕДЕЛИ ===' as info;

SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_records,
    STRING_AGG(DISTINCT type, ', ') as types
FROM ai_signals
WHERE user_id = 3 
AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;





