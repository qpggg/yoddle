-- =====================================================
-- ПОЛНАЯ ИНТЕГРАЦИЯ ПРОДУКТИВНОСТИ С БД (ИСПРАВЛЕННАЯ ВЕРСИЯ)
-- =====================================================
-- Этот скрипт создает все необходимые функции для расчета процентов
-- настроения, энергии и спокойствия на основе ВСЕЙ активности пользователя
-- Использует существующие activity_types и правильную логику подсчета
-- Коэффициент K теперь учитывает ОБЕ таблицы: ai_signals + activity_log

-- =====================================================
-- 1. ПРОВЕРКА СУЩЕСТВУЮЩИХ ACTIVITY_TYPES
-- =====================================================

-- activity_types уже добавлены ранее - пропускаем
-- daily_mood_report и daily_activity_report уже существуют в БД

-- =====================================================
-- 2. ФУНКЦИИ ДЛЯ РАСЧЕТА ПРОЦЕНТОВ ПОКАЗАТЕЛЕЙ
-- =====================================================

-- Функция для расчета процента настроения
CREATE OR REPLACE FUNCTION calculate_mood_percentage(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    v_mood_score DECIMAL(5,2) := 0;
    v_successful_activities INTEGER := 0;
    v_failed_activities INTEGER := 0;
    v_platform_coefficient DECIMAL(3,2) := 0.6;
    v_final_score DECIMAL(5,2) := 0;
    v_mood_entries INTEGER := 0;
    v_platform_actions INTEGER := 0;
    v_total_possible_actions INTEGER := 0;
    v_log_actions INTEGER := 0;
BEGIN
    -- Расчет компонента настроения (только настроение)
    SELECT
        COALESCE(AVG(mood_rating), 0),
        COUNT(*)
    INTO v_mood_score, v_mood_entries
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check', 'daily_mood_report')
    AND DATE(timestamp) = p_date;

    -- Расчет количества успешных и неуспешных активностей (ИСКЛЮЧАЕМ достижения и отчеты)
    SELECT
        COUNT(*) FILTER (WHERE success_rating >= 7),
        COUNT(*) FILTER (WHERE success_rating < 7)
    INTO v_successful_activities, v_failed_activities
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date
    AND type IN ('activity', 'activity_analysis', 'activity_log')
    AND type NOT IN ('daily_mood_report', 'daily_activity_report');

    -- Расчет коэффициента активности на платформе (ОБЕ таблицы)
    -- Получаем действия из ai_signals
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date;
    
    -- Добавляем действия из activity_log (исключая достижения)
    SELECT COUNT(*) INTO v_log_actions
    FROM activity_log
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND action NOT IN (SELECT code FROM achievements);
    
    -- Общее количество действий = ai_signals + activity_log (без достижений)
    v_platform_actions := v_platform_actions + v_log_actions;

    -- Считаем ВСЕ возможные уникальные действия за день как all_tasks
    SELECT COUNT(DISTINCT action) INTO v_total_possible_actions
    FROM (
        SELECT type as action FROM ai_signals 
        WHERE user_id = p_user_id AND DATE(timestamp) = p_date
        UNION
        SELECT action FROM activity_log 
        WHERE user_id = p_user_id AND DATE(created_at) = p_date
        AND action NOT IN (SELECT code FROM achievements)
    ) all_actions;

    -- K = min(выполненные_действия / возможные_действия, 1.0)
    v_platform_coefficient := LEAST(
        CASE
            WHEN v_total_possible_actions > 0 THEN
                v_platform_actions::DECIMAL / v_total_possible_actions
            ELSE 0.6
        END,
        1.0
    );

    -- ФОРМУЛА для настроения: (Настроение + (Успешные × 3) + (Неуспешные × (-3))) × 1.2 × K
    v_final_score := (
        v_mood_score +
        (v_successful_activities * 3) +
        (v_failed_activities * (-3))
    ) * 1.2 * v_platform_coefficient;

    -- Преобразуем в проценты (0-100)
    v_final_score := GREATEST(0.0, LEAST(100.0, v_final_score * 10));

    RETURN ROUND(v_final_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Функция для расчета процента энергии
CREATE OR REPLACE FUNCTION calculate_energy_percentage(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    v_energy_score DECIMAL(5,2) := 0;
    v_successful_activities INTEGER := 0;
    v_failed_activities INTEGER := 0;
    v_platform_coefficient DECIMAL(3,2) := 0.6;
    v_final_score DECIMAL(5,2) := 0;
    v_energy_entries INTEGER := 0;
    v_platform_actions INTEGER := 0;
    v_total_possible_actions INTEGER := 0;
    v_log_actions INTEGER := 0;
BEGIN
    -- Расчет компонента энергии (только энергия)
    SELECT
        COALESCE(AVG(energy_rating), 0),
        COUNT(*)
    INTO v_energy_score, v_energy_entries
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check', 'daily_mood_report')
    AND DATE(timestamp) = p_date;

    -- Расчет количества успешных и неуспешных активностей (ИСКЛЮЧАЕМ достижения и отчеты)
    SELECT
        COUNT(*) FILTER (WHERE success_rating >= 7),
        COUNT(*) FILTER (WHERE success_rating < 7)
    INTO v_successful_activities, v_failed_activities
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date
    AND type IN ('activity', 'activity_analysis', 'activity_log')
    AND type NOT IN ('daily_mood_report', 'daily_activity_report');

    -- Расчет коэффициента активности на платформе (ОБЕ таблицы)
    -- Получаем действия из ai_signals
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date;
    
    -- Добавляем действия из activity_log (исключая достижения)
    SELECT COUNT(*) INTO v_log_actions
    FROM activity_log
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND action NOT IN (SELECT code FROM achievements);
    
    -- Общее количество действий = ai_signals + activity_log (без достижений)
    v_platform_actions := v_platform_actions + v_log_actions;

    -- Считаем ВСЕ возможные уникальные действия за день как all_tasks
    SELECT COUNT(DISTINCT action) INTO v_total_possible_actions
    FROM (
        SELECT type as action FROM ai_signals 
        WHERE user_id = p_user_id AND DATE(timestamp) = p_date
        UNION
        SELECT action FROM activity_log 
        WHERE user_id = p_user_id AND DATE(created_at) = p_date
        AND action NOT IN (SELECT code FROM achievements)
    ) all_actions;

    -- K = min(выполненные_действия / возможные_действия, 1.0)
    v_platform_coefficient := LEAST(
        CASE
            WHEN v_total_possible_actions > 0 THEN
                v_platform_actions::DECIMAL / v_total_possible_actions
            ELSE 0.6
        END,
        1.0
    );

    -- ФОРМУЛА для энергии: (Энергия + (Успешные × 3) + (Неуспешные × (-3))) × 1.2 × K
    v_final_score := (
        v_energy_score +
        (v_successful_activities * 3) +
        (v_failed_activities * (-3))
    ) * 1.2 * v_platform_coefficient;

    -- Преобразуем в проценты (0-100)
    v_final_score := GREATEST(0.0, LEAST(100.0, v_final_score * 10));

    RETURN ROUND(v_final_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Функция для расчета процента спокойствия (антистресс)
CREATE OR REPLACE FUNCTION calculate_calmness_percentage(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    v_calmness_score DECIMAL(5,2) := 0;
    v_successful_activities INTEGER := 0;
    v_failed_activities INTEGER := 0;
    v_platform_coefficient DECIMAL(3,2) := 0.6;
    v_final_score DECIMAL(5,2) := 0;
    v_calmness_entries INTEGER := 0;
    v_platform_actions INTEGER := 0;
    v_total_possible_actions INTEGER := 0;
    v_log_actions INTEGER := 0;
BEGIN
    -- Расчет компонента спокойствия (10 - стресс, так как стресс обратно пропорционален спокойствию)
    SELECT
        COALESCE(AVG(10 - stress_rating), 0),
        COUNT(*)
    INTO v_calmness_score, v_calmness_entries
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check', 'daily_mood_report')
    AND DATE(timestamp) = p_date;

    -- Расчет количества успешных и неуспешных активностей (ИСКЛЮЧАЕМ достижения и отчеты)
    SELECT
        COUNT(*) FILTER (WHERE success_rating >= 7),
        COUNT(*) FILTER (WHERE success_rating < 7)
    INTO v_successful_activities, v_failed_activities
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date
    AND type IN ('activity', 'activity_analysis', 'activity_log')
    AND type NOT IN ('daily_mood_report', 'daily_activity_report');

    -- Расчет коэффициента активности на платформе (ОБЕ таблицы)
    -- Получаем действия из ai_signals
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date;
    
    -- Добавляем действия из activity_log (исключая достижения)
    SELECT COUNT(*) INTO v_log_actions
    FROM activity_log
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND action NOT IN (SELECT code FROM achievements);
    
    -- Общее количество действий = ai_signals + activity_log (без достижений)
    v_platform_actions := v_platform_actions + v_log_actions;

    -- Считаем ВСЕ возможные уникальные действия за день как all_tasks
    SELECT COUNT(DISTINCT action) INTO v_total_possible_actions
    FROM (
        SELECT type as action FROM ai_signals 
        WHERE user_id = p_user_id AND DATE(timestamp) = p_date
        UNION
        SELECT action FROM activity_log 
        WHERE user_id = p_user_id AND DATE(created_at) = p_date
        AND action NOT IN (SELECT code FROM achievements)
    ) all_actions;

    -- K = min(выполненные_действия / возможные_действия, 1.0)
    v_platform_coefficient := LEAST(
        CASE
            WHEN v_total_possible_actions > 0 THEN
                v_platform_actions::DECIMAL / v_total_possible_actions
            ELSE 0.6
        END,
        1.0
    );

    -- ФОРМУЛА для спокойствия: ((10-Стресс) + (Успешные × 3) + (Неуспешные × (-3))) × 1.2 × K
    v_final_score := (
        v_calmness_score +
        (v_successful_activities * 3) +
        (v_failed_activities * (-3))
    ) * 1.2 * v_platform_coefficient;

    -- Преобразуем в проценты (0-100)
    v_final_score := GREATEST(0.0, LEAST(100.0, v_final_score * 10));

    RETURN ROUND(v_final_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ НЕДЕЛЬНЫХ ДАННЫХ
-- =====================================================

-- Функция для получения недельных процентов всех показателей
CREATE OR REPLACE FUNCTION get_weekly_mood_percentages(p_user_id INTEGER)
RETURNS TABLE (
    date DATE,
    mood_percentage INTEGER,
    energy_percentage INTEGER,
    calmness_percentage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.date,
        COALESCE(calculate_mood_percentage(p_user_id, d.date), 0) as mood_percentage,
        COALESCE(calculate_energy_percentage(p_user_id, d.date), 0) as energy_percentage,
        COALESCE(calculate_calmness_percentage(p_user_id, d.date), 0) as calmness_percentage
    FROM (
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
        )::date as date
    ) d
    ORDER BY d.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения средних недельных процентов
CREATE OR REPLACE FUNCTION get_weekly_average_percentages(p_user_id INTEGER)
RETURNS TABLE (
    mood_average INTEGER,
    energy_average INTEGER,
    calmness_average INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(COALESCE(calculate_mood_percentage(p_user_id, d.date), 0)))::INTEGER as mood_average,
        ROUND(AVG(COALESCE(calculate_energy_percentage(p_user_id, d.date), 0)))::INTEGER as energy_average,
        ROUND(AVG(COALESCE(calculate_calmness_percentage(p_user_id, d.date), 0)))::INTEGER as calmness_average
    FROM (
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
        )::date as date
    ) d;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ СТАТИСТИКИ ПРОДУКТИВНОСТИ
-- =====================================================

-- Функция для получения статистики продуктивности пользователя
CREATE OR REPLACE FUNCTION get_user_productivity_stats(p_user_id INTEGER)
RETURNS TABLE (
    current_score DECIMAL(5,2),
    current_level TEXT,
    current_tier TEXT,
    xp_multiplier DECIMAL(3,2),
    weekly_average DECIMAL(5,2),
    monthly_average DECIMAL(5,2),
    mood_stability DECIMAL(3,2),
    energy_consistency DECIMAL(3,2),
    stress_management DECIMAL(3,2),
    total_achievements INTEGER,
    productivity_achievements INTEGER
) AS $$
DECLARE
    v_current_score DECIMAL(5,2) := 0;
    v_weekly_avg DECIMAL(5,2) := 0;
    v_monthly_avg DECIMAL(5,2) := 0;
    v_mood_stability DECIMAL(3,2) := 0;
    v_energy_consistency DECIMAL(3,2) := 0;
    v_stress_management DECIMAL(3,2) := 0;
    v_achievements_count INTEGER := 0;
    v_productivity_achievements INTEGER := 0;
BEGIN
    -- Получаем текущий балл продуктивности
    SELECT COALESCE(productivity_score, 0) INTO v_current_score
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Получаем недельное среднее
    SELECT COALESCE(weekly_productivity, 0) INTO v_weekly_avg
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Получаем месячное среднее
    SELECT COALESCE(monthly_productivity, 0) INTO v_monthly_avg
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Получаем стабильность настроения
    SELECT COALESCE(mood_stability, 0) INTO v_mood_stability
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Получаем консистентность энергии
    SELECT COALESCE(energy_consistency, 0) INTO v_energy_consistency
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Получаем управление стрессом
    SELECT COALESCE(stress_management, 0) INTO v_stress_management
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Получаем количество достижений
    SELECT COUNT(*) INTO v_achievements_count
    FROM user_achievements 
    WHERE user_id = p_user_id;

    -- Получаем количество достижений продуктивности
    SELECT COUNT(*) INTO v_productivity_achievements
    FROM user_achievements ua
    JOIN productivity_achievements pa ON ua.achievement_id = pa.code
    WHERE ua.user_id = p_user_id;

    -- Определяем уровень и тир
    RETURN QUERY
    SELECT 
        v_current_score,
        CASE 
            WHEN v_current_score >= 9.0 THEN 'Мастер'
            WHEN v_current_score >= 8.0 THEN 'Эксперт'
            WHEN v_current_score >= 7.0 THEN 'Специалист'
            WHEN v_current_score >= 6.0 THEN 'Стажер'
            ELSE 'Новичок'
        END::TEXT as current_level,
        CASE 
            WHEN v_current_score >= 9.0 THEN 'platinum'
            WHEN v_current_score >= 8.0 THEN 'gold'
            WHEN v_current_score >= 7.0 THEN 'silver'
            ELSE 'bronze'
        END::TEXT as current_tier,
        CASE 
            WHEN v_current_score >= 9.0 THEN 1.5
            WHEN v_current_score >= 8.0 THEN 1.3
            WHEN v_current_score >= 7.0 THEN 1.1
            ELSE 1.0
        END::DECIMAL(3,2) as xp_multiplier,
        v_weekly_avg,
        v_monthly_avg,
        v_mood_stability,
        v_energy_consistency,
        v_stress_management,
        v_achievements_count,
        v_productivity_achievements;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ФУНКЦИИ ДЛЯ АНАЛИЗА АКТИВНОСТИ ИЗ ОБЕИХ ТАБЛИЦ
-- =====================================================

-- Функция для получения детальной статистики активности пользователя за день
CREATE OR REPLACE FUNCTION get_user_daily_activity_summary(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_activities INTEGER,
    successful_activities INTEGER,
    failed_activities INTEGER,
    mood_entries INTEGER,
    energy_entries INTEGER,
    stress_entries INTEGER,
    total_platform_actions INTEGER,
    activity_types TEXT[],
    unique_activity_count INTEGER,
    reports_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Активности из ai_signals (исключая отчеты)
        COUNT(*) FILTER (WHERE type IN ('activity', 'activity_analysis', 'activity_log')) as total_activities,
        COUNT(*) FILTER (WHERE success_rating >= 7 AND type IN ('activity', 'activity_analysis', 'activity_log')) as successful_activities,
        COUNT(*) FILTER (WHERE success_rating < 7 AND type IN ('activity', 'activity_analysis', 'activity_log')) as failed_activities,
        -- Записи настроения
        COUNT(*) FILTER (WHERE type IN ('mood', 'daily_mood_check', 'daily_mood_report')) as mood_entries,
        COUNT(*) FILTER (WHERE type IN ('mood', 'daily_mood_check', 'daily_mood_report')) as energy_entries,
        COUNT(*) FILTER (WHERE type IN ('mood', 'daily_mood_check', 'daily_mood_report')) as stress_entries,
        -- Все действия на платформе
        COUNT(*) as total_platform_actions,
        -- Типы активностей
        ARRAY_AGG(DISTINCT type) as activity_types,
        -- Уникальные активности (исключая достижения и отчеты)
        (SELECT COUNT(DISTINCT action) 
         FROM activity_log 
         WHERE user_id = p_user_id 
         AND DATE(created_at) = p_date
         AND action NOT IN (SELECT code FROM achievements)
         AND action NOT IN ('daily_mood_report', 'daily_activity_report')) as unique_activity_count,
        -- Количество отчетов
        COUNT(*) FILTER (WHERE type IN ('daily_mood_report', 'daily_activity_report')) as reports_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения уникальных активностей за день (без достижений и отчетов)
CREATE OR REPLACE FUNCTION get_unique_daily_activities(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    unique_actions TEXT[],
    total_unique_count INTEGER,
    achievements_excluded INTEGER,
    reports_excluded INTEGER
) AS $$
DECLARE
    v_achievements_count INTEGER := 0;
    v_reports_count INTEGER := 0;
BEGIN
    -- Получаем количество достижений за день
    SELECT COUNT(*) INTO v_achievements_count
    FROM activity_log al
    JOIN achievements a ON al.action = a.code
    WHERE al.user_id = p_user_id
    AND DATE(al.created_at) = p_date;

    -- Получаем количество отчетов за день
    SELECT COUNT(*) INTO v_reports_count
    FROM activity_log
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND action IN ('daily_mood_report', 'daily_activity_report');

    RETURN QUERY
    SELECT 
        ARRAY_AGG(DISTINCT action) as unique_actions,
        COUNT(DISTINCT action) as total_unique_count,
        v_achievements_count as achievements_excluded,
        v_reports_count as reports_excluded
    FROM activity_log
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND action NOT IN (SELECT code FROM achievements)
    AND action NOT IN ('daily_mood_report', 'daily_activity_report');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ПРОВЕРКА И СООБЩЕНИЯ ОБ УСПЕШНОМ СОЗДАНИИ
-- =====================================================

-- Проверяем создание функций
DO $$
BEGIN
    RAISE NOTICE '✅ Функции для расчета процентов настроения созданы успешно!';
    RAISE NOTICE '✅ Функция get_user_productivity_stats создана успешно!';
    RAISE NOTICE '✅ Функция get_user_daily_activity_summary создана успешно!';
    RAISE NOTICE '✅ Функция get_unique_daily_activities создана успешно!';
    RAISE NOTICE '✅ Интеграция продуктивности с БД завершена!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Доступные функции:';
    RAISE NOTICE '   - calculate_mood_percentage(user_id, date)';
    RAISE NOTICE '   - calculate_energy_percentage(user_id, date)';
    RAISE NOTICE '   - calculate_calmness_percentage(user_id, date)';
    RAISE NOTICE '   - get_weekly_mood_percentages(user_id)';
    RAISE NOTICE '   - get_weekly_average_percentages(user_id)';
    RAISE NOTICE '   - get_user_productivity_stats(user_id)';
    RAISE NOTICE '   - get_user_daily_activity_summary(user_id, date)';
    RAISE NOTICE '   - get_unique_daily_activities(user_id, date)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Теперь функции работают с обеими таблицами!';
    RAISE NOTICE '📈 ai_signals: рейтинги и общее количество действий';
    RAISE NOTICE '📈 activity_log: уникальные активности (без достижений и отчетов)';
    RAISE NOTICE '📊 Отчеты: daily_mood_report (25 XP) + daily_activity_report (30 XP)';
    RAISE NOTICE '🎯 Достижения исключены из подсчета уникальности активностей';
    RAISE NOTICE '🔧 Коэффициент K теперь учитывает ОБЕ таблицы!';
END $$;
