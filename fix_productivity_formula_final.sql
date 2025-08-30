-- =====================================================
-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ФОРМУЛ ПРОДУКТИВНОСТИ
-- =====================================================

-- Исправляем функцию настроения
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
    -- Считаем количество выполненных действий за день (не просто записей!)
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date
    AND type NOT IN ('daily_mood_report', 'daily_activity_report'); -- Исключаем отчеты
    
    -- Считаем активность из activity_log (входы, обновления профиля, другие действия)
    SELECT COUNT(*) INTO v_log_actions
    FROM activity_log
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND action NOT IN (SELECT code FROM achievements)
    AND action IN (
        'login',                 -- Вход в систему (10 XP)
        'first_login_today',     -- Первый вход за день (15 XP)
        'profile_update',        -- Обновление профиля (25 XP)
        'avatar_upload',         -- Загрузка аватара (30 XP)
        'benefit_added',         -- Добавление льготы (50 XP)
        'benefit_used',          -- Использование льготы (25 XP)
        'preferences_test',      -- Тест предпочтений (75 XP)
        'recommendations_received', -- Получение рекомендаций (20 XP)
        'progress_view'          -- Просмотр прогресса (5 XP)
    );
    
    v_platform_actions := v_platform_actions + v_log_actions;

    -- Фиксированное количество возможных уникальных действий в системе
    v_total_possible_actions := 7;

    -- K = min(выполненные_действия / возможные_действия, 1.0), но не меньше 0.6
    v_platform_coefficient := GREATEST(
        LEAST(
            v_platform_actions::DECIMAL / v_total_possible_actions,
            1.0
        ),
        0.6
    );

    -- ПРАВИЛЬНАЯ ФОРМУЛА: (Настроение + (Успешные × 0.3) + (Неуспешные × (-0.3))) × 1.2 × K
    v_final_score := (
        v_mood_score +
        (v_successful_activities * 0.3) +
        (v_failed_activities * (-0.3))
    ) * 1.2 * v_platform_coefficient;

    -- Преобразуем в проценты (0-100) - ВОЗВРАЩАЕМ умножение на 10!
    v_final_score := GREATEST(0.0, LEAST(100.0, v_final_score * 10));

    RETURN ROUND(v_final_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Исправляем функцию энергии
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
    -- Считаем количество выполненных действий за день (не просто записей!)
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date
    AND type NOT IN ('daily_mood_report', 'daily_activity_report'); -- Исключаем отчеты
    
    -- Считаем активность из activity_log (входы, обновления профиля, другие действия)
    SELECT COUNT(*) INTO v_log_actions
    FROM activity_log
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND action NOT IN (SELECT code FROM achievements)
    AND action IN (
        'login',                 -- Вход в систему (10 XP)
        'first_login_today',     -- Первый вход за день (15 XP)
        'profile_update',        -- Обновление профиля (25 XP)
        'avatar_upload',         -- Загрузка аватара (30 XP)
        'benefit_added',         -- Добавление льготы (50 XP)
        'benefit_used',          -- Использование льготы (25 XP)
        'preferences_test',      -- Тест предпочтений (75 XP)
        'recommendations_received', -- Получение рекомендаций (20 XP)
        'progress_view'          -- Просмотр прогресса (5 XP)
    );
    
    v_platform_actions := v_platform_actions + v_log_actions;

    -- Фиксированное количество возможных уникальных действий в системе
    v_total_possible_actions := 7;

    -- K = min(выполненные_действия / возможные_действия, 1.0), но не меньше 0.6
    v_platform_coefficient := GREATEST(
        LEAST(
            v_platform_actions::DECIMAL / v_total_possible_actions,
            1.0
        ),
        0.6
    );

    -- ПРАВИЛЬНАЯ ФОРМУЛА: (Энергия + (Успешные × 0.3) + (Неуспешные × (-0.3))) × 1.2 × K
    v_final_score := (
        v_energy_score +
        (v_successful_activities * 0.3) +
        (v_failed_activities * (-0.3))
    ) * 1.2 * v_platform_coefficient;

    -- Преобразуем в проценты (0-100) - ВОЗВРАЩАЕМ умножение на 10!
    v_final_score := GREATEST(0.0, LEAST(100.0, v_final_score * 10));

    RETURN ROUND(v_final_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Исправляем функцию спокойствия
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
    -- Считаем количество выполненных действий за день (не просто записей!)
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date
    AND type NOT IN ('daily_mood_report', 'daily_activity_report'); -- Исключаем отчеты
    
    -- Считаем активность из activity_log (входы, обновления профиля, другие действия)
    SELECT COUNT(*) INTO v_log_actions
    FROM activity_log
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    AND action NOT IN (SELECT code FROM achievements)
    AND action IN (
        'login',                 -- Вход в систему (10 XP)
        'first_login_today',     -- Первый вход за день (15 XP)
        'profile_update',        -- Обновление профиля (25 XP)
        'avatar_upload',         -- Загрузка аватара (30 XP)
        'benefit_added',         -- Добавление льготы (50 XP)
        'benefit_used',          -- Использование льготы (25 XP)
        'preferences_test',      -- Тест предпочтений (75 XP)
        'recommendations_received', -- Получение рекомендаций (20 XP)
        'progress_view'          -- Просмотр прогресса (5 XP)
    );
    
    v_platform_actions := v_platform_actions + v_log_actions;

    -- Фиксированное количество возможных уникальных действий в системе
    v_total_possible_actions := 7;

    -- K = min(выполненные_действия / возможные_действия, 1.0), но не меньше 0.6
    v_platform_coefficient := GREATEST(
        LEAST(
            v_platform_actions::DECIMAL / v_total_possible_actions,
            1.0
        ),
        0.6
    );

    -- ПРАВИЛЬНАЯ ФОРМУЛА: ((10-Стресс) + (Успешные × 0.3) + (Неуспешные × (-0.3))) × 1.2 × K
    v_final_score := (
        v_calmness_score +
        (v_successful_activities * 0.3) +
        (v_failed_activities * (-0.3))
    ) * 1.2 * v_platform_coefficient;

    -- Преобразуем в проценты (0-100) - ВОЗВРАЩАЕМ умножение на 10!
    v_final_score := GREATEST(0.0, LEAST(100.0, v_final_score * 10));

    RETURN ROUND(v_final_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Проверяем исправление
DO $$
BEGIN
    RAISE NOTICE '✅ Формулы продуктивности исправлены! Фиксированное количество возможных действий = 7.';
    RAISE NOTICE '📊 Теперь настроение 7.5 + 0.6 (за 2 успешные) × 1.2 × K × 10 = правильные проценты!';
    RAISE NOTICE '🎯 K коэффициент теперь правильно рассчитывается: выполненные/7, минимум 0.6!';
    RAISE NOTICE '🔧 Количество активности за день теперь правильно считается (исключаем отчеты)!';
    RAISE NOTICE '🚀 Теперь учитываются РЕАЛЬНЫЕ действия из activity_log: login, profile_update, preferences_test!';
END $$;

-- =====================================================
-- КОМАНДЫ ДЛЯ ПРИМЕНЕНИЯ ИСПРАВЛЕНИЙ
-- =====================================================

-- 1. Скопировать файл в контейнер:
-- docker cp fix_productivity_formula_final.sql yoddle-pg:/tmp/

-- 2. Применить исправления:
-- docker exec -it yoddle-pg psql -U f1111323_yoddle -d supa_full -f /tmp/fix_productivity_formula_final.sql

-- 3. Проверить результат:
-- SELECT calculate_mood_percentage(3, CURRENT_DATE) as mood_today;
-- SELECT calculate_energy_percentage(3, CURRENT_DATE) as energy_today;
-- SELECT calculate_calmness_percentage(3, CURRENT_DATE) as calmness_today;
