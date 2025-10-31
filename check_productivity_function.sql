-- =====================================================
-- ПРОВЕРКА ФУНКЦИИ get_user_productivity_stats
-- =====================================================

-- 1. Проверяем существование функции
SELECT '=== ПРОВЕРКА СУЩЕСТВОВАНИЯ ФУНКЦИИ ===' as info;
SELECT 
    proname as function_name,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_user_productivity_stats';

-- 2. Проверяем структуру возвращаемых данных
SELECT '=== СТРУКТУРА ВОЗВРАЩАЕМЫХ ДАННЫХ ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'get_user_productivity_stats'
ORDER BY ordinal_position;

-- 3. Тестируем функцию для пользователя 3
SELECT '=== ТЕСТИРОВАНИЕ ФУНКЦИИ ДЛЯ USER_ID = 3 ===' as info;
SELECT * FROM get_user_productivity_stats(3);

-- 4. Проверяем что возвращает функция
SELECT '=== ДЕТАЛЬНЫЙ АНАЛИЗ РЕЗУЛЬТАТА ===' as info;
SELECT 
    'current_score' as field,
    current_score as value,
    'DECIMAL(5,2)' as expected_type
FROM get_user_productivity_stats(3)
UNION ALL
SELECT 
    'current_level' as field,
    current_level::text as value,
    'TEXT' as expected_type
FROM get_user_productivity_stats(3)
UNION ALL
SELECT 
    'current_tier' as field,
    current_tier::text as value,
    'TEXT' as expected_type
FROM get_user_productivity_stats(3)
UNION ALL
SELECT 
    'xp_multiplier' as field,
    xp_multiplier as value,
    'DECIMAL(3,2)' as expected_type
FROM get_user_productivity_stats(3);

-- 5. Проверяем данные в таблицах
SELECT '=== ПРОВЕРКА ДАННЫХ В ТАБЛИЦАХ ===' as info;

-- Проверяем user_progress
SELECT 'user_progress' as table_name, COUNT(*) as records
FROM user_progress WHERE user_id = 3
UNION ALL
SELECT 'user_achievements' as table_name, COUNT(*) as records
FROM user_achievements WHERE user_id = 3
UNION ALL
SELECT 'ai_signals' as table_name, COUNT(*) as records
FROM ai_signals WHERE user_id = 3
UNION ALL
SELECT 'activity_log' as table_name, COUNT(*) as records
FROM activity_log WHERE user_id = 3;

-- 6. Если данных нет, создаем базовые записи
SELECT '=== СОЗДАНИЕ БАЗОВЫХ ЗАПИСЕЙ ЕСЛИ ИХ НЕТ ===' as info;

-- Проверяем есть ли запись в user_progress
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_progress WHERE user_id = 3) THEN
        INSERT INTO user_progress (user_id, productivity_score, weekly_productivity, monthly_productivity, mood_stability, energy_consistency, stress_management, created_at, updated_at)
        VALUES (3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, NOW(), NOW());
        RAISE NOTICE '✅ Создана базовая запись в user_progress для user_id = 3';
    ELSE
        RAISE NOTICE 'ℹ️ Запись в user_progress уже существует для user_id = 3';
    END IF;
END $$;

-- 7. Повторно тестируем функцию
SELECT '=== ПОВТОРНОЕ ТЕСТИРОВАНИЕ ФУНКЦИИ ===' as info;
SELECT * FROM get_user_productivity_stats(3);





