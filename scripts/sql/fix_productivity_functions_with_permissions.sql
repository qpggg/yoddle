-- ===================================================================
-- ИСПРАВЛЕНИЕ ФУНКЦИЙ РАСЧЕТА ПРОДУКТИВНОСТИ (версия с обработкой прав)
-- ===================================================================
-- Этот скрипт решает проблему "function is not unique" и ошибки прав доступа
-- ===================================================================

-- ВАЖНО: Если получаете ошибку "must be owner of function", выполните:
-- 
-- Вариант 1 (рекомендуется): Запустите от суперпользователя:
--   psql -U postgres -d yoddle_db -f scripts/sql/fix_productivity_functions_with_permissions.sql
--
-- Вариант 2: В DBeaver или другом клиенте выполните:
--   SET ROLE postgres;  -- или имя владельца БД
--   затем выполните этот скрипт
--
-- Вариант 3: Попросите администратора БД выполнить этот скрипт

-- Сначала пытаемся удалить все версии функций
-- Если не получается из-за прав - продолжаем (CREATE OR REPLACE может не сработать)

DO $$
DECLARE
    r RECORD;
    func_names TEXT[] := ARRAY[
        'calculate_simple_productivity_rating',
        'count_total_records',
        'get_user_productivity_stats',
        'calculate_weekly_rating',
        'calculate_monthly_rating'
    ];
    func_name TEXT;
    dropped_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Для каждой функции удаляем все её версии
    FOREACH func_name IN ARRAY func_names
    LOOP
        FOR r IN 
            SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
            FROM pg_proc 
            WHERE proname = func_name
        LOOP
            BEGIN
                -- Пытаемся удалить функцию
                EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', r.proname, r.args);
                dropped_count := dropped_count + 1;
                RAISE NOTICE '✓ Удалена функция: %(%)', r.proname, r.args;
            EXCEPTION WHEN OTHERS THEN
                -- Если не удалось удалить из-за прав, просто пропускаем
                error_count := error_count + 1;
                RAISE WARNING '✗ Не удалось удалить функцию %(%): %', r.proname, r.args, SQLERRM;
            END;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Удалено функций: %', dropped_count;
    IF error_count > 0 THEN
        RAISE WARNING 'Ошибок при удалении: % (возможно, нужны права суперпользователя)', error_count;
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- Теперь создаем правильные версии функций с нужными сигнатурами
-- Если функции не были удалены из-за прав, CREATE OR REPLACE может не сработать
-- В этом случае нужно запустить скрипт от суперпользователя

-- Функция для расчета простого рейтинга продуктивности
CREATE OR REPLACE FUNCTION calculate_simple_productivity_rating(p_user_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    v_avg_score NUMERIC;
BEGIN
    -- Используем последний рассчитанный рейтинг из productivity_scores
    SELECT COALESCE(AVG(final_score), 0) INTO v_avg_score
    FROM productivity_scores
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Если нет данных за неделю, используем текущий день
    IF v_avg_score = 0 THEN
        SELECT COALESCE(final_score, 0) INTO v_avg_score
        FROM productivity_scores
        WHERE user_id = p_user_id
        AND date = CURRENT_DATE
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    -- Если все еще нет данных, рассчитываем на лету
    IF v_avg_score = 0 THEN
        SELECT calculate_productivity_score(p_user_id, CURRENT_DATE) INTO v_avg_score;
    END IF;
    
    RETURN COALESCE(v_avg_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Функция для подсчета общего количества записей
CREATE OR REPLACE FUNCTION count_total_records(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check', 'activity', 'activity_analysis');
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Исправленная функция get_user_productivity_stats
CREATE OR REPLACE FUNCTION get_user_productivity_stats(p_user_id INTEGER)
RETURNS TABLE(
    overall_rating NUMERIC,
    total_records INTEGER,
    mood_average NUMERIC,
    activity_average NUMERIC,
    mood_stability NUMERIC,
    energy_consistency NUMERIC,
    stress_management NUMERIC,
    xp_multiplier NUMERIC,
    total_achievements INTEGER,
    productivity_achievements INTEGER
) AS $$
DECLARE
    v_mood_stability NUMERIC;
    v_energy_consistency NUMERIC;
    v_stress_management NUMERIC;
    v_xp_multiplier NUMERIC;
    v_total_achievements INTEGER;
    v_productivity_achievements INTEGER;
BEGIN
    -- Стабильность настроения (стандартное отклонение, инвертированное)
    SELECT 
        CASE 
            WHEN COUNT(*) > 1 THEN 
                GREATEST(0, 10 - COALESCE(STDDEV(mood_rating) * 2, 0))
            ELSE 10
        END INTO v_mood_stability
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND mood_rating IS NOT NULL
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Если нет данных, устанавливаем значение по умолчанию
    IF v_mood_stability IS NULL THEN
        v_mood_stability := 5.0;
    END IF;
    
    -- Стабильность энергии
    SELECT 
        CASE 
            WHEN COUNT(*) > 1 THEN 
                GREATEST(0, 10 - COALESCE(STDDEV(energy_rating) * 2, 0))
            ELSE 10
        END INTO v_energy_consistency
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND energy_rating IS NOT NULL
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Если нет данных, устанавливаем значение по умолчанию
    IF v_energy_consistency IS NULL THEN
        v_energy_consistency := 5.0;
    END IF;
    
    -- Управление стрессом (чем ниже стресс, тем лучше)
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                GREATEST(0, 10 - COALESCE(AVG(stress_rating), 5))
            ELSE 5
        END INTO v_stress_management
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND stress_rating IS NOT NULL
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Если нет данных, устанавливаем значение по умолчанию
    IF v_stress_management IS NULL THEN
        v_stress_management := 5.0;
    END IF;
    
    -- XP множитель (базовый, можно улучшить на основе уровня продуктивности)
    SELECT 
        CASE 
            WHEN calculate_simple_productivity_rating(p_user_id) >= 8 THEN 1.5
            WHEN calculate_simple_productivity_rating(p_user_id) >= 6 THEN 1.2
            WHEN calculate_simple_productivity_rating(p_user_id) >= 4 THEN 1.0
            ELSE 0.8
        END INTO v_xp_multiplier;
    
    -- Общее количество достижений
    SELECT COUNT(*) INTO v_total_achievements
    FROM user_achievements
    WHERE user_id = p_user_id;
    
    -- Достижения продуктивности (можно расширить логику)
    SELECT COUNT(*) INTO v_productivity_achievements
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.code
    WHERE ua.user_id = p_user_id
    AND (a.code LIKE '%productivity%' OR a.code LIKE '%mood%' OR a.code LIKE '%activity%');
    
    RETURN QUERY
    SELECT 
        calculate_simple_productivity_rating(p_user_id) as overall_rating,
        count_total_records(p_user_id) as total_records,
        (SELECT COALESCE(AVG(mood_rating), 0) 
         FROM ai_signals 
         WHERE user_id = p_user_id 
         AND type IN ('mood', 'daily_mood_check') 
         AND mood_rating IS NOT NULL) as mood_average,
        (SELECT COALESCE(AVG(success_rating), 0) 
         FROM ai_signals 
         WHERE user_id = p_user_id 
         AND type IN ('activity', 'activity_analysis') 
         AND success_rating IS NOT NULL) as activity_average,
        COALESCE(v_mood_stability, 5.0) as mood_stability,
        COALESCE(v_energy_consistency, 5.0) as energy_consistency,
        COALESCE(v_stress_management, 5.0) as stress_management,
        COALESCE(v_xp_multiplier, 1.0) as xp_multiplier,
        COALESCE(v_total_achievements, 0) as total_achievements,
        COALESCE(v_productivity_achievements, 0) as productivity_achievements;
END;
$$ LANGUAGE plpgsql;

-- Функция для расчета недельного рейтинга
CREATE OR REPLACE FUNCTION calculate_weekly_rating(p_user_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    v_avg_score NUMERIC;
BEGIN
    SELECT COALESCE(AVG(final_score), 0) INTO v_avg_score
    FROM productivity_scores
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Если нет данных в productivity_scores, рассчитываем на лету
    IF v_avg_score = 0 THEN
        SELECT COALESCE(AVG(calculate_productivity_score(p_user_id, day_date)), 0) INTO v_avg_score
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) as day_date;
    END IF;
    
    RETURN COALESCE(v_avg_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Функция для расчета месячного рейтинга
CREATE OR REPLACE FUNCTION calculate_monthly_rating(p_user_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    v_avg_score NUMERIC;
BEGIN
    SELECT COALESCE(AVG(final_score), 0) INTO v_avg_score
    FROM productivity_scores
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Если нет данных в productivity_scores, рассчитываем на лету
    IF v_avg_score = 0 THEN
        SELECT COALESCE(AVG(calculate_productivity_score(p_user_id, day_date)), 0) INTO v_avg_score
        FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval) as day_date;
    END IF;
    
    RETURN COALESCE(v_avg_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Проверка создания функций
SELECT 
    'Функции созданы/обновлены:' as status,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as signature
FROM pg_proc 
WHERE proname IN (
    'calculate_simple_productivity_rating',
    'count_total_records',
    'get_user_productivity_stats',
    'calculate_weekly_rating',
    'calculate_monthly_rating'
)
ORDER BY proname;
