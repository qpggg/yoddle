-- =====================================================
-- ФУНКЦИИ ДЛЯ РАСЧЕТА ПРОЦЕНТОВ ПОКАЗАТЕЛЕЙ
-- =====================================================
-- Создаем функции для расчета процентов настроения, энергии и спокойствия
-- на основе той же формулы продуктивности

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
    v_activity_entries INTEGER := 0;
    v_platform_actions INTEGER := 0;
    v_total_possible_actions INTEGER := 10;
BEGIN
    -- Расчет компонента настроения (только настроение)
    SELECT
        COALESCE(SUM(mood_rating), 0),
        COUNT(*)
    INTO v_mood_score, v_mood_entries
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND DATE(timestamp) = p_date;

    -- Расчет количества успешных и неуспешных активностей
    SELECT
        COUNT(*) FILTER (WHERE success_rating >= 7),
        COUNT(*) FILTER (WHERE success_rating < 7)
    INTO v_successful_activities, v_failed_activities
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('activity', 'activity_analysis')
    AND DATE(timestamp) = p_date;

    -- Расчет коэффициента активности на платформе
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date;

    -- K = min(выполненные_действия / возможные_действия, 1.0)
    v_platform_coefficient := LEAST(
        CASE
            WHEN v_total_possible_actions > 0 THEN
                v_platform_actions::DECIMAL / v_total_possible_actions
            ELSE 0.6
        END,
        1.0
    );

    -- ФОРМУЛА для настроения: (Настроение + (Успешные × 0.5) + (Неуспешные × (-0.5))) × 1.2 × K
    v_final_score := (
        v_mood_score +
        (v_successful_activities * 0.5) +
        (v_failed_activities * (-0.5))
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
    v_activity_entries INTEGER := 0;
    v_platform_actions INTEGER := 0;
    v_total_possible_actions INTEGER := 10;
BEGIN
    -- Расчет компонента энергии (только энергия)
    SELECT
        COALESCE(SUM(energy_rating), 0),
        COUNT(*)
    INTO v_energy_score, v_energy_entries
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND DATE(timestamp) = p_date;

    -- Расчет количества успешных и неуспешных активностей
    SELECT
        COUNT(*) FILTER (WHERE success_rating >= 7),
        COUNT(*) FILTER (WHERE success_rating < 7)
    INTO v_successful_activities, v_failed_activities
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('activity', 'activity_analysis')
    AND DATE(timestamp) = p_date;

    -- Расчет коэффициента активности на платформе
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date;

    -- K = min(выполненные_действия / возможные_действия, 1.0)
    v_platform_coefficient := LEAST(
        CASE
            WHEN v_total_possible_actions > 0 THEN
                v_platform_actions::DECIMAL / v_total_possible_actions
            ELSE 0.6
        END,
        1.0
    );

    -- ФОРМУЛА для энергии: (Энергия + (Успешные × 0.5) + (Неуспешные × (-0.5))) × 1.2 × K
    v_final_score := (
        v_energy_score +
        (v_successful_activities * 0.5) +
        (v_failed_activities * (-0.5))
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
    v_activity_entries INTEGER := 0;
    v_platform_actions INTEGER := 0;
    v_total_possible_actions INTEGER := 10;
BEGIN
    -- Расчет компонента спокойствия (10 - стресс, так как стресс обратно пропорционален спокойствию)
    SELECT
        COALESCE(SUM(10 - stress_rating), 0),
        COUNT(*)
    INTO v_calmness_score, v_calmness_entries
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND DATE(timestamp) = p_date;

    -- Расчет количества успешных и неуспешных активностей
    SELECT
        COUNT(*) FILTER (WHERE success_rating >= 7),
        COUNT(*) FILTER (WHERE success_rating < 7)
    INTO v_successful_activities, v_failed_activities
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('activity', 'activity_analysis')
    AND DATE(timestamp) = p_date;

    -- Расчет коэффициента активности на платформе
    SELECT COUNT(*) INTO v_platform_actions
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date;

    -- K = min(выполненные_действия / возможные_действия, 1.0)
    v_platform_coefficient := LEAST(
        CASE
            WHEN v_total_possible_actions > 0 THEN
                v_platform_actions::DECIMAL / v_total_possible_actions
            ELSE 0.6
        END,
        1.0
    );

    -- ФОРМУЛА для спокойствия: ((10-Стресс) + (Успешные × 0.5) + (Неуспешные × (-0.5))) × 1.2 × K
    v_final_score := (
        v_calmness_score +
        (v_successful_activities * 0.5) +
        (v_failed_activities * (-0.5))
    ) * 1.2 * v_platform_coefficient;

    -- Преобразуем в проценты (0-100)
    v_final_score := GREATEST(0.0, LEAST(100.0, v_final_score * 10));

    RETURN ROUND(v_final_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

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





