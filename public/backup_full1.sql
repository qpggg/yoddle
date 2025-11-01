--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: new; Type: SCHEMA; Schema: -; Owner: f1111323_yoddle
--

CREATE SCHEMA new;


ALTER SCHEMA new OWNER TO f1111323_yoddle;

--
-- Name: add_coins(integer, numeric, text, character varying, integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.add_coins(p_user_id integer, p_amount numeric, p_description text DEFAULT 'Пополнение баланса'::text, p_type character varying DEFAULT 'credit'::character varying, p_processed_by integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_balance DECIMAL(10,2);
BEGIN
    -- Получаем текущий баланс
    SELECT COALESCE(balance, 0) INTO current_balance 
    FROM user_balance 
    WHERE user_id = p_user_id;
    
    -- Создаем транзакцию
    INSERT INTO coin_transactions (
        user_id, transaction_type, amount, balance_before, balance_after, 
        description, processed_by
    ) VALUES (
        p_user_id, p_type, p_amount, current_balance, current_balance + p_amount,
        p_description, p_processed_by
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;


ALTER FUNCTION public.add_coins(p_user_id integer, p_amount numeric, p_description text, p_type character varying, p_processed_by integer) OWNER TO f1111323_yoddle;

--
-- Name: calculate_calmness_percentage(integer, date); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.calculate_calmness_percentage(p_user_id integer, p_date date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.calculate_calmness_percentage(p_user_id integer, p_date date) OWNER TO f1111323_yoddle;

--
-- Name: calculate_energy_percentage(integer, date); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.calculate_energy_percentage(p_user_id integer, p_date date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.calculate_energy_percentage(p_user_id integer, p_date date) OWNER TO f1111323_yoddle;

--
-- Name: calculate_mood_percentage(integer, date); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.calculate_mood_percentage(p_user_id integer, p_date date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.calculate_mood_percentage(p_user_id integer, p_date date) OWNER TO f1111323_yoddle;

--
-- Name: calculate_period_productivity(integer, integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.calculate_period_productivity(p_user_id integer, p_days integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_avg_rating DECIMAL(5,2) := 0;
    v_date DATE;
    v_total_rating DECIMAL(5,2) := 0;
    v_days_with_data INTEGER := 0;
BEGIN
    -- Простой расчет по дням
    FOR v_date IN 
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '1 day' * p_days,
            CURRENT_DATE,
            INTERVAL '1 day'
        )::DATE
    LOOP
        DECLARE
            v_day_rating DECIMAL(5,2);
        BEGIN
            v_day_rating := calculate_simple_productivity_rating(p_user_id, v_date);
            IF v_day_rating > 0 THEN
                v_total_rating := v_total_rating + v_day_rating;
                v_days_with_data := v_days_with_data + 1;
            END IF;
        END;
    END LOOP;
    
    IF v_days_with_data > 0 THEN
        v_avg_rating := v_total_rating / v_days_with_data;
    END IF;
    
    RETURN COALESCE(v_avg_rating, 0);
END;
$$;


ALTER FUNCTION public.calculate_period_productivity(p_user_id integer, p_days integer) OWNER TO f1111323_yoddle;

--
-- Name: calculate_productivity_score(integer, date); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.calculate_productivity_score(p_user_id integer, p_date date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_mood_score DECIMAL(5,2) := 0;
    v_successful_activities INTEGER := 0;
    v_failed_activities INTEGER := 0;
    v_platform_coefficient DECIMAL(3,2) := 0.6;
    v_final_score DECIMAL(5,2) := 0;
    v_mood_entries INTEGER := 0;
    v_activity_entries INTEGER := 0;
    v_platform_actions INTEGER := 0;
    v_total_possible_actions INTEGER := 10; -- Примерное количество возможных действий за день
BEGIN
    -- Расчет компонента настроения (сумма всех рейтингов за день)
    SELECT 
        COALESCE(SUM(mood_rating + energy_rating + (10 - stress_rating)), 0),
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
    -- Подсчитываем все действия пользователя на платформе за день
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
    
    -- ПРАВИЛЬНАЯ ФОРМУЛА согласно документации:
    -- Продуктивность = ((Сумма рейтингов базового отчета / 3) + 
    --                   (Количество успешных активностей × 0.5) + 
    --                   (Количество неуспешных активностей × (-0.5))) × 1.2 × K
    v_final_score := (
        (v_mood_score / 3.0) + 
        (v_successful_activities * 0.5) + 
        (v_failed_activities * (-0.5))
    ) * 1.2 * v_platform_coefficient;
    
    -- Ограничиваем рейтинг от 0 до 10
    v_final_score := GREATEST(0.0, LEAST(10.0, v_final_score));
    
    -- Сохраняем результат в таблицу productivity_scores
    INSERT INTO productivity_scores (
        user_id, date, daily_score, mood_component, activity_component,
        quality_multiplier, platform_activity_coefficient, final_score,
        mood_entries_count, activity_entries_count, quality_penalties
    ) VALUES (
        p_user_id, p_date, v_final_score, v_mood_score / 3.0, 
        (v_successful_activities * 0.5) + (v_failed_activities * (-0.5)),
        1.0, v_platform_coefficient, v_final_score,
        v_mood_entries, v_successful_activities + v_failed_activities, 0
    ) ON CONFLICT (user_id, date) DO UPDATE SET
        daily_score = EXCLUDED.daily_score,
        mood_component = EXCLUDED.mood_component,
        activity_component = EXCLUDED.activity_component,
        quality_multiplier = EXCLUDED.quality_multiplier,
        platform_activity_coefficient = EXCLUDED.platform_activity_coefficient,
        final_score = EXCLUDED.final_score,
        mood_entries_count = EXCLUDED.mood_entries_count,
        activity_entries_count = EXCLUDED.activity_entries_count,
        quality_penalties = EXCLUDED.quality_penalties,
        created_at = NOW();
    
    -- Обновляем user_progress
    UPDATE user_progress SET
        productivity_score = v_final_score,
        last_mood_check = NOW(),
        daily_entries_count = v_mood_entries + v_successful_activities + v_failed_activities,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN v_final_score;
END;
$$;


ALTER FUNCTION public.calculate_productivity_score(p_user_id integer, p_date date) OWNER TO f1111323_yoddle;

--
-- Name: FUNCTION calculate_productivity_score(p_user_id integer, p_date date); Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON FUNCTION public.calculate_productivity_score(p_user_id integer, p_date date) IS 'Основная функция расчета рейтинга продуктивности';


--
-- Name: calculate_simple_productivity_rating(integer, date); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.calculate_simple_productivity_rating(p_user_id integer, p_date date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_mood_score DECIMAL(5,2) := 0;
    v_activity_score DECIMAL(5,2) := 0;
    v_final_rating DECIMAL(5,2) := 0;
    v_mood_count INTEGER := 0;
    v_activity_count INTEGER := 0;
BEGIN
    -- Получаем среднее настроение за ВСЕ ВРЕМЯ (убираем ограничение по дате)
    SELECT 
        COALESCE(AVG(mood_rating), 0),
        COUNT(*)
    INTO v_mood_score, v_mood_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type = 'mood'
    AND mood_rating IS NOT NULL;

    -- Получаем среднюю активность за ВСЕ ВРЕМЯ (убираем ограничение по дате)
    SELECT 
        COALESCE(AVG(success_rating), 0),
        COUNT(*)
    INTO v_activity_score, v_activity_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type = 'activity'
    AND success_rating IS NOT NULL;

    -- ФОРМУЛА: (среднее всех настроений + среднее всех активностей) / 2
    IF v_mood_count > 0 OR v_activity_count > 0 THEN
        v_final_rating := (v_mood_score + v_activity_score) / 2;
    ELSE
        v_final_rating := 0;
    END IF;

    RETURN ROUND(v_final_rating, 2);
END;
$$;


ALTER FUNCTION public.calculate_simple_productivity_rating(p_user_id integer, p_date date) OWNER TO f1111323_yoddle;

--
-- Name: check_data_integrity(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.check_data_integrity() RETURNS TABLE(table_name text, issue_count bigint, issue_description text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Проверка пользователей без прогресса
    RETURN QUERY
    SELECT 'user_progress'::TEXT, COUNT(*)::BIGINT, 'Пользователи без записи в user_progress'::TEXT
    FROM enter e 
    LEFT JOIN user_progress up ON e.id = up.user_id 
    WHERE up.user_id IS NULL;
    
    -- Проверка активности без пользователей
    RETURN QUERY  
    SELECT 'activity_log'::TEXT, COUNT(*)::BIGINT, 'Записи активности с несуществующими пользователями'::TEXT
    FROM activity_log al
    LEFT JOIN enter e ON al.user_id = e.id
    WHERE e.id IS NULL;
    
    -- Проверка достижений без кода
    RETURN QUERY
    SELECT 'user_achievements'::TEXT, COUNT(*)::BIGINT, 'Достижения с несуществующими кодами'::TEXT  
    FROM user_achievements ua
    LEFT JOIN achievements a ON ua.achievement_id = a.code
    WHERE a.code IS NULL;
END $$;


ALTER FUNCTION public.check_data_integrity() OWNER TO f1111323_yoddle;

--
-- Name: check_productivity_achievements(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.check_productivity_achievements(p_user_id integer) RETURNS TABLE(achievement_code character varying, achievement_name character varying, xp_reward integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_achievement RECORD;
    v_requirement_met BOOLEAN := false;
    v_current_count INTEGER := 0;
    v_current_streak INTEGER := 0;
    v_current_score DECIMAL(5,2) := 0;
BEGIN
    -- Получаем текущий рейтинг продуктивности
    SELECT COALESCE(productivity_score, 0) INTO v_current_score
    FROM user_progress WHERE user_id = p_user_id;
    
    -- Проверяем каждое достижение
    FOR v_achievement IN 
        SELECT * FROM productivity_achievements WHERE is_active = true
    LOOP
        v_requirement_met := false;
        
        CASE v_achievement.requirement_type
            WHEN 'streak' THEN
                -- Проверка серии (например, 7 дней подряд)
                SELECT COUNT(*) INTO v_current_streak
                FROM productivity_scores ps
                WHERE ps.user_id = p_user_id
                AND ps.final_score >= 5.0  -- минимальный порог для засчитывания дня
                AND ps.date >= CURRENT_DATE - INTERVAL '7 days';
                
                v_requirement_met := (v_current_streak >= v_achievement.requirement_value);
                
            WHEN 'count' THEN
                -- Проверка количества (например, 10 заметок)
                SELECT COUNT(*) INTO v_current_count
                FROM ai_signals
                WHERE user_id = p_user_id
                AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '30 days'
                AND notes IS NOT NULL
                AND LENGTH(notes) >= 30;
                
                v_requirement_met := (v_current_count >= v_achievement.requirement_value);
                
            WHEN 'stability' THEN
                -- Проверка стабильности (например, настроение не меняется более чем на 2 балла)
                -- Упрощенная логика
                v_requirement_met := (v_current_score >= 6.0);
                
            WHEN 'improvement' THEN
                -- Проверка улучшения (например, снижение стресса)
                -- Упрощенная логика
                v_requirement_met := (v_current_score >= 7.0);
                
            ELSE
                v_requirement_met := false;
        END CASE;
        
        -- Если достижение выполнено и еще не получено
        IF v_requirement_met THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua 
                WHERE ua.user_id = p_user_id 
                AND ua.achievement_id = v_achievement.code
            ) THEN
                -- Добавляем достижение пользователю
                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                VALUES (p_user_id, v_achievement.code, NOW());
                
                -- Возвращаем информацию о достижении
                achievement_code := v_achievement.code;
                achievement_name := v_achievement.name;
                xp_reward := v_achievement.xp_reward;
                RETURN NEXT;
            END IF;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;


ALTER FUNCTION public.check_productivity_achievements(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: FUNCTION check_productivity_achievements(p_user_id integer); Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON FUNCTION public.check_productivity_achievements(p_user_id integer) IS 'Функция проверки и награждения достижений продуктивности';


--
-- Name: count_simple_achievements(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.count_simple_achievements(p_user_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_achievements_count INTEGER := 0;
BEGIN
    -- Подсчитываем простые достижения на основе данных
    SELECT COUNT(*) INTO v_achievements_count
    FROM (
        -- День с настроением выше 7
        SELECT 1 FROM ai_signals 
        WHERE user_id = p_user_id 
        AND type = 'mood' 
        AND mood_rating >= 7
        AND DATE(timestamp) = CURRENT_DATE
        
        UNION
        
        -- День с успешной активностью
        SELECT 1 FROM ai_signals 
        WHERE user_id = p_user_id 
        AND type = 'activity' 
        AND success_rating >= 8
        AND DATE(timestamp) = CURRENT_DATE
        
        UNION
        
        -- Неделя с данными
        SELECT 1 FROM (
            SELECT COUNT(DISTINCT DATE(timestamp)) as days
            FROM ai_signals
            WHERE user_id = p_user_id
            AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
        ) week_data
        WHERE week_data.days >= 5
    ) achievements;
    
    RETURN v_achievements_count;
END;
$$;


ALTER FUNCTION public.count_simple_achievements(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: count_total_records(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.count_total_records(p_user_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_total_count INTEGER := 0;
BEGIN
    SELECT COUNT(*)
    INTO v_total_count
    FROM ai_signals
    WHERE user_id = p_user_id;
    
    RETURN v_total_count;
END;
$$;


ALTER FUNCTION public.count_total_records(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: count_tracked_days(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.count_tracked_days(p_user_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_days_count INTEGER := 0;
BEGIN
    SELECT COUNT(DISTINCT DATE(timestamp))
    INTO v_days_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND timestamp >= NOW() - INTERVAL '30 days';
    
    RETURN v_days_count;
END;
$$;


ALTER FUNCTION public.count_tracked_days(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: count_unread_notifications(character varying); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.count_unread_notifications(p_user_id character varying DEFAULT NULL::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications n
    WHERE 
        (n.is_global = true OR n.user_id = p_user_id)
        AND n.is_read = false
        AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP);
    
    RETURN unread_count;
END;
$$;


ALTER FUNCTION public.count_unread_notifications(p_user_id character varying) OWNER TO f1111323_yoddle;

--
-- Name: create_notification(character varying, character varying, text, integer, boolean, integer, character varying); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.create_notification(p_type_name character varying, p_title character varying, p_message text, p_user_id integer DEFAULT NULL::integer, p_is_global boolean DEFAULT false, p_priority integer DEFAULT 1, p_link_url character varying DEFAULT NULL::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    type_id_val INTEGER;
    notification_id INTEGER;
    user_exists BOOLEAN;
BEGIN
    -- Проверяем существование пользователя
    IF p_user_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM enter WHERE id = p_user_id) INTO user_exists;
        IF NOT user_exists THEN
            RAISE EXCEPTION 'User with ID % not found', p_user_id;
        END IF;
    END IF;

    -- Получаем ID типа
    SELECT id INTO type_id_val FROM notification_types WHERE name = p_type_name;
    IF type_id_val IS NULL THEN
        RAISE EXCEPTION 'Notification type % not found', p_type_name;
    END IF;
    
    -- Создаем уведомление
    INSERT INTO notifications (
        type_id, 
        title, 
        message, 
        user_id, 
        is_global, 
        priority, 
        link_url
    )
    VALUES (
        type_id_val, 
        p_title, 
        p_message, 
        p_user_id,
        p_is_global, 
        p_priority, 
        p_link_url
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION public.create_notification(p_type_name character varying, p_title character varying, p_message text, p_user_id integer, p_is_global boolean, p_priority integer, p_link_url character varying) OWNER TO f1111323_yoddle;

--
-- Name: create_notification(character varying, character varying, text, character varying, boolean, integer, character varying); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.create_notification(p_type_name character varying, p_title character varying, p_message text, p_user_id character varying DEFAULT NULL::character varying, p_is_global boolean DEFAULT false, p_priority integer DEFAULT 1, p_link_url character varying DEFAULT NULL::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    type_id_val INTEGER;
    notification_id INTEGER;
BEGIN
    -- Получаем ID типа
    SELECT id INTO type_id_val FROM notification_types WHERE name = p_type_name;
    
    IF type_id_val IS NULL THEN
        RAISE EXCEPTION 'Notification type % not found', p_type_name;
    END IF;
    
    -- Создаем уведомление
    INSERT INTO notifications (type_id, title, message, user_id, is_global, priority, link_url)
    VALUES (type_id_val, p_title, p_message, p_user_id, p_is_global, p_priority, p_link_url)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION public.create_notification(p_type_name character varying, p_title character varying, p_message text, p_user_id character varying, p_is_global boolean, p_priority integer, p_link_url character varying) OWNER TO f1111323_yoddle;

--
-- Name: get_average_rating(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_average_rating() RETURNS numeric
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(ROUND(AVG(rating), 2), 0)
        FROM feedback
    );
END;
$$;


ALTER FUNCTION public.get_average_rating() OWNER TO f1111323_yoddle;

--
-- Name: get_feedback_stats(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_feedback_stats() RETURNS TABLE(total_feedback integer, average_rating numeric, rating_5_count integer, rating_4_count integer, rating_3_count integer, rating_2_count integer, rating_1_count integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_feedback,
        COALESCE(ROUND(AVG(f.rating), 2), 0) as average_rating,
        COUNT(CASE WHEN f.rating = 5 THEN 1 END)::INTEGER as rating_5_count,
        COUNT(CASE WHEN f.rating = 4 THEN 1 END)::INTEGER as rating_4_count,
        COUNT(CASE WHEN f.rating = 3 THEN 1 END)::INTEGER as rating_3_count,
        COUNT(CASE WHEN f.rating = 2 THEN 1 END)::INTEGER as rating_2_count,
        COUNT(CASE WHEN f.rating = 1 THEN 1 END)::INTEGER as rating_1_count
    FROM feedback f;
END;
$$;


ALTER FUNCTION public.get_feedback_stats() OWNER TO f1111323_yoddle;

--
-- Name: get_login_streak(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_login_streak(p_user_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    streak_count INTEGER := 0;
    curr_date DATE;
    prev_date DATE := NULL;
    rec RECORD;
BEGIN
    -- Получаем все даты входа пользователя в обратном порядке
    FOR rec IN 
        SELECT DISTINCT DATE(created_at) as login_date 
        FROM activity_log 
        WHERE user_id = p_user_id AND action = 'login'
        ORDER BY DATE(created_at) DESC
    LOOP
        curr_date := rec.login_date;
        
        IF prev_date IS NULL THEN
            -- Первая итерация
            streak_count := 1;
            prev_date := curr_date;
        ELSIF prev_date - curr_date = 1 THEN
            -- Следующий день подряд
            streak_count := streak_count + 1;
            prev_date := curr_date;
        ELSE
            -- Прерван стрик
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END $$;


ALTER FUNCTION public.get_login_streak(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: get_news_by_category(character varying, integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_news_by_category(category_name_param character varying, limit_count integer) RETURNS TABLE(id integer, title character varying, content text, excerpt character varying, author character varying, image_url character varying, status character varying, is_featured boolean, publish_date timestamp with time zone, views_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, category_name character varying, category_color character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id, n.title, n.content, n.excerpt, n.author, n.image_url,
        n.status, n.is_featured, n.publish_date, n.views_count,
        n.created_at, n.updated_at,
        nc.name as category_name, nc.color_code as category_color
    FROM news n
    JOIN news_categories nc ON n.category_id = nc.id
    WHERE nc.name = category_name_param AND n.status = 'published'
    ORDER BY n.is_featured DESC, n.publish_date DESC
    LIMIT limit_count;
END;
$$;


ALTER FUNCTION public.get_news_by_category(category_name_param character varying, limit_count integer) OWNER TO f1111323_yoddle;

--
-- Name: get_productivity_level(numeric); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_productivity_level(p_score numeric) RETURNS TABLE(level_name character varying, tier character varying, xp_multiplier numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT pl.level_name, pl.tier, pl.xp_multiplier
    FROM productivity_levels pl
    WHERE p_score >= pl.min_score AND p_score <= pl.max_score
    LIMIT 1;
END;
$$;


ALTER FUNCTION public.get_productivity_level(p_score numeric) OWNER TO f1111323_yoddle;

--
-- Name: FUNCTION get_productivity_level(p_score numeric); Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON FUNCTION public.get_productivity_level(p_score numeric) IS 'Функция определения уровня продуктивности по рейтингу';


--
-- Name: get_unique_daily_activities(integer, date); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_unique_daily_activities(p_user_id integer, p_date date DEFAULT CURRENT_DATE) RETURNS TABLE(unique_actions text[], total_unique_count integer, achievements_excluded integer, reports_excluded integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_unique_daily_activities(p_user_id integer, p_date date) OWNER TO f1111323_yoddle;

--
-- Name: get_unread_notifications(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_unread_notifications(p_user_id integer DEFAULT NULL::integer) RETURNS TABLE(id integer, type_name character varying, type_icon character varying, type_color character varying, title character varying, message text, priority integer, link_url character varying, created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        nt.name as type_name,
        nt.icon as type_icon,
        nt.color as type_color,
        n.title,
        n.message,
        n.priority,
        n.link_url,
        n.created_at
    FROM notifications n
    LEFT JOIN notification_types nt ON n.type_id = nt.id
    WHERE (n.user_id = p_user_id OR n.is_global = true)
        AND n.is_read = false
        AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
    ORDER BY n.priority DESC, n.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_unread_notifications(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: get_unread_notifications(character varying); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_unread_notifications(p_user_id character varying DEFAULT NULL::character varying) RETURNS TABLE(id integer, type_name character varying, type_icon character varying, type_color character varying, title character varying, message text, priority integer, link_url character varying, created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        nt.name as type_name,
        nt.icon as type_icon,
        nt.color as type_color,
        n.title,
        n.message,
        n.priority,
        n.link_url,
        n.created_at
    FROM notifications n
    JOIN notification_types nt ON n.type_id = nt.id
    WHERE 
        (n.is_global = true OR n.user_id = p_user_id)
        AND n.is_read = false
        AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
    ORDER BY n.priority DESC, n.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_unread_notifications(p_user_id character varying) OWNER TO f1111323_yoddle;

--
-- Name: get_user_achievements(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_user_achievements(p_user_id integer) RETURNS TABLE(id character varying, title character varying, description text, icon character varying, points integer, tier integer, requirement_type character varying, requirement_value integer, requirement_action character varying, unlocked boolean, unlocked_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.code as id,
        a.name as title,
        a.description,
        a.icon,
        a.xp_reward as points,
        a.tier,
        a.requirement_type,
        a.requirement_value,
        a.requirement_action,
        CASE WHEN ua.achievement_id IS NOT NULL THEN true ELSE false END as unlocked,
        ua.unlocked_at
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.code = ua.achievement_id AND ua.user_id = p_user_id
    WHERE a.is_active = true
    ORDER BY a.tier ASC, a.xp_reward ASC;
END;
$$;


ALTER FUNCTION public.get_user_achievements(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: get_user_activity(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_user_activity(p_user_id integer, p_year integer, p_month integer) RETURNS TABLE(day integer, actions bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(DAY FROM al.created_at)::INTEGER as day,
        COUNT(*)::BIGINT as actions
    FROM activity_log al
    WHERE al.user_id = p_user_id 
        AND EXTRACT(YEAR FROM al.created_at) = p_year 
        AND EXTRACT(MONTH FROM al.created_at) = p_month
    GROUP BY EXTRACT(DAY FROM al.created_at)
    ORDER BY day;
END;
$$;


ALTER FUNCTION public.get_user_activity(p_user_id integer, p_year integer, p_month integer) OWNER TO f1111323_yoddle;

--
-- Name: get_user_balance_simple(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_user_balance_simple(p_user_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    user_balance DECIMAL(10,2);
BEGIN
    SELECT COALESCE(balance, 0.00) INTO user_balance 
    FROM enter 
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_balance, 0.00);
END;
$$;


ALTER FUNCTION public.get_user_balance_simple(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: get_user_daily_activity_summary(integer, date); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_user_daily_activity_summary(p_user_id integer, p_date date DEFAULT CURRENT_DATE) RETURNS TABLE(total_activities integer, successful_activities integer, failed_activities integer, mood_entries integer, energy_entries integer, stress_entries integer, total_platform_actions integer, activity_types text[], unique_activity_count integer, reports_count integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_user_daily_activity_summary(p_user_id integer, p_date date) OWNER TO f1111323_yoddle;

--
-- Name: get_user_productivity_stats(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_user_productivity_stats(p_user_id integer) RETURNS TABLE(overall_rating numeric, total_records integer, mood_average numeric, activity_average numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        calculate_simple_productivity_rating(p_user_id) as overall_rating,
        count_total_records(p_user_id) as total_records,
        (SELECT COALESCE(AVG(mood_rating), 0) FROM ai_signals WHERE user_id = p_user_id AND type = 'mood' AND mood_rating IS NOT NULL) as mood_average,
        (SELECT COALESCE(AVG(success_rating), 0) FROM ai_signals WHERE user_id = p_user_id AND type = 'activity' AND success_rating IS NOT NULL) as activity_average;
END;
$$;


ALTER FUNCTION public.get_user_productivity_stats(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: get_weekly_average_percentages(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_weekly_average_percentages(p_user_id integer) RETURNS TABLE(mood_average integer, energy_average integer, calmness_average integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_weekly_average_percentages(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: get_weekly_mood_percentages(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.get_weekly_mood_percentages(p_user_id integer) RETURNS TABLE(date date, mood_percentage integer, energy_percentage integer, calmness_percentage integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_weekly_mood_percentages(p_user_id integer) OWNER TO f1111323_yoddle;

--
-- Name: increment_news_views(integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.increment_news_views(news_id_param integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE news 
    SET views_count = views_count + 1 
    WHERE id = news_id_param AND status = 'published';
END;
$$;


ALTER FUNCTION public.increment_news_views(news_id_param integer) OWNER TO f1111323_yoddle;

--
-- Name: mark_notification_read(integer, character varying); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.mark_notification_read(p_notification_id integer, p_user_id character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = p_notification_id 
    AND (is_global = true OR user_id = p_user_id);
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.mark_notification_read(p_notification_id integer, p_user_id character varying) OWNER TO f1111323_yoddle;

--
-- Name: monthly_coins_allocation(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.monthly_coins_allocation() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    company_rec RECORD;
    user_rec RECORD;
    coins_per_user DECIMAL(10,2);
    total_allocated INTEGER := 0;
BEGIN
    -- Проходим по всем активным компаниям
    FOR company_rec IN 
        SELECT * FROM company_plans WHERE is_active = true
    LOOP
        coins_per_user := company_rec.coins_per_employee;
        
        -- Начисляем коины всем пользователям компании
        FOR user_rec IN 
            SELECT id FROM enter WHERE company_id = company_rec.id
        LOOP
            PERFORM add_coins(
                user_rec.id,
                coins_per_user,
                'Ежемесячное начисление коинов от ' || company_rec.company_name,
                'monthly_allowance'
            );
            total_allocated := total_allocated + 1;
        END LOOP;
    END LOOP;
    
    RETURN total_allocated;
END;
$$;


ALTER FUNCTION public.monthly_coins_allocation() OWNER TO f1111323_yoddle;

--
-- Name: spend_coins(integer, numeric, text, integer); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.spend_coins(p_user_id integer, p_amount numeric, p_description text DEFAULT 'Покупка льготы'::text, p_reference_id integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_balance DECIMAL(10,2);
BEGIN
    -- Получаем текущий баланс
    SELECT COALESCE(balance, 0) INTO current_balance 
    FROM user_balance 
    WHERE user_id = p_user_id;
    
    -- Проверяем достаточность средств
    IF current_balance < p_amount THEN
        RAISE EXCEPTION 'Недостаточно средств на балансе';
    END IF;
    
    -- Создаем транзакцию
    INSERT INTO coin_transactions (
        user_id, transaction_type, amount, balance_before, balance_after,
        description, reference_id
    ) VALUES (
        p_user_id, 'debit', p_amount, current_balance, current_balance - p_amount,
        p_description, p_reference_id
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;


ALTER FUNCTION public.spend_coins(p_user_id integer, p_amount numeric, p_description text, p_reference_id integer) OWNER TO f1111323_yoddle;

--
-- Name: trigger_productivity_calculation(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.trigger_productivity_calculation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Автоматически рассчитываем продуктивность при добавлении нового сигнала
    PERFORM calculate_productivity_score(NEW.user_id, DATE(NEW.timestamp));
    
    -- Проверяем достижения
    PERFORM check_productivity_achievements(NEW.user_id);
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_productivity_calculation() OWNER TO f1111323_yoddle;

--
-- Name: trigger_update_user_progress(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.trigger_update_user_progress() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Обновляем прогресс только для затронутого пользователя
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Удаляем старую запись пользователя
        DELETE FROM user_progress WHERE user_id = NEW.user_id;
        
        -- Вставляем новую рассчитанную запись
        INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at)
        SELECT 
            user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at
        FROM user_progress_calculated 
        WHERE user_id = NEW.user_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- При удалении активности пересчитываем прогресс
        DELETE FROM user_progress WHERE user_id = OLD.user_id;
        
        INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at)
        SELECT 
            user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at
        FROM user_progress_calculated 
        WHERE user_id = OLD.user_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END $$;


ALTER FUNCTION public.trigger_update_user_progress() OWNER TO f1111323_yoddle;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO f1111323_yoddle;

--
-- Name: update_user_balance(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.update_user_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Создаем запись баланса если её нет
    INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
    VALUES (NEW.user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Обновляем баланс в зависимости от типа транзакции
    IF NEW.transaction_type IN ('credit', 'admin_add', 'monthly_allowance') THEN
        UPDATE user_balance 
        SET 
            balance = balance + NEW.amount,
            total_earned = total_earned + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id;
    ELSE
        UPDATE user_balance 
        SET 
            balance = balance - NEW.amount,
            total_spent = total_spent + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_balance() OWNER TO f1111323_yoddle;

--
-- Name: update_user_progress(); Type: FUNCTION; Schema: public; Owner: f1111323_yoddle
--

CREATE FUNCTION public.update_user_progress() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Удаляем старые записи и вставляем новые рассчитанные
    DELETE FROM user_progress;
    
    INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at)
    SELECT 
        user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at
    FROM user_progress_calculated;
    
    RAISE NOTICE 'User progress updated successfully. Records updated: %', (SELECT COUNT(*) FROM user_progress);
END $$;


ALTER FUNCTION public.update_user_progress() OWNER TO f1111323_yoddle;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50),
    xp_reward integer DEFAULT 0,
    requirement_type character varying(50),
    requirement_value integer,
    requirement_action character varying(50),
    tier integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    productivity_related boolean DEFAULT false,
    productivity_category character varying(50),
    productivity_requirement jsonb
);


ALTER TABLE public.achievements OWNER TO f1111323_yoddle;

--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    user_id integer NOT NULL,
    achievement_id character varying(100) NOT NULL,
    unlocked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_achievements OWNER TO f1111323_yoddle;

--
-- Name: achievement_stats; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.achievement_stats AS
 SELECT ua.user_id,
    count(*) AS total_achievements,
    count(
        CASE
            WHEN (ua.unlocked_at IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS unlocked_achievements,
    sum(
        CASE
            WHEN (ua.unlocked_at IS NOT NULL) THEN a.xp_reward
            ELSE 0
        END) AS total_xp_from_achievements
   FROM (public.user_achievements ua
     JOIN public.achievements a ON (((ua.achievement_id)::text = (a.code)::text)))
  GROUP BY ua.user_id;


ALTER VIEW public.achievement_stats OWNER TO f1111323_yoddle;

--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.achievements_id_seq OWNER TO f1111323_yoddle;

--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.activity_log (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action character varying(100) NOT NULL,
    xp_earned integer DEFAULT 0,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activity_type_id integer
);


ALTER TABLE public.activity_log OWNER TO f1111323_yoddle;

--
-- Name: activity_types; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.activity_types (
    id integer NOT NULL,
    action_code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    xp_reward integer DEFAULT 0,
    icon character varying(50),
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_types OWNER TO f1111323_yoddle;

--
-- Name: enter; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.enter (
    id integer NOT NULL,
    login character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(30),
    "position" character varying(100),
    avatar_url text,
    name character varying,
    company_id integer,
    is_admin boolean DEFAULT false,
    balance numeric(10,2) DEFAULT 0.00
);


ALTER TABLE public.enter OWNER TO f1111323_yoddle;

--
-- Name: COLUMN enter.company_id; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.enter.company_id IS 'ID компании пользователя';


--
-- Name: COLUMN enter.is_admin; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.enter.is_admin IS 'Административные права пользователя';


--
-- Name: COLUMN enter.balance; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.enter.balance IS 'Текущий баланс Yoddle-коинов пользователя';


--
-- Name: activity_log_detailed; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.activity_log_detailed AS
 SELECT al.id,
    al.user_id,
    e.name AS user_name,
    al.action,
    at.name AS action_name,
    at.description AS action_description,
    at.icon AS action_icon,
    al.xp_earned,
    al.description,
    al.created_at,
    at.category
   FROM ((public.activity_log al
     JOIN public.enter e ON ((al.user_id = e.id)))
     LEFT JOIN public.activity_types at ON ((al.activity_type_id = at.id)));


ALTER VIEW public.activity_log_detailed OWNER TO f1111323_yoddle;

--
-- Name: activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_log_id_seq OWNER TO f1111323_yoddle;

--
-- Name: activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.activity_log_id_seq OWNED BY public.activity_log.id;


--
-- Name: activity_stats; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.activity_stats AS
 SELECT activity_log.user_id,
    count(*) AS total_actions,
    count(DISTINCT date(activity_log.created_at)) AS active_days,
    max(activity_log.created_at) AS last_activity,
    avg(activity_log.xp_earned) AS avg_xp_per_action
   FROM public.activity_log
  GROUP BY activity_log.user_id;


ALTER VIEW public.activity_stats OWNER TO f1111323_yoddle;

--
-- Name: activity_types_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.activity_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_types_id_seq OWNER TO f1111323_yoddle;

--
-- Name: activity_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.activity_types_id_seq OWNED BY public.activity_types.id;


--
-- Name: ai_feedback; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.ai_feedback (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    benefit_id bigint,
    label text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ai_feedback OWNER TO f1111323_yoddle;

--
-- Name: ai_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.ai_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_feedback_id_seq OWNER TO f1111323_yoddle;

--
-- Name: ai_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.ai_feedback_id_seq OWNED BY public.ai_feedback.id;


--
-- Name: ai_insights; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.ai_insights (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(100) NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);


ALTER TABLE public.ai_insights OWNER TO f1111323_yoddle;

--
-- Name: TABLE ai_insights; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.ai_insights IS 'AI инсайты и анализ для пользователей';


--
-- Name: ai_insights_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.ai_insights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_insights_id_seq OWNER TO f1111323_yoddle;

--
-- Name: ai_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.ai_insights_id_seq OWNED BY public.ai_insights.id;


--
-- Name: ai_metrics; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.ai_metrics (
    id integer NOT NULL,
    user_id integer NOT NULL,
    metric_type character varying(100) NOT NULL,
    metric_value numeric(10,4) NOT NULL,
    metric_date date NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ai_metrics OWNER TO f1111323_yoddle;

--
-- Name: TABLE ai_metrics; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.ai_metrics IS 'Метрики и статистика для AI анализа';


--
-- Name: ai_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.ai_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_metrics_id_seq OWNER TO f1111323_yoddle;

--
-- Name: ai_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.ai_metrics_id_seq OWNED BY public.ai_metrics.id;


--
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.ai_recommendations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    category character varying(100) NOT NULL,
    message text NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying,
    action_taken boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    CONSTRAINT ai_recommendations_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])))
);


ALTER TABLE public.ai_recommendations OWNER TO f1111323_yoddle;

--
-- Name: TABLE ai_recommendations; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.ai_recommendations IS 'AI рекомендации и советы';


--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.ai_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_recommendations_id_seq OWNER TO f1111323_yoddle;

--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.ai_recommendations_id_seq OWNED BY public.ai_recommendations.id;


--
-- Name: ai_signals; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.ai_signals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    data jsonb NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    mood_rating integer,
    energy_rating integer,
    stress_rating integer,
    quality_score numeric(3,2) DEFAULT 1.0,
    notes text,
    activity_category character varying(50),
    duration_minutes integer,
    success_rating integer,
    CONSTRAINT ai_signals_energy_rating_check CHECK (((energy_rating >= 1) AND (energy_rating <= 10))),
    CONSTRAINT ai_signals_mood_rating_check CHECK (((mood_rating >= 1) AND (mood_rating <= 10))),
    CONSTRAINT ai_signals_stress_rating_check CHECK (((stress_rating >= 1) AND (stress_rating <= 10))),
    CONSTRAINT ai_signals_success_rating_check CHECK (((success_rating >= 1) AND (success_rating <= 10))),
    CONSTRAINT ai_signals_type_check CHECK (((type)::text = ANY (ARRAY['mood'::text, 'activity'::text, 'stress'::text, 'goal'::text, 'achievement'::text, 'daily_mood_check'::text, 'activity_analysis'::text, 'productivity_report'::text, 'preferences_free'::text, 'benefit_feedback'::text])))
);


ALTER TABLE public.ai_signals OWNER TO f1111323_yoddle;

--
-- Name: TABLE ai_signals; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.ai_signals IS 'AI сигналы от пользователей (настроение, активность, стресс)';


--
-- Name: ai_signals_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.ai_signals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_signals_id_seq OWNER TO f1111323_yoddle;

--
-- Name: ai_signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.ai_signals_id_seq OWNED BY public.ai_signals.id;


--
-- Name: ai_user_preferences; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.ai_user_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    analysis_frequency character varying(20) DEFAULT 'daily'::character varying,
    privacy_level character varying(20) DEFAULT 'standard'::character varying,
    notification_preferences jsonb DEFAULT '{"push": true, "email": true, "in_app": true}'::jsonb,
    ai_personality character varying(50) DEFAULT 'supportive'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_user_preferences_ai_personality_check CHECK (((ai_personality)::text = ANY ((ARRAY['supportive'::character varying, 'motivational'::character varying, 'analytical'::character varying, 'friendly'::character varying])::text[]))),
    CONSTRAINT ai_user_preferences_analysis_frequency_check CHECK (((analysis_frequency)::text = ANY ((ARRAY['hourly'::character varying, 'daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::text[]))),
    CONSTRAINT ai_user_preferences_privacy_level_check CHECK (((privacy_level)::text = ANY ((ARRAY['minimal'::character varying, 'standard'::character varying, 'detailed'::character varying])::text[])))
);


ALTER TABLE public.ai_user_preferences OWNER TO f1111323_yoddle;

--
-- Name: TABLE ai_user_preferences; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.ai_user_preferences IS 'Настройки AI для каждого пользователя';


--
-- Name: ai_user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.ai_user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_user_preferences_id_seq OWNER TO f1111323_yoddle;

--
-- Name: ai_user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.ai_user_preferences_id_seq OWNED BY public.ai_user_preferences.id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.audit_log (
    id bigint NOT NULL,
    actor_user_id integer,
    target_user_id integer,
    action text NOT NULL,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_log OWNER TO f1111323_yoddle;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO f1111323_yoddle;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: company_plans; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.company_plans (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    employee_count integer NOT NULL,
    monthly_rate numeric(10,2) NOT NULL,
    coins_per_employee numeric(10,2) NOT NULL,
    plan_start_date date NOT NULL,
    plan_end_date date,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    allowance_day smallint DEFAULT 1,
    carryover_policy text DEFAULT 'none'::text,
    max_balance numeric(12,2),
    timezone text DEFAULT 'Europe/Moscow'::text,
    CONSTRAINT company_plans_allowance_day_check CHECK (((allowance_day >= 1) AND (allowance_day <= 28))),
    CONSTRAINT company_plans_carryover_policy_check CHECK ((carryover_policy = ANY (ARRAY['none'::text, 'full'::text, 'partial'::text])))
);


ALTER TABLE public.company_plans OWNER TO f1111323_yoddle;

--
-- Name: TABLE company_plans; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.company_plans IS 'Тарифные планы компаний';


--
-- Name: COLUMN company_plans.monthly_rate; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.company_plans.monthly_rate IS 'Ежемесячная плата 150-450р';


--
-- Name: COLUMN company_plans.coins_per_employee; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.company_plans.coins_per_employee IS 'Количество коинов на сотрудника в месяц';


--
-- Name: user_balance; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.user_balance (
    id integer NOT NULL,
    user_id integer NOT NULL,
    balance numeric(10,2) DEFAULT 0.00,
    total_earned numeric(10,2) DEFAULT 0.00,
    total_spent numeric(10,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_balance OWNER TO f1111323_yoddle;

--
-- Name: TABLE user_balance; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.user_balance IS 'Баланс Yoddle-коинов пользователей';


--
-- Name: balance_report; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.balance_report AS
 SELECT u.id,
    u.name,
    u.login,
    cp.company_name,
    ub.balance,
    ub.total_earned,
    ub.total_spent,
    ub.updated_at AS last_balance_update
   FROM ((public.enter u
     LEFT JOIN public.user_balance ub ON ((u.id = ub.user_id)))
     LEFT JOIN public.company_plans cp ON ((u.company_id = cp.id)))
  ORDER BY u.name;


ALTER VIEW public.balance_report OWNER TO f1111323_yoddle;

--
-- Name: benefit_recommendations; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.benefit_recommendations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    benefit_id integer NOT NULL,
    priority integer NOT NULL,
    answers jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    explanations jsonb DEFAULT '[]'::jsonb,
    confidence double precision DEFAULT 0.6,
    algorithm_variant text DEFAULT 'static'::text,
    score_breakdown jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.benefit_recommendations OWNER TO f1111323_yoddle;

--
-- Name: benefits; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.benefits (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    category text,
    price_coins numeric(12,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.benefits OWNER TO f1111323_yoddle;

--
-- Name: benefit_recommendations_detailed; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.benefit_recommendations_detailed AS
 SELECT br.id,
    br.user_id,
    e.name AS user_name,
    br.benefit_id,
    b.name AS benefit_name,
    b.description AS benefit_description,
    b.category AS benefit_category,
    br.priority,
    br.answers,
    br.created_at
   FROM ((public.benefit_recommendations br
     JOIN public.enter e ON ((br.user_id = e.id)))
     JOIN public.benefits b ON ((br.benefit_id = b.id)));


ALTER VIEW public.benefit_recommendations_detailed OWNER TO f1111323_yoddle;

--
-- Name: benefit_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.benefit_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.benefit_recommendations_id_seq OWNER TO f1111323_yoddle;

--
-- Name: benefit_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.benefit_recommendations_id_seq OWNED BY public.benefit_recommendations.id;


--
-- Name: user_benefits; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.user_benefits (
    user_id integer NOT NULL,
    benefit_id integer NOT NULL
);


ALTER TABLE public.user_benefits OWNER TO f1111323_yoddle;

--
-- Name: benefit_stats; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.benefit_stats AS
 SELECT ub.user_id,
    count(*) AS total_benefits,
    count(DISTINCT b.category) AS benefit_categories
   FROM (public.user_benefits ub
     JOIN public.benefits b ON ((ub.benefit_id = b.id)))
  GROUP BY ub.user_id;


ALTER VIEW public.benefit_stats OWNER TO f1111323_yoddle;

--
-- Name: benefits_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.benefits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.benefits_id_seq OWNER TO f1111323_yoddle;

--
-- Name: benefits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.benefits_id_seq OWNED BY public.benefits.id;


--
-- Name: category_stats; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.category_stats AS
SELECT
    NULL::integer AS id,
    NULL::character varying(100) AS name,
    NULL::character varying(7) AS color_code,
    NULL::character varying(50) AS icon,
    NULL::bigint AS news_count,
    NULL::bigint AS total_views;


ALTER VIEW public.category_stats OWNER TO f1111323_yoddle;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    company character varying(255)
);


ALTER TABLE public.clients OWNER TO f1111323_yoddle;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO f1111323_yoddle;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: coin_transactions; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.coin_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    transaction_type character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    balance_before numeric(10,2) NOT NULL,
    balance_after numeric(10,2) NOT NULL,
    description text,
    reference_id text,
    processed_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT coin_transactions_amount_non_negative CHECK ((amount >= (0)::numeric)),
    CONSTRAINT coin_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['monthly_allowance'::character varying, 'credit'::character varying, 'admin_add'::character varying, 'benefit_purchase'::character varying, 'debit'::character varying, 'admin_remove'::character varying, 'refund'::character varying])::text[])))
);


ALTER TABLE public.coin_transactions OWNER TO f1111323_yoddle;

--
-- Name: TABLE coin_transactions; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.coin_transactions IS 'История всех операций с коинами';


--
-- Name: COLUMN coin_transactions.transaction_type; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.coin_transactions.transaction_type IS 'Тип операции: credit/debit/admin_add/admin_remove/benefit_purchase/monthly_allowance';


--
-- Name: coin_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.coin_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coin_transactions_id_seq OWNER TO f1111323_yoddle;

--
-- Name: coin_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.coin_transactions_id_seq OWNED BY public.coin_transactions.id;


--
-- Name: company_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.company_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_plans_id_seq OWNER TO f1111323_yoddle;

--
-- Name: company_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.company_plans_id_seq OWNED BY public.company_plans.id;


--
-- Name: company_statistics; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.company_statistics AS
 SELECT cp.id,
    cp.company_name,
    cp.employee_count,
    cp.monthly_rate,
    cp.coins_per_employee,
    count(u.id) AS actual_employees,
    sum(ub.balance) AS total_balance,
    sum(ub.total_earned) AS total_coins_issued,
    sum(ub.total_spent) AS total_coins_spent
   FROM ((public.company_plans cp
     LEFT JOIN public.enter u ON ((u.company_id = cp.id)))
     LEFT JOIN public.user_balance ub ON ((u.id = ub.user_id)))
  WHERE (cp.is_active = true)
  GROUP BY cp.id, cp.company_name, cp.employee_count, cp.monthly_rate, cp.coins_per_employee;


ALTER VIEW public.company_statistics OWNER TO f1111323_yoddle;

--
-- Name: enter_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.enter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enter_id_seq OWNER TO f1111323_yoddle;

--
-- Name: enter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.enter_id_seq OWNED BY public.enter.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.feedback OWNER TO f1111323_yoddle;

--
-- Name: TABLE feedback; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.feedback IS 'Отзывы сотрудников о работе в компании';


--
-- Name: COLUMN feedback.id; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.feedback.id IS 'Уникальный идентификатор отзыва';


--
-- Name: COLUMN feedback.user_id; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.feedback.user_id IS 'ID пользователя (связь с таблицей users)';


--
-- Name: COLUMN feedback.rating; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.feedback.rating IS 'Рейтинг от 1 до 5 звезд';


--
-- Name: COLUMN feedback.comment; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.feedback.comment IS 'Текст отзыва';


--
-- Name: COLUMN feedback.created_at; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON COLUMN public.feedback.created_at IS 'Дата и время создания отзыва';


--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO f1111323_yoddle;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: feedback_with_users; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.feedback_with_users AS
 SELECT f.id,
    f.user_id,
    f.rating,
    f.comment,
    f.created_at,
    ('Сотрудник '::text || (f.user_id)::text) AS user_name,
    NULL::text AS user_email,
    'Должность не указана'::text AS "position",
    NULL::text AS avatar,
    f.created_at AS user_created_at
   FROM public.feedback f
  ORDER BY f.created_at DESC;


ALTER VIEW public.feedback_with_users OWNER TO f1111323_yoddle;

--
-- Name: news; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.news (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    excerpt character varying(500),
    category_id integer NOT NULL,
    author character varying(100) NOT NULL,
    image_url character varying(500),
    status character varying(20) DEFAULT 'draft'::character varying,
    is_featured boolean DEFAULT false,
    publish_date timestamp with time zone,
    views_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT news_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);


ALTER TABLE public.news OWNER TO f1111323_yoddle;

--
-- Name: news_categories; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.news_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color_code character varying(7) NOT NULL,
    icon character varying(50),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.news_categories OWNER TO f1111323_yoddle;

--
-- Name: news_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.news_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.news_categories_id_seq OWNER TO f1111323_yoddle;

--
-- Name: news_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.news_categories_id_seq OWNED BY public.news_categories.id;


--
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.news_id_seq OWNER TO f1111323_yoddle;

--
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- Name: news_with_categories; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.news_with_categories AS
 SELECT n.id,
    n.title,
    n.content,
    n.excerpt,
    n.author,
    n.image_url,
    n.status,
    n.is_featured,
    n.publish_date,
    n.views_count,
    n.created_at,
    n.updated_at,
    nc.name AS category_name,
    nc.color_code AS category_color,
    nc.icon AS category_icon
   FROM (public.news n
     JOIN public.news_categories nc ON ((n.category_id = nc.id)))
  WHERE ((n.status)::text = 'published'::text)
  ORDER BY n.is_featured DESC, n.publish_date DESC;


ALTER VIEW public.news_with_categories OWNER TO f1111323_yoddle;

--
-- Name: notification_types; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.notification_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    icon character varying(50) NOT NULL,
    color character varying(20) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notification_types OWNER TO f1111323_yoddle;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    type_id integer,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    user_id integer,
    is_read boolean DEFAULT false,
    is_global boolean DEFAULT false,
    link_url character varying(500),
    priority integer DEFAULT 1,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO f1111323_yoddle;

--
-- Name: notification_stats; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.notification_stats AS
 SELECT nt.name AS type_name,
    nt.icon,
    nt.color,
    count(n.id) AS total_notifications,
    count(
        CASE
            WHEN (n.is_read = false) THEN 1
            ELSE NULL::integer
        END) AS unread_count,
    count(
        CASE
            WHEN (n.priority = 3) THEN 1
            ELSE NULL::integer
        END) AS high_priority_count
   FROM (public.notification_types nt
     LEFT JOIN public.notifications n ON ((nt.id = n.type_id)))
  GROUP BY nt.id, nt.name, nt.icon, nt.color
  ORDER BY (count(n.id)) DESC;


ALTER VIEW public.notification_stats OWNER TO f1111323_yoddle;

--
-- Name: notification_types_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.notification_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_types_id_seq OWNER TO f1111323_yoddle;

--
-- Name: notification_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.notification_types_id_seq OWNED BY public.notification_types.id;


--
-- Name: notifications_detailed; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.notifications_detailed AS
 SELECT n.id,
    n.user_id,
    e.name AS user_name,
    e.login AS user_email,
    n.type_id,
    nt.name AS type_name,
    nt.icon AS type_icon,
    nt.color AS type_color,
    n.title,
    n.message,
    n.is_read,
    n.is_global,
    n.priority,
    n.link_url,
    n.expires_at,
    n.created_at,
    n.read_at
   FROM ((public.notifications n
     LEFT JOIN public.enter e ON ((n.user_id = e.id)))
     LEFT JOIN public.notification_types nt ON ((n.type_id = nt.id)));


ALTER VIEW public.notifications_detailed OWNER TO f1111323_yoddle;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO f1111323_yoddle;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: productivity_achievements; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.productivity_achievements (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    requirement_type character varying(50) NOT NULL,
    requirement_value integer NOT NULL,
    xp_reward integer DEFAULT 0,
    icon character varying(100),
    tier character varying(20) DEFAULT 'bronze'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.productivity_achievements OWNER TO f1111323_yoddle;

--
-- Name: TABLE productivity_achievements; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.productivity_achievements IS 'Достижения за продуктивность';


--
-- Name: productivity_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.productivity_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productivity_achievements_id_seq OWNER TO f1111323_yoddle;

--
-- Name: productivity_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.productivity_achievements_id_seq OWNED BY public.productivity_achievements.id;


--
-- Name: productivity_levels; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.productivity_levels (
    id integer NOT NULL,
    level_name character varying(50) NOT NULL,
    min_score numeric(5,2) NOT NULL,
    max_score numeric(5,2) NOT NULL,
    xp_multiplier numeric(3,2) DEFAULT 1.0,
    icon character varying(100),
    color_code character varying(7),
    description text,
    tier character varying(20) DEFAULT 'bronze'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.productivity_levels OWNER TO f1111323_yoddle;

--
-- Name: TABLE productivity_levels; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.productivity_levels IS 'Уровни продуктивности с XP множителями';


--
-- Name: productivity_scores; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.productivity_scores (
    id integer NOT NULL,
    user_id integer,
    date date NOT NULL,
    daily_score numeric(5,2) NOT NULL,
    mood_component numeric(5,2) NOT NULL,
    activity_component numeric(5,2) NOT NULL,
    quality_multiplier numeric(3,2) DEFAULT 1.0,
    platform_activity_coefficient numeric(3,2) DEFAULT 1.0,
    final_score numeric(5,2) NOT NULL,
    mood_entries_count integer DEFAULT 0,
    activity_entries_count integer DEFAULT 0,
    quality_penalties integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.productivity_scores OWNER TO f1111323_yoddle;

--
-- Name: TABLE productivity_scores; Type: COMMENT; Schema: public; Owner: f1111323_yoddle
--

COMMENT ON TABLE public.productivity_scores IS 'Ежедневные рейтинги продуктивности пользователей';


--
-- Name: user_progress; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.user_progress (
    id integer NOT NULL,
    user_id integer NOT NULL,
    xp integer DEFAULT 0,
    level integer DEFAULT 1,
    login_streak integer DEFAULT 0,
    days_active integer DEFAULT 0,
    benefits_used integer DEFAULT 0,
    profile_completion integer DEFAULT 0,
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    productivity_score numeric(5,2) DEFAULT 0.0,
    weekly_productivity numeric(5,2) DEFAULT 0.0,
    monthly_productivity numeric(5,2) DEFAULT 0.0,
    mood_stability numeric(3,2) DEFAULT 0.0,
    energy_consistency numeric(3,2) DEFAULT 0.0,
    stress_management numeric(3,2) DEFAULT 0.0,
    last_mood_check timestamp with time zone,
    daily_entries_count integer DEFAULT 0,
    weekly_entries_count integer DEFAULT 0,
    productivity_level character varying(50) DEFAULT 'Новичок'::character varying,
    productivity_tier character varying(20) DEFAULT 'bronze'::character varying
);


ALTER TABLE public.user_progress OWNER TO f1111323_yoddle;

--
-- Name: productivity_dashboard; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.productivity_dashboard AS
 SELECT e.id AS user_id,
    e.name AS user_name,
    up.productivity_score,
    up.productivity_level,
    up.productivity_tier,
    pl.xp_multiplier,
    pl.icon AS level_icon,
    pl.color_code AS level_color,
    pl.description AS level_description,
    up.weekly_productivity,
    up.monthly_productivity,
    up.mood_stability,
    up.energy_consistency,
    up.stress_management,
    up.daily_entries_count,
    up.weekly_entries_count,
    ( SELECT count(*) AS count
           FROM public.productivity_scores ps
          WHERE ((ps.user_id = e.id) AND (ps.date >= (CURRENT_DATE - '7 days'::interval)))) AS days_tracked_this_week,
    ( SELECT count(*) AS count
           FROM (public.user_achievements ua
             JOIN public.productivity_achievements pa ON (((ua.achievement_id)::text = (pa.code)::text)))
          WHERE (ua.user_id = e.id)) AS productivity_achievements_count
   FROM ((public.enter e
     JOIN public.user_progress up ON ((e.id = up.user_id)))
     LEFT JOIN public.productivity_levels pl ON (((up.productivity_level)::text = (pl.level_name)::text)));


ALTER VIEW public.productivity_dashboard OWNER TO f1111323_yoddle;

--
-- Name: productivity_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.productivity_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productivity_levels_id_seq OWNER TO f1111323_yoddle;

--
-- Name: productivity_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.productivity_levels_id_seq OWNED BY public.productivity_levels.id;


--
-- Name: productivity_progress; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.productivity_progress AS
 SELECT e.id AS user_id,
    e.name AS user_name,
    up.xp,
    up.level,
    up.productivity_score,
    up.productivity_level,
    up.productivity_tier,
    pl.xp_multiplier,
    pl.icon AS level_icon,
    pl.color_code AS level_color,
        CASE
            WHEN (pl.max_score > up.productivity_score) THEN round((((up.productivity_score - pl.min_score) / (pl.max_score - pl.min_score)) * (100)::numeric), 1)
            ELSE 100.0
        END AS progress_percentage,
    ( SELECT pl2.level_name
           FROM public.productivity_levels pl2
          WHERE (pl2.min_score > up.productivity_score)
          ORDER BY pl2.min_score
         LIMIT 1) AS next_level,
    ( SELECT (pl2.min_score - up.productivity_score)
           FROM public.productivity_levels pl2
          WHERE (pl2.min_score > up.productivity_score)
          ORDER BY pl2.min_score
         LIMIT 1) AS score_to_next_level
   FROM ((public.enter e
     JOIN public.user_progress up ON ((e.id = up.user_id)))
     LEFT JOIN public.productivity_levels pl ON (((up.productivity_level)::text = (pl.level_name)::text)));


ALTER VIEW public.productivity_progress OWNER TO f1111323_yoddle;

--
-- Name: productivity_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.productivity_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productivity_scores_id_seq OWNER TO f1111323_yoddle;

--
-- Name: productivity_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.productivity_scores_id_seq OWNED BY public.productivity_scores.id;


--
-- Name: recent_notifications; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.recent_notifications AS
 SELECT n.id,
    nt.name AS type_name,
    nt.icon AS type_icon,
    nt.color AS type_color,
    n.title,
    n.message,
    n.priority,
    n.is_read,
    n.created_at,
        CASE
            WHEN (n.created_at > (CURRENT_TIMESTAMP - '01:00:00'::interval)) THEN 'just_now'::text
            WHEN (n.created_at > (CURRENT_TIMESTAMP - '1 day'::interval)) THEN 'today'::text
            WHEN (n.created_at > (CURRENT_TIMESTAMP - '7 days'::interval)) THEN 'this_week'::text
            ELSE 'older'::text
        END AS time_category
   FROM (public.notifications n
     JOIN public.notification_types nt ON ((n.type_id = nt.id)))
  WHERE ((n.expires_at IS NULL) OR (n.expires_at > CURRENT_TIMESTAMP))
  ORDER BY n.created_at DESC
 LIMIT 50;


ALTER VIEW public.recent_notifications OWNER TO f1111323_yoddle;

--
-- Name: transactions_report; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.transactions_report AS
 SELECT ct.id,
    u.name AS user_name,
    u.login,
    cp.company_name,
    ct.transaction_type,
    ct.amount,
    ct.description,
    ct.created_at,
    admin_user.name AS processed_by_name
   FROM (((public.coin_transactions ct
     JOIN public.enter u ON ((ct.user_id = u.id)))
     LEFT JOIN public.company_plans cp ON ((u.company_id = cp.id)))
     LEFT JOIN public.enter admin_user ON ((ct.processed_by = admin_user.id)))
  ORDER BY ct.created_at DESC;


ALTER VIEW public.transactions_report OWNER TO f1111323_yoddle;

--
-- Name: user_achievements_detailed; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.user_achievements_detailed AS
 SELECT ua.id,
    ua.user_id,
    e.name AS user_name,
    ua.achievement_id,
    a.name AS achievement_name,
    a.description AS achievement_description,
    a.icon AS achievement_icon,
    a.xp_reward,
    a.tier,
    ua.unlocked_at
   FROM ((public.user_achievements ua
     JOIN public.enter e ON ((ua.user_id = e.id)))
     JOIN public.achievements a ON (((ua.achievement_id)::text = (a.code)::text)));


ALTER VIEW public.user_achievements_detailed OWNER TO f1111323_yoddle;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_achievements_id_seq OWNER TO f1111323_yoddle;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- Name: user_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.user_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_balance_id_seq OWNER TO f1111323_yoddle;

--
-- Name: user_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.user_balance_id_seq OWNED BY public.user_balance.id;


--
-- Name: user_progress_calculated; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.user_progress_calculated AS
 WITH user_stats AS (
         SELECT e.id AS user_id,
            e.name,
            e.login,
            COALESCE(sum(al.xp_earned), (0)::bigint) AS total_xp,
            (floor(((COALESCE(sum(al.xp_earned), (0)::bigint))::numeric / 100.0)) + (1)::numeric) AS level,
            count(DISTINCT date(al.created_at)) AS days_active,
            max(al.created_at) AS last_activity,
                CASE
                    WHEN (count(
                    CASE
                        WHEN ((al.action)::text = 'login'::text) THEN 1
                        ELSE NULL::integer
                    END) > 0) THEN public.get_login_streak(e.id)
                    ELSE 0
                END AS login_streak,
            count(
                CASE
                    WHEN ((al.action)::text = 'benefit_used'::text) THEN 1
                    ELSE NULL::integer
                END) AS benefits_used,
                CASE
                    WHEN ((e.name IS NOT NULL) AND (e.phone IS NOT NULL) AND (e."position" IS NOT NULL)) THEN 100
                    WHEN (((e.name IS NOT NULL) AND (e.phone IS NOT NULL)) OR ((e.name IS NOT NULL) AND (e."position" IS NOT NULL)) OR ((e.phone IS NOT NULL) AND (e."position" IS NOT NULL))) THEN 75
                    WHEN ((e.name IS NOT NULL) OR (e.phone IS NOT NULL) OR (e."position" IS NOT NULL)) THEN 50
                    ELSE 25
                END AS profile_completion,
            COALESCE((up.created_at)::timestamp with time zone, now()) AS created_at,
            now() AS updated_at
           FROM ((public.enter e
             LEFT JOIN public.activity_log al ON ((e.id = al.user_id)))
             LEFT JOIN public.user_progress up ON ((e.id = up.user_id)))
          GROUP BY e.id, e.name, e.login, e.phone, e."position", up.created_at
        )
 SELECT row_number() OVER (ORDER BY user_stats.user_id) AS id,
    user_stats.user_id,
    user_stats.total_xp AS xp,
    user_stats.level,
    user_stats.login_streak,
    user_stats.days_active,
    user_stats.benefits_used,
    user_stats.profile_completion,
    user_stats.last_activity,
    user_stats.created_at,
    user_stats.updated_at
   FROM user_stats;


ALTER VIEW public.user_progress_calculated OWNER TO f1111323_yoddle;

--
-- Name: user_progress_detailed; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.user_progress_detailed AS
 SELECT up.id,
    up.user_id,
    e.name AS user_name,
    e.login AS user_email,
    up.xp,
    up.level,
    up.login_streak,
    up.days_active,
    up.benefits_used,
    up.profile_completion,
    up.last_activity,
    up.created_at,
    up.updated_at
   FROM (public.user_progress up
     JOIN public.enter e ON ((up.user_id = e.id)));


ALTER VIEW public.user_progress_detailed OWNER TO f1111323_yoddle;

--
-- Name: user_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: f1111323_yoddle
--

CREATE SEQUENCE public.user_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_progress_id_seq OWNER TO f1111323_yoddle;

--
-- Name: user_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: f1111323_yoddle
--

ALTER SEQUENCE public.user_progress_id_seq OWNED BY public.user_progress.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: f1111323_yoddle
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role text NOT NULL,
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'manager'::text, 'user'::text])))
);


ALTER TABLE public.user_roles OWNER TO f1111323_yoddle;

--
-- Name: user_with_balance; Type: VIEW; Schema: public; Owner: f1111323_yoddle
--

CREATE VIEW public.user_with_balance AS
 SELECT e.id,
    e.name,
    e.login AS email,
    e.phone,
    e."position",
    e.avatar_url,
    e.balance,
    e.company_id,
    e.is_admin
   FROM public.enter e;


ALTER VIEW public.user_with_balance OWNER TO f1111323_yoddle;

--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: activity_log id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN id SET DEFAULT nextval('public.activity_log_id_seq'::regclass);


--
-- Name: activity_types id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.activity_types ALTER COLUMN id SET DEFAULT nextval('public.activity_types_id_seq'::regclass);


--
-- Name: ai_feedback id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_feedback ALTER COLUMN id SET DEFAULT nextval('public.ai_feedback_id_seq'::regclass);


--
-- Name: ai_insights id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_insights ALTER COLUMN id SET DEFAULT nextval('public.ai_insights_id_seq'::regclass);


--
-- Name: ai_metrics id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_metrics ALTER COLUMN id SET DEFAULT nextval('public.ai_metrics_id_seq'::regclass);


--
-- Name: ai_recommendations id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_recommendations ALTER COLUMN id SET DEFAULT nextval('public.ai_recommendations_id_seq'::regclass);


--
-- Name: ai_signals id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_signals ALTER COLUMN id SET DEFAULT nextval('public.ai_signals_id_seq'::regclass);


--
-- Name: ai_user_preferences id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_user_preferences ALTER COLUMN id SET DEFAULT nextval('public.ai_user_preferences_id_seq'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: benefit_recommendations id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefit_recommendations ALTER COLUMN id SET DEFAULT nextval('public.benefit_recommendations_id_seq'::regclass);


--
-- Name: benefits id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefits ALTER COLUMN id SET DEFAULT nextval('public.benefits_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: coin_transactions id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.coin_transactions ALTER COLUMN id SET DEFAULT nextval('public.coin_transactions_id_seq'::regclass);


--
-- Name: company_plans id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.company_plans ALTER COLUMN id SET DEFAULT nextval('public.company_plans_id_seq'::regclass);


--
-- Name: enter id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.enter ALTER COLUMN id SET DEFAULT nextval('public.enter_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: news id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- Name: news_categories id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.news_categories ALTER COLUMN id SET DEFAULT nextval('public.news_categories_id_seq'::regclass);


--
-- Name: notification_types id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.notification_types ALTER COLUMN id SET DEFAULT nextval('public.notification_types_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: productivity_achievements id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_achievements ALTER COLUMN id SET DEFAULT nextval('public.productivity_achievements_id_seq'::regclass);


--
-- Name: productivity_levels id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_levels ALTER COLUMN id SET DEFAULT nextval('public.productivity_levels_id_seq'::regclass);


--
-- Name: productivity_scores id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_scores ALTER COLUMN id SET DEFAULT nextval('public.productivity_scores_id_seq'::regclass);


--
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- Name: user_balance id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_balance ALTER COLUMN id SET DEFAULT nextval('public.user_balance_id_seq'::regclass);


--
-- Name: user_progress id; Type: DEFAULT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_progress ALTER COLUMN id SET DEFAULT nextval('public.user_progress_id_seq'::regclass);


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.achievements (id, code, name, description, icon, xp_reward, requirement_type, requirement_value, requirement_action, tier, is_active, created_at, productivity_related, productivity_category, productivity_requirement) FROM stdin;
1	first_login	Добро пожаловать!	Первый вход в систему	👋	25	count	1	login	1	t	2025-06-30 17:03:01.722144	f	\N	\N
3	login_streak_7	Привычка	7 дней подряд в системе	⭐	100	streak	7	login	2	t	2025-06-30 17:03:01.722144	f	\N	\N
4	login_streak_30	Преданность	30 дней подряд в системе	👑	300	streak	30	login	3	t	2025-06-30 17:03:01.722144	f	\N	\N
6	first_benefit	Первые шаги	Добавлена первая льгота	🎁	50	count	1	benefit_added	1	t	2025-06-30 17:03:01.722144	f	\N	\N
7	benefit_collector	Коллекционер	Добавлено 5 льгот	🏆	150	count	5	benefit_added	2	t	2025-06-30 17:03:01.722144	f	\N	\N
8	benefit_master	Мастер льгот	Добавлено 10 льгот	💎	300	count	10	benefit_added	3	t	2025-06-30 17:03:01.722144	f	\N	\N
12	xp_2500	Чемпион	Набрано 2500 XP	🏅	300	total_xp	2500	\N	3	t	2025-06-30 17:03:01.722144	f	\N	\N
13	early_bird	Ранняя пташка	Вход в систему до 9:00	🐦	30	custom	1	early_login	1	t	2025-06-30 17:03:01.722144	f	\N	\N
14	night_owl	Сова	Вход в систему после 22:00	🦉	30	custom	1	late_login	1	t	2025-06-30 17:03:01.722144	f	\N	\N
15	weekend_warrior	Воин выходных	Активность в выходные дни	⚔️	40	custom	1	weekend_activity	2	t	2025-06-30 17:03:01.722144	f	\N	\N
2	login_streak_3	Постоянство	3 дня подряд в системе	🔥	50	streak	3	login	1	t	2025-06-30 17:03:01.722144	t	consistency	\N
5	profile_complete	Готов к работе!	Полностью заполненный профиль	✅	75	custom	100	profile_completion	1	t	2025-06-30 17:03:01.722144	t	consistency	\N
9	xp_100	Новичок	Набрано 100 XP	🌱	25	total_xp	100	\N	1	t	2025-06-30 17:03:01.722144	t	growth	\N
10	xp_500	Активист	Набрано 500 XP	🚀	75	total_xp	500	\N	2	t	2025-06-30 17:03:01.722144	t	growth	\N
11	xp_1000	Эксперт	Набрано 1000 XP	⚡	150	total_xp	1000	\N	3	t	2025-06-30 17:03:01.722144	t	growth	\N
\.


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.activity_log (id, user_id, action, xp_earned, description, created_at, activity_type_id) FROM stdin;
8125	2	early_bird	30	🌅 Ранний пташка	2025-08-04 22:13:12.230973	\N
31	1	login	10	Ежедневный вход в систему	2025-06-01 09:00:00	1
32	1	profile_update	25	Обновление профиля	2025-06-01 14:30:00	3
33	1	login	10	Ежедневный вход в систему	2025-06-03 08:45:00	1
34	1	login	10	Ежедневный вход в систему	2025-06-05 09:15:00	1
35	1	login	10	Ежедневный вход в систему	2025-06-07 10:30:00	1
36	1	login	10	Ежедневный вход в систему	2025-06-09 08:20:00	1
37	1	benefit_added	50	Добавление льготы	2025-06-09 15:10:00	5
38	1	login	10	Ежедневный вход в систему	2025-06-12 08:00:00	1
39	1	profile_update	25	Обновление профиля	2025-06-12 10:30:00	3
40	1	benefit_added	50	Добавление льготы	2025-06-12 13:15:00	5
41	1	login	10	Вечерний вход в систему	2025-06-12 18:45:00	1
42	1	login	10	Ежедневный вход в систему	2025-06-15 09:30:00	1
43	1	profile_update	25	Обновление профиля	2025-06-15 12:00:00	3
44	1	login	10	Вход в систему сегодня	2025-06-25 16:36:10.95683	1
45	1	profile_update	25	Обновление профиля сегодня	2025-06-25 18:06:10.95683	3
8127	1	login	10	Вход в систему	2025-08-05 19:18:59.080653	\N
8128	1	first_login_today	15	Первый вход за день	2025-08-05 19:18:59.234542	\N
8129	2	login	10	Вход в систему	2025-08-05 19:20:30.622981	\N
8130	2	first_login_today	15	Первый вход за день	2025-08-05 19:20:30.744047	\N
8037	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-06-30 18:23:21.296047	\N
8131	2	login	10	Пользователь Елена вошел в систему	2025-08-05 19:29:08.999271	\N
8132	2	late_login	30	🦉 Вход в систему в 22:29 - заработано достижение "Сова"	2025-08-05 19:29:11.260231	\N
8133	2	streak_update	0	Серия входов: 3 дней подряд	2025-08-05 19:29:15.7836	\N
8134	1	login	10	Вход в систему	2025-08-05 19:32:42.176943	\N
8038	1	profile_update	25	Профиль обновлен: Михаил Полшков, CEO	2025-06-30 18:31:58.737614	\N
8135	2	login	10	Вход в систему	2025-08-05 19:33:22.931042	\N
8136	2	benefit_added	0	\N	2025-08-05 19:38:07.258138	\N
8137	2	benefit_added	0	\N	2025-08-05 19:38:12.580281	\N
8138	2	login	10	Вход в систему	2025-08-05 19:48:14.184695	\N
8039	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 13:19:15.267132	\N
8139	3	login	10	Вход в систему	2025-08-05 20:01:59.599192	\N
8140	3	first_login_today	15	Первый вход за день	2025-08-05 20:01:59.719872	\N
8141	3	benefit_added	0	\N	2025-08-05 20:02:37.59421	\N
8142	3	benefit_added	0	\N	2025-08-05 20:02:42.394967	\N
8143	3	login	10	Вход в систему	2025-08-05 20:11:10.530044	\N
8040	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 15:38:13.686087	\N
8144	3	benefit_added	0	\N	2025-08-05 20:13:24.143766	\N
8145	3	benefit_added	0	\N	2025-08-05 20:13:28.963506	\N
8041	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 16:06:12.96609	\N
8146	3	login	10	Вход в систему	2025-08-06 16:48:54.854638	\N
8147	3	first_login_today	15	Первый вход за день	2025-08-06 16:48:54.999847	\N
8042	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 16:22:18.125432	\N
8148	1	login	10	Вход в систему	2025-08-06 20:57:48.350112	\N
8149	1	first_login_today	15	Первый вход за день	2025-08-06 20:57:48.490906	\N
8150	3	login	10	Вход в систему	2025-08-06 21:02:02.850721	\N
8043	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 16:28:18.407718	\N
8151	3	login	10	Пользователь Андрей вошел в систему	2025-08-06 21:41:54.884895	\N
8152	3	late_login	30	🦉 Вход в систему в 0:41 - заработано достижение "Сова"	2025-08-06 21:41:57.264036	\N
8153	3	streak_update	0	Серия входов: 3 дней подряд	2025-08-06 21:42:02.292933	\N
8044	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 16:37:07.20601	\N
8154	1	login	10	Вход в систему	2025-08-07 18:04:51.016198	\N
8155	1	first_login_today	15	Первый вход за день	2025-08-07 18:04:51.167899	\N
8045	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 16:43:14.596275	\N
8156	1	login	10	Вход в систему	2025-08-07 18:23:18.155639	\N
8157	1	login	10	Вход в систему	2025-08-07 19:35:14.426817	\N
8046	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 17:07:39.929122	\N
8158	1	login	10	Вход в систему	2025-08-07 22:07:11.874807	\N
8047	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 17:17:52.610119	\N
8159	1	login	10	Вход в систему	2025-08-07 22:59:27.122068	\N
8048	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 17:27:34.323469	\N
8161	1	login	10	Вход в систему	2025-08-08 19:28:18.443517	\N
8049	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-01 17:35:22.27969	\N
8162	1	login	10	Вход в систему	2025-08-08 19:34:13.880418	\N
8050	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-02 17:35:56.735652	\N
8051	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 15:05:24.052818	\N
8052	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 15:19:10.101067	\N
8053	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 15:19:11.400187	\N
8054	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 15:25:13.281435	\N
8055	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 15:37:21.089784	\N
8056	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 15:41:19.770337	\N
8057	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 15:46:31.179422	\N
8058	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 16:08:38.390468	\N
8059	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 17:20:06.033276	\N
8060	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 17:39:49.944943	\N
8061	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 17:43:57.706828	\N
8062	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 17:59:26.164808	\N
8063	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 18:05:59.207757	\N
8064	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-03 18:13:08.32553	\N
8065	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-04 11:06:58.558924	\N
8066	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-04 11:06:59.347328	\N
8067	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 15:15:55.478784	\N
8068	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 15:23:19.679304	\N
8069	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 15:23:20.723991	\N
8070	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 15:38:10.879694	\N
8071	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 15:45:40.330906	\N
8072	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 15:54:18.009495	\N
8073	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 16:03:16.426563	\N
8074	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 16:13:31.667982	\N
8075	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 16:21:10.029405	\N
8076	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 18:00:03.211794	\N
8077	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 18:42:58.821985	\N
8078	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 18:48:13.24834	\N
8079	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:13:10.094037	\N
8080	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:21:43.481858	\N
8081	1	late_login	30	🦉 Вход в систему в 23:21 - заработано достижение "Сова"	2025-07-07 20:21:45.134017	\N
8082	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:30:48.503004	\N
8083	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:30:50.036093	\N
8084	1	late_login	30	🦉 Вход в систему в 23:30 - заработано достижение "Сова"	2025-07-07 20:30:50.23259	\N
8085	1	late_login	30	🦉 Вход в систему в 23:30 - заработано достижение "Сова"	2025-07-07 20:30:51.70644	\N
8086	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:30:54.163664	\N
8087	1	late_login	30	🦉 Вход в систему в 23:30 - заработано достижение "Сова"	2025-07-07 20:30:55.881956	\N
8088	1	streak_update	0	Серия входов: 3 дней подряд	2025-07-07 20:31:01.177435	\N
8089	1	profile_update	25	Профиль обновлен: Михаил Полшков, CEO (100% заполнения)	2025-07-07 20:31:25.900728	\N
8090	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:32:49.659169	\N
8091	1	late_login	30	🦉 Вход в систему в 23:32 - заработано достижение "Сова"	2025-07-07 20:32:51.313078	\N
8092	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:41:47.480071	\N
8093	1	late_login	30	🦉 Вход в систему в 23:41 - заработано достижение "Сова"	2025-07-07 20:41:49.173225	\N
8094	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:41:55.73787	\N
8095	1	late_login	30	🦉 Вход в систему в 23:41 - заработано достижение "Сова"	2025-07-07 20:41:57.425978	\N
8096	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:56:21.41636	\N
8097	1	late_login	30	🦉 Вход в систему в 23:56 - заработано достижение "Сова"	2025-07-07 20:56:23.198074	\N
8098	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-07 20:57:28.382233	\N
8099	1	late_login	30	🦉 Вход в систему в 23:57 - заработано достижение "Сова"	2025-07-07 20:57:30.154003	\N
8100	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-08 15:43:11.587077	\N
8101	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-08 16:43:49.835962	\N
8102	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-08 17:25:04.366144	\N
8103	1	streak_update	0	Серия входов: 3 дней подряд	2025-07-08 17:25:08.63564	\N
8104	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-08 18:26:18.88394	\N
8105	1	streak_update	0	Серия входов: 3 дней подряд	2025-07-08 18:26:23.767665	\N
8106	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-08 18:30:28.862997	\N
8107	1	streak_update	0	Серия входов: 3 дней подряд	2025-07-08 18:30:33.798685	\N
8108	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-08 19:12:23.765299	\N
8109	1	late_login	30	🦉 Вход в систему в 22:12 - заработано достижение "Сова"	2025-07-08 19:12:25.682033	\N
8110	1	streak_update	0	Серия входов: 3 дней подряд	2025-07-08 19:12:30.529349	\N
8111	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-09 02:07:13.941102	\N
8112	1	late_login	30	🦉 Вход в систему в 5:07 - заработано достижение "Сова"	2025-07-09 02:07:16.242043	\N
8113	1	streak_update	0	Серия входов: 4 дней подряд	2025-07-09 02:07:20.632925	\N
8114	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-10 16:06:26.891081	\N
8115	1	streak_update	0	Серия входов: 5 дней подряд	2025-07-10 16:06:31.770819	\N
8116	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-11 15:02:35.392718	\N
8117	1	streak_update	0	Серия входов: 6 дней подряд	2025-07-11 15:02:39.950659	\N
8118	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-13 00:15:43.643994	\N
8119	1	late_login	30	🦉 Вход в систему в 3:15 - заработано достижение "Сова"	2025-07-13 00:15:45.500447	\N
8120	1	weekend_activity	40	⚔️ Активность в выходной день - заработано достижение "Воин выходных"	2025-07-13 00:15:47.247549	\N
8121	1	login	10	Пользователь Михаил Полшков вошел в систему	2025-07-28 21:19:05.29229	\N
8122	1	late_login	30	🦉 Вход в систему в 0:19 - заработано достижение "Сова"	2025-07-28 21:19:07.113367	\N
8123	2	login	10	Вход в систему	2025-08-04 22:13:09.162512	\N
8124	2	early_bird	30	🌅 Ранний пташка	2025-08-04 22:13:10.682445	\N
8126	2	login	10	Вход в систему	2025-08-04 22:13:12.231527	\N
8165	1	login	10	Вход в систему	2025-08-11 04:19:50.619442	\N
8167	1	first_login_today	15	Первый вход за день	2025-08-13 21:30:32.951336	\N
8169	1	login	10	Вход в систему	2025-08-16 19:24:39.234969	\N
8170	1	first_login_today	15	Первый вход за день	2025-08-20 18:44:43.501749	\N
8172	2	login	10	Вход в систему	2025-08-27 17:12:43.916366	\N
8174	3	daily_mood_report	25	\N	2025-08-21 18:00:00	\N
8175	3	daily_activity_report	30	\N	2025-08-21 18:00:00	\N
8176	3	task_completed	15	\N	2025-08-21 10:30:00	\N
8177	3	meeting_attended	20	\N	2025-08-21 14:00:00	\N
8178	3	daily_mood_report	25	\N	2025-08-22 17:30:00	\N
8179	3	daily_activity_report	30	\N	2025-08-22 17:30:00	\N
8180	3	project_milestone	25	\N	2025-08-22 11:00:00	\N
8181	3	code_review	15	\N	2025-08-22 15:30:00	\N
8182	3	daily_mood_report	25	\N	2025-08-23 18:15:00	\N
8183	3	daily_activity_report	30	\N	2025-08-23 18:15:00	\N
8184	3	bug_fix	20	\N	2025-08-23 13:45:00	\N
8185	3	documentation	10	\N	2025-08-23 16:20:00	\N
8186	3	daily_mood_report	25	\N	2025-08-24 17:45:00	\N
8187	3	daily_activity_report	30	\N	2025-08-24 17:45:00	\N
8188	3	team_collaboration	18	\N	2025-08-24 10:15:00	\N
8189	3	learning_session	22	\N	2025-08-24 14:30:00	\N
8190	3	daily_mood_report	25	\N	2025-08-25 17:00:00	\N
8191	3	daily_activity_report	30	\N	2025-08-25 17:00:00	\N
8192	3	deployment	30	\N	2025-08-25 11:45:00	\N
8193	3	testing	15	\N	2025-08-25 15:00:00	\N
8194	3	first_login_today	15	Первый вход за день	2025-08-27 17:27:19.300508	\N
8197	1	login	10	Вход в систему	2025-08-30 18:14:32.52946	\N
8199	1	first_login_today	15	Первый вход за день	2025-09-08 15:42:25.76336	\N
8201	1	login	10	Вход в систему	2025-09-09 22:01:10.375253	\N
8202	1	first_login_today	15	Первый вход за день	2025-10-23 07:52:15.055611	\N
\.


--
-- Data for Name: activity_types; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.activity_types (id, action_code, name, description, xp_reward, icon, category, is_active, created_at) FROM stdin;
1	login	Вход в систему	Ежедневный вход в платформу	10	🔐	system	t	2025-06-30 17:03:01.722144
2	first_login_today	Первый вход за день	Бонус за первый вход в течение дня	15	🌅	system	t	2025-06-30 17:03:01.722144
3	profile_update	Обновление профиля	Изменение данных профиля	25	👤	user	t	2025-06-30 17:03:01.722144
4	avatar_upload	Загрузка аватара	Добавление фотографии профиля	30	📸	user	t	2025-06-30 17:03:01.722144
5	benefit_added	Добавление льготы	Подключение новой льготы	50	🎁	user	t	2025-06-30 17:03:01.722144
6	benefit_used	Использование льготы	Применение активированной льготы	25	✨	user	t	2025-06-30 17:03:01.722144
7	preferences_test	Тест предпочтений	Прохождение теста для получения рекомендаций	75	📋	user	t	2025-06-30 17:03:01.722144
8	recommendations_received	Получение рекомендаций	Система выдала персональные рекомендации	20	🎯	system	t	2025-06-30 17:03:01.722144
9	progress_view	Просмотр прогресса	Открытие страницы аналитики	5	📊	user	t	2025-06-30 17:03:01.722144
10	level_up	Повышение уровня	Достижение нового уровня	100	⬆️	achievement	t	2025-06-30 17:03:01.722144
11	streak_milestone	Серия входов	Достижение серии ежедневных входов	50	🔥	achievement	t	2025-06-30 17:03:01.722144
12	mood_check	Проверка настроения	Ежедневная оценка настроения, энергии и стресса	15	heart	productivity	t	2025-08-25 15:37:55.047551
13	activity_log	Логирование активности	Запись выполненной активности с деталями	25	activity	productivity	t	2025-08-25 15:37:55.047551
14	productivity_review	Обзор продуктивности	Анализ недельной продуктивности	50	bar-chart-3	productivity	t	2025-08-25 15:37:55.047551
15	ai_consultation	AI консультация	Получение персональных рекомендаций от AI	30	brain	productivity	t	2025-08-25 15:37:55.047551
16	wellness_activity	Wellness активность	Выполнение wellness активности	40	leaf	wellness	t	2025-08-25 15:37:55.047551
17	daily_mood_report	Ежедневный отчет настроения	Отчет настроения, энергии и стресса за день	25	heart	productivity	t	2025-08-27 17:02:17.873658
18	daily_activity_report	Отчет активности	Отчет о выполненных задачах и активностях за день	30	check-square	productivity	t	2025-08-27 17:02:17.873658
\.


--
-- Data for Name: ai_feedback; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.ai_feedback (id, user_id, benefit_id, label, context, created_at) FROM stdin;
1	1	1	useful	{"reason": "", "source": "preferences_page", "variant": "static_test", "timestamp": "2025-09-08T16:44:14.891Z"}	2025-09-08 16:44:14.894914+00
2	1	2	useful	{"reason": "", "source": "preferences_page", "variant": "static_test", "timestamp": "2025-09-08T16:44:25.834Z"}	2025-09-08 16:44:25.835869+00
3	1	3	useful	{"reason": "", "source": "preferences_page", "variant": "static_test", "timestamp": "2025-09-08T16:44:28.378Z"}	2025-09-08 16:44:28.379871+00
4	1	4	useful	{"reason": "", "source": "preferences_page", "variant": "static_test", "timestamp": "2025-09-08T16:48:31.763Z"}	2025-09-08 16:48:31.765242+00
5	1	21	useful	{"reason": "", "source": "preferences_page", "variant": "static_test", "timestamp": "2025-09-08T17:02:23.394Z"}	2025-09-08 17:02:23.398715+00
6	1	5	useful	{"reason": "test", "source": "test", "timestamp": "2025-09-08T17:21:51.942Z"}	2025-09-08 17:21:51.944774+00
7	1	8	useful	{"reason": "", "source": "preferences_page", "variant": "static_test", "timestamp": "2025-09-08T17:37:31.329Z"}	2025-09-08 17:37:31.331717+00
8	1	10	useful	{"reason": "", "source": "preferences_page", "variant": "static_test", "timestamp": "2025-09-30T11:54:13.604Z"}	2025-09-30 11:54:13.605517+00
\.


--
-- Data for Name: ai_insights; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.ai_insights (id, user_id, type, content, metadata, created_at, read_at) FROM stdin;
1	1	mood_analysis	Ваше настроение сегодня отличное (8/10)! Вы завершили важный проект и занимались спортом, что положительно влияет на ваше состояние. Уровень стресса низкий (2/10), что говорит о хорошем балансе работы и отдыха. Рекомендую продолжать в том же духе и не забывать про физическую активность.	{"mood": 8, "activities": ["работа", "спорт"], "stressLevel": 2}	2025-08-17 19:03:25.305167+00	\N
2	1	weekly_insight	За неделю вы показали отличную динамику! Ваше настроение стабильно высокое (среднее 7.1/10), с пиками в выходные дни. Вы активно занимаетесь спортом, что помогает снижать стресс. На работе есть как успехи, так и сложности - это нормально. Рекомендую продолжать спортивные тренировки и планировать сложные задачи на начало недели.	{"weekEnd": "2024-12-20", "weekStart": "2024-12-14", "dataPoints": 21}	2025-08-16 19:03:25.305167+00	\N
3	1	activity_review	Ваша активность "Завершение проекта" была очень успешной! Вы потратили 3 часа и достигли результата. Это показывает вашу целеустремленность и навыки управления временем. Продолжайте в том же духе!	{"success": true, "activity": "Завершение проекта", "duration": 180}	2025-08-15 19:03:25.305167+00	\N
4	1	mood_analysis	Здравствуйте! Проанализировав предоставленную информацию, я сделал следующие выводы:\n\n1. Краткий анализ: У пользователя отличное настроение, низкий уровень стресса и продуктивный день на работе. Это говорит о том, что пользователь находится в хорошем эмоциональном состоянии и успешно справляется с повседневными задачами.\n\n2. Рекомендации:\n   a) Продолжайте заниматься спортом, это помогает поддерживать физическое и ментальное здоровье.\n   b) Уделите время для отдыха и восстановления, чтобы избежать выгорания.\n   c) Постарайтесь поддерживать это положительное настроение, например, через общение с близкими или занятия любимыми хобби.\n\n3. Прогноз на завтра: Судя по вашему текущему состоянии, я полагаю, что и завтра у вас будет отличный день. Продолжайте поддерживать баланс между работой и отдыхом, и вы сможете сохранить высокий уровень продуктивности и хорошее самочувствие.\n\nЖелаю вам дальнейших успехов и отличного настроения! Если у вас возникнут какие-либо другие вопросы, не стесняйтесь обращаться.	{}	2025-08-17 21:11:54.044+00	\N
5	1	mood_analysis	Здравствуйте! Давайте вместе проанализируем ваше текущее состояние и дадим рекомендации для поддержания вашего хорошего настроения.\n\n1. Краткий анализ:\n   Ваше настроение на высоком уровне (8/10), вы успешно завершили важный проект на работе, что говорит о высокой продуктивности и удовлетворенности. Уровень стресса низкий (2/10), что свидетельствует о хорошем самочувствии и способности справляться с нагрузками.\n\n2. Рекомендации:\n   a) Продолжайте практиковать спорт, это отличный способ поддержания физического и эмоционального благополучия.\n   b) Уделяйте время на отдых и расслабление, чтобы восстановить силы. Например, займитесь любимым хобби или проведите время с близкими.\n   c) Закрепите успех проекта, отпразднуйте достижение с коллегами или друзьями. Это поможет сохранить положительный настрой.\n\n3. Прогноз на завтра:\n   Учитывая ваше отличное настроение, низкий уровень стресса и успешное завершение проекта, я предполагаю, что завтрашний день также сложится позитивно. Продолжайте поддерживать здоровый баланс между работой и отдыхом, и вы сможете сохранить высокую продуктивность и хорошее самочувствие.\n\nЖелаю вам дальнейших успехов и приятного дня! Если у вас возникнут дополнительные вопросы, не ст	{}	2025-08-17 21:12:15.74+00	\N
306	1	weekly_insight	Слушай, смотрю на твою неделю и знаешь что? Иногда такие "нулевые" недели - это именно то, что нужно! Может, ты как раз набираешься сил или обдумываешь что-то важное. У всех бывают такие периоды, и это абсолютно нормально. Давай эту неделю сделаем особенной - попробуй каждый день делать хотя бы одну маленькую штуку, которая тебя радует. Даже самую простую! Уверен, у тебя всё получится, ты же знаешь, я в тебя верю! 🤗	{"weekStart": "2025-08-17T00:00:00.000Z", "dataPoints": 24, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-20 20:53:40.581+00	\N
324	1	weekly_insight	<answer>\nПривет, дорогой друг! Смотрю на твою неделю и вижу, что она была довольно спокойной - иногда такие периоды нужны, чтобы перевести дух и набраться сил. Здорово, что ты следишь за своими достижениями, даже когда кажется, что особых успехов нет. Знаешь, может быть, стоит попробовать внести в следующую неделю что-то новенькое? Даже маленькое приятное дело, например, начать утро с любимой музыки или сделать небольшую прогулку - и настроение сразу станет лучше! \n</answer>	{"weekStart": "2025-08-24T00:00:00.000Z", "dataPoints": 45, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-27 14:25:47.494+00	\N
8	1	mood_analysis	Здравствуйте! Я проанализировал предоставленную информацию и готов поделиться своими выводами.\n\n1. Краткий анализ:\nВаше настроение в целом хорошее, уровень стресса умеренный. Однако, недостаточно информации об ваших повседневных активностях и заметках, чтобы составить полную картину.\n\n2. 3 конкретные рекомендации:\n1) Попробуйте заняться какой-нибудь творческой активностью, например, рисование, лепка или игра на музыкальном инструменте. Это может помочь снизить уровень стресса и повысить общее самочувствие.\n2) Уделите немного времени на физическую активность, даже если это будет простая прогулка на свежем воздухе. Движение помогает улучшить настроение и самооценку.\n3) Найдите время для общения с близкими людьми. Социальные связи являются важным фактором для эмоционального благополучия.\n\n3. Прогноз на завтра:\nУчитывая ваше текущее состояние, можно предположить, что завтра ваше настроение будет оставаться в пределах 8-9 баллов. Однако, рекомендую попробовать реализовать хотя бы одну из предложенных активностей, чтобы закрепить положительные тенденции.\n\nНадеюсь, эти рекомендации окажутся полезными для вас. Желаю вам приятного дня и дальнейшего улучшения самочувствия!	{}	2025-08-20 18:53:30.081+00	\N
9	1	mood_analysis	Понимаю, что у вас сегодня было неплохое настроение, 7 из 10, с небольшим уровнем стресса - 3 из 10. Это отличные показатели! Очевидно, что у вас были какие-то успешные достижения, о которых вы упомянули в заметках. Это замечательно!\n\nВот несколько конкретных рекомендаций, которые могут помочь вам сохранить это позитивное настроение:\n\n1. Продолжайте фиксировать свои ежедневные успехи и достижения. Это поможет вам сосредоточиться на положительных моментах и повысить самооценку.\n\n2. Найдите время для занятий, которые приносят вам радость и расслабление, например, прогулки на свежем воздухе, занятия спортом или творческие увлечения.\n\n3. Окружите себя поддерживающими людьми, с которыми вы можете поделиться своими мыслями и эмоциями. Социальные связи очень важны для нашего благополучия.\n\nЧто касается прогноза на завтра, я уверен, что если вы продолжите следовать этим рекомендациям, ваше настроение и общее состояние будут оставаться на таком же высоком уровне или даже улучшатся. Желаю вам продуктивного и позитивного дня!	{}	2025-08-20 18:54:16.774+00	\N
325	1	weekly_insight	<answer>\nПривет, дорогой друг! Смотрю на твою неделю и вижу, что она была, возможно, непростой или ты был очень занят другими важными делами. Знаешь, иногда такие периоды "паузы" очень полезны - они дают возможность перезагрузиться и подумать о том, что действительно важно. Ты молодец, что остаёшься честным в своих достижениях. Может, на следующей неделе попробуем начать с чего-то совсем простого и приятного? Выбери одно маленькое дело, которое тебе по душе, и начни с него. 🌟\n</answer>	{"weekStart": "2025-08-24T00:00:00.000Z", "dataPoints": 45, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-27 14:25:48.53+00	\N
326	1	weekly_insight	<answer>\nПривет, дорогой! Вижу, что эта неделя была довольно спокойной, без особых взлетов и падений - и знаешь, иногда такие периоды нам очень нужны! Это отличное время, чтобы перевести дух и подумать о том, чего действительно хочется. Мне нравится, как ты держишься в своем ритме, не гонясь за какими-то сверхдостижениями. Давай на следующей неделе попробуем добавить что-то новенькое - может, маленькое хобби или приятный ритуал, который будет радовать тебя каждый день?\n</answer>	{"weekStart": "2025-08-24T00:00:00.000Z", "dataPoints": 45, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-27 14:25:49.109+00	\N
327	1	weekly_insight	<answer>\nПривет, дорогой друг! Смотрю на твою неделю и вижу, что она была, возможно, не самой активной или ты просто забыл записывать свои достижения. Но знаешь что? Иногда такие "тихие" периоды нужны нам для перезагрузки и обдумывания новых целей. Здорово, что ты продолжаешь следить за своим прогрессом - это уже показывает твое стремление к развитию! Давай в следующую неделю начнем записывать даже маленькие победы - уверен, их будет намного больше, чем кажется. Обнимаю! 	{"weekStart": "2025-08-24T00:00:00.000Z", "dataPoints": 45, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-27 14:25:49.635+00	\N
11	1	mood_analysis	Дорогой друг, спасибо, что поделился своими данными со мной. Я с радостью проанализирую твое текущее состояние и дам несколько полезных рекомендаций.\n\n1. Краткий анализ:\nТвое сегодняшнее настроение довольно хорошее - 7/10. Ты отлично выступил с презентацией, получил признание от коллектива и даже похвалу от начальника. Уровень стресса находится на довольно низком уровне - 3/10, что является отличным показателем.\n\n2. Рекомендации:\nа) Продолжай в том же духе! Твой успех сегодня - это отличная мотивация двигаться вперед. Не забывай отмечать свои достижения и получать удовольствие от работы.\nб) Поддерживай здоровый баланс между работой и личной жизнью. Регулярно делай перерывы, занимайся спортом или хобби, которые помогают расслабиться.\nв) Будь благодарен за все хорошее, что у тебя есть. Практикуй ежедневную благодарность - это поможет укрепить позитивный настрой.\n\n3. Прогноз на завтра:\nИсходя из твоего сегодняшнего успеха и низкого уровня стресса, я предполагаю, что завтрашний день будет также продуктивным и приятным для тебя. Продолжай в том же темпе, и впереди тебя ждет еще больше интересных возможностей и достижений!\n\nЖелаю тебе отличного дня и дальнейших успехов!	{}	2025-08-20 18:55:11.36+00	\N
307	1	mood_analysis	<emotional_reaction>\nКак здорово, что у тебя был успешный день! 🎉 Я так рада слышать о твоих достижениях, это всегда вдохновляет!\n</emotional_reaction>\n\n<situation_analysis>\nТвоё хорошее настроение и низкий уровень стресса говорят о том, что ты прекрасно справляешься с делами. Успехи всегда придают нам сил и уверенности в себе!\n</situation_analysis>\n\n<advice>\n• Сегодня стоит отпраздновать этот успех - даже маленькое приятное вознаграждение себе будет кстати\n• Запиши свои достижения в дневник - это поможет сохранить позитивный настрой\n• На завтра запланируй что-то приятное, чтобы продлить череду хороших событий\n</advice>\n\n<forecast>\nУверена, что этот успех - только начало прекрасной полосы в твоей жизни! Продолжай двигаться в том же духе, у тебя всё отлично получается! ✨\n</forecast>	{}	2025-08-20 21:00:49.736+00	\N
328	1	mood_analysis	Let me first analyze the input provided, but I notice the template markers ({{MOOD}}, {{ACTIVITIES}}, etc.) are empty. Without specific user input to analyze, I cannot conduct a meaningful situation assessment or generate a personalized response. \n\nTo proceed, I would need actual information about:\n1. The user's current mood\n2. Activities they've been engaged in\n3. Any notes or specific concerns\n4. Their stress level\n\nCould you please provide the actual user input replacing the template markers? Once I have this information, I can:\n1. Conduct a thorough situation assessment\n2. Generate a culturally appropriate response in Russian\n3. Include relevant metaphors and emotional support\n4. Structure the response according to the given format\n\nWould you like to provide the specific user input for me to analyze?	{}	2025-08-27 16:07:04.552+00	\N
14	1	trends_analysis	📊 ОБЩИЕ ТРЕНДЫ\n\nАнализируя данные пользователя за 7 дней, мы можем заметить, что настроение, стресс и количество активностей остаются неизменными на протяжении всего периода. Во всех записях указано "N/A/10" для настроения и стресса, а количество активностей составляет 0. Это свидетельствует об отсутствии существенных изменений в этих показателях.\n\n🔍 ВЫЯВЛЕННЫЕ ПАТТЕРНЫ\n\n- Паттерн 1: Постоянство. На протяжении всех 7 дней настроение, стресс и активность пользователя остаются неизменными, что может указывать на отсутствие значительных изменений в его повседневной жизни.\n\n- Паттерн 2: Отсутствие данных. Для большинства дней указано "N/A/10" для настроения и стресса, что не позволяет сделать выводы об их динамике. Также не предоставлено информации о том, чем занимался пользователь в эти дни.\n\n- Паттерн 3: Пропуски в данных. В представленной информации отсутствуют данные за три дня: понедельник, вторник и четверг. Это ограничивает возможности для полноценного анализа тенденций.\n\n📈 ПРОГНОЗ И РЕКОМЕНДАЦИИ\n\nОсновываясь на имеющихся данных, сложно с уверенностью прогнозировать, что ожидать в ближайшие дни. Отсутствие информации о настроении, стрессе и активностях пользователя не позволяет выявить четкие тенденции.\n\nДля получения более достоверных	{}	2025-08-20 18:59:57.839+00	\N
332	1	mood_analysis	Let me analyze this situation and help structure an appropriate response.\n\n<situation_assessment>\nI notice this is an empty template without actual user input to analyze. Without specific details about the user's mood, activities, notes, or stress level, I cannot perform a meaningful assessment of their situation or generate targeted advice.\n\nHowever, I understand I should:\n1. Create a template response showcasing the structure\n2. Demonstrate how emotional support would be provided\n3. Keep cultural relevance in mind\n4. Maintain appropriate tone and length\n</situation_assessment>\n\nSince there's no actual user input to respond to, I'll provide a template response in Russian that shows the structure while remaining generic:\n\n😊 Спасибо, что поделились своими мыслями. Я вижу, что вы внимательно относитесь к своему эмоциональному состоянию.\n\nКак море меняет свой характер с каждой волной, так и наши чувства находятся в постоянном движении. Что, по-вашему, больше всего влияет на ваше настроение?\n\nПредлагаю начать вести дневник эмоций, уделять больше времени любимым занятиям и практиковать короткие медитации перед сном.\n\nВерю, что каждый новый день приносит новые возможности. Как говорится, утро вечера мудренее. Вы справитесь!	{}	2025-08-30 18:13:45.209+00	\N
352	1	mood_analysis	I apologize, but I don't see any actual user input in the template you provided. The placeholders {{NOTES}}, {{MOOD}}, {{ACTIVITIES}}, and {{STRESS_LEVEL}} are empty. Without specific user input, I cannot provide a meaningful personalized response.\n\nTo help you, I would need:\n1. Some notes or text from the user\n2. Their current mood\n3. Activities they've been doing\n4. Their stress level\n\nOnce you provide this information, I can analyze it and create a thoughtful, culturally appropriate response in Russian following all the guidelines you've outlined.\n\nWould you please share the actual user input so I can assist more effectively?	{}	2025-09-04 15:33:30.592+00	\N
308	1	mood_analysis	<emotional_reaction>\nКак здорово, что ты делишься своими успехами! 🎉 Я вижу, что у тебя отличное настроение и низкий уровень стресса - это прекрасное сочетание!\n</emotional_reaction>\n\n<situation_analysis>\nСудя по твоим показателям, день складывается очень удачно. Хорошее настроение и минимальный стресс создают отличную основу для новых достижений. Это именно то состояние, которое стоит отмечать и поддерживать!\n</situation_analysis>\n\n<advice>\n1. Запиши свой успех в дневник достижений - это поможет сохранить приятные воспоминания\n2. Поделись своей радостью с близкими - позитивные эмоции становятся сильнее, когда ими делишься\n3. Составь план на завтра, используя сегодняшний позитивный настрой\n</advice>\n\n<forecast>\nУверена, что этот успех - только начало череды приятных событий! Ты на правильном пути, продолжай в том же духе! ✨\n</forecast>	{}	2025-08-22 18:30:54.236+00	\N
329	1	mood_analysis	<situation_assessment>\nInput appears to be empty or missing, as all placeholder values ({{MOOD}}, {{ACTIVITIES}}, {{NOTES}}, {{STRESS_LEVEL}}) are unfilled. Without specific user input to analyze, I'll provide a general supportive response that:\n1. Acknowledges the importance of sharing feelings\n2. Encourages self-reflection\n3. Offers gentle universal guidance\n4. Maintains an optimistic outlook\nUsing 🤗 as a welcoming emoji\n</situation_assessment>\n\n🤗 Спасибо, что делитесь своими мыслями и чувствами. Каждый шаг к самопознанию очень важен.\n\nИногда даже простое осознание своих эмоций помогает лучше понять себя. Что бы вы хотели узнать о себе в первую очередь?\n\nПопробуйте вести дневник настроения, уделять время любимым занятиям и чаще прислушиваться к своим желаниям. Начните с малого - каждый день по чуть-чуть.\n\nКак весенний цветок пробивается сквозь снег, так и вы найдёте свой путь. Верю в вашу внутреннюю силу.	{}	2025-08-27 18:22:00.854+00	\N
333	1	mood_analysis	I notice the input fields appear to be empty templates. Without specific user input to analyze (mood, activities, notes, and stress level), I cannot generate a properly tailored response. However, I can demonstrate how I would structure a response with sample content:\n\n<situation_assessment>\nSince I don't have actual user input to assess, I'll note that in a real scenario, I would carefully analyze all provided information according to the outlined steps to create a personalized response that addresses specific emotional needs and cultural context.\n</situation_assessment>\n\n💫 Я вижу, как вы стараетесь справиться с ситуацией. Ваша искренность и открытость очень важны для процесса исцеления.\n\nКак морозное утро постепенно уступает теплому дню, так и трудные моменты проходят. Что, по-вашему, могло бы принести больше света в вашу повседневную жизнь?\n\nПредлагаю начать день с небольшой прогулки, уделить время любимому хобби, и записывать свои мысли в дневник. Это поможет лучше понять себя и свои чувства.\n\nВерю, что впереди вас ждёт много хороших моментов. Как говорится, утро вечера мудренее - завтра многое может выглядеть совсем иначе.	{}	2025-08-30 18:14:17.517+00	\N
19	1	mood_analysis	🎯 АНАЛИЗ НАСТРОЕНИЯ\nПо представленной информации, ваше настроение сегодня находится на уровне 7/10, что является достаточно хорошим показателем. Вы отмечаете успешное выполнение многих задач, но также сообщаете об опоздании на важное совещание, что, вероятно, несколько омрачило общее впечатление. Уровень стресса в 3/10 говорит о том, что вы справляетесь с ситуацией достаточно эффективно.\n\n💡 ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ\n1. Отметьте сегодняшние успехи и подумайте, как использовать этот позитивный опыт для повышения мотивации в дальнейшем. Уделите время на самоанализ и составьте краткий план действий по улучшению личной продуктивности.\n2. Практикуйте простые техники управления стрессом, такие как медитация, глубокое дыхание или короткие физические упражнения. Это поможет вам сохранять спокойствие и более эффективно решать возникающие задачи.\n3. Составьте подробный план на завтрашний день, включив в него как важные встречи и мероприятия, так и время для отдыха и восстановления. Это позволит вам чувствовать себя более организованным и уверенным в своих действиях.\n\n🔮 ПРОГНОЗ НА ЗАВТРА\nНесмотря на небольшой неприятный инцидент с опозданием, ваше общее хорошее настроение и способность управлять стрессом свидетельствуют о том, что завтрашний день будет проду	{}	2025-08-20 19:01:15.914+00	\N
353	1	mood_analysis	I apologize, but I don't see the actual user input in the template provided. The placeholders {{NOTES}}, {{MOOD}}, {{ACTIVITIES}}, and {{STRESS_LEVEL}} are empty. Could you please provide the specific user input you'd like me to analyze and respond to? Once you share the actual content, I can:\n\n1. Analyze the emotional state\n2. Consider the Russian cultural context\n3. Create a personalized 4-paragraph response in Russian\n4. Include appropriate metaphors and support\n\nPlease share the user's specific situation and I'll provide a thoughtful, culturally-appropriate response following all the guidelines you've outlined.	{}	2025-09-04 15:34:12.312+00	\N
309	1	mood_analysis	<emotional_reaction>\nОго, вижу отличное настроение и низкий уровень стресса! 🎉 Расскажи подробнее о своём успехе - я уже готова радоваться вместе с тобой! \n</emotional_reaction>\n\n<situation_analysis>\nСудя по показателям, день складывается очень удачно! Хорошее настроение и низкий стресс - это прекрасное сочетание для продуктивности и позитивных эмоций.\n</situation_analysis>\n\n<advice>\n• Обязательно отпразднуй свой успех - позволь себе что-то приятное\n• Поделись радостью с близкими - положительные эмоции становятся сильнее, когда ими делишься\n• Запиши свои достижения в дневник - это поможет сохранить позитивный настрой надолго\n</advice>\n\n<forecast>\nУверена, это только начало череды твоих побед! Такой настрой и энергия обязательно приведут к новым достижениям. Продолжай в том же духе! ✨\n</forecast>	{}	2025-08-22 18:36:46.98+00	\N
330	1	mood_analysis	Let me help structure a response to demonstrate the format, even though no specific input was provided in the template (the variables appear empty).\n\n<situation_assessment>\nGiven the empty input, I'll provide a general positive supportive response that:\n- Maintains a warm, encouraging tone\n- Uses nature imagery (spring renewal)\n- Includes a Russian proverb about new beginnings\n- Uses 😊 emoji for general positivity\n- Focuses on self-reflection and growth\n- Provides general but actionable advice\n- Ends with optimistic support\n</situation_assessment>\n\n😊 Рада снова с вами общаться! Как весенний ветерок приносит перемены, так и каждый новый день дарит возможности для роста.\n\nВ любой ситуации важно помнить народную мудрость: "Утро вечера мудренее". Что для вас сейчас самое важное в этот период перемен?\n\nПредлагаю начать с малых шагов, уделить время любимому делу, и обязательно найти момент для отдыха. Как росток пробивается к солнцу, так и мы растём через трудности.\n\nВерю, что впереди вас ждут светлые моменты. Вы сильнее, чем кажется, и у вас всё обязательно получится!	{}	2025-08-27 18:24:00.307+00	\N
334	1	mood_analysis	I notice the input template but no actual user content to analyze. Without specific user input (mood, activities, notes, and stress level), I cannot provide a properly tailored response. However, I can demonstrate how I would structure a general supportive response in Russian:\n\n<situation_assessment>\nSince there's no specific input to analyze, I'll create a generic supportive response that:\n- Uses a neutral-positive emoji (😊)\n- Keeps tone warm and encouraging\n- Includes a Russian proverb\n- Uses nature-based metaphor\n- Maintains appropriate length and structure\n</situation_assessment>\n\n😊 Рад снова встретиться с вами. Как говорится, "Утро вечера мудренее" - иногда нужно просто сделать паузу и набраться сил.\n\nКаждый день приносит новые возможности, как весенние ручьи, пробивающие путь сквозь снег. Что для вас сейчас самое важное?\n\nПредлагаю начать с маленьких шагов: уделите время себе, прислушайтесь к своим желаниям, и составьте простой план на завтра.\n\nУверен, что вы справитесь со всеми задачами. Как молодой росток пробивается к солнцу, так и вы найдёте свой путь к успеху.	{}	2025-08-30 18:14:48.267+00	\N
354	1	activity_analysis	🌟 ВПЕЧАТЛЯЮЩЕ!\n\nТы отлично поработал над своим развитием, целый час активного обучения - это серьезный вклад в свой профессиональный рост!\n\n🚀 ЧТО ДАЛЬШЕ:\nПредлагаю закрепить полученные знания на практике и поделиться опытом с коллегами. Это поможет лучше усвоить материал и вдохновить других на развитие. Продолжай в том же духе, ты на верном пути! 💫	{}	2025-09-04 15:34:54.774+00	\N
310	1	mood_analysis	I apologize, but I notice the input template contains empty placeholders ({{MOOD}}, {{ACTIVITIES}}, etc.). Without specific user input about their mood, activities, notes, and stress level, I cannot provide a properly tailored response. \n\nCould you please provide the actual user input with their:\n- Current mood\n- Activities they've been doing\n- Any specific notes or concerns\n- Stress level\n\nOnce you share those details, I can analyze the situation and provide a thoughtful, culturally appropriate response in Russian that addresses their specific circumstances and emotional state.	{}	2025-08-22 18:54:53.175+00	\N
25	1	mood_analysis	🎯 АНАЛИЗ СОСТОЯНИЯ\nВаше эмоциональное состояние находится в нормальном диапазоне, но ряд событий вызывает некоторое внутреннее напряжение. Вероятно, вы испытываете чувство разочарования и неудовлетворенности собой в связи с неудачными планами. Это может быть вызвано как внешними факторами, так и самокритичностью. Важно принять и осознать этот эмоциональный фон, чтобы направить энергию на решение возникших проблем.\n\n💡 КОНКРЕТНЫЕ ДЕЙСТВИЯ\n1. Сегодня отведите время на спокойную рефлексию и диалог с собой. Выявите истинные причины напряжения и запишите их, чтобы лучше понять ситуацию.\n2. Попробуйте технику дыхательных упражнений - это поможет снизить стресс и взглянуть на проблемы под другим углом.\n3. Составьте список небольших, но конкретных шагов, которые вы можете предпринять завтра для разрешения текущих трудностей. Начните с простого и постепенно движитесь к более сложным задачам.\n\n🔮 ПРОГНОЗ\nВыявленные вами внутренние конфликты и способность к рефлексии свидетельствуют о вашей зрелости и стремлении к самосовершенствованию. Если вы последовательно будете решать возникающие проблемы, то сможете преодолеть период разочарований и вернуть ощущение внутренней гармонии.	{}	2025-08-20 19:05:22.668+00	\N
331	1	mood_analysis	<situation_assessment>\nSince no specific user input was provided in the template (all placeholders are empty), I cannot perform a detailed situation assessment. However, I can demonstrate how I would structure a general supportive response that could later be customized with specific details.\n\nI'll create a gentle, encouraging response that focuses on general wellbeing and self-reflection, using Russian cultural elements and maintaining a warm, supportive tone.\n</situation_assessment>\n\n💫 Как здорово, что вы нашли время поделиться своими мыслями и чувствами. Каждый шаг к самопознанию — это маленькая победа.\n\nЗнаете, иногда жизнь похожа на русскую берёзу: гибкая, но крепкая, умеет прогибаться под ветром, но никогда не ломается. Что для вас сейчас самое важное?\n\nПредлагаю начать утро с небольшой прогулки, уделить время любимому делу и записывать свои мысли в дневник. Как капли росы питают траву, так и забота о себе питает душу.\n\nВерю, что каждый новый день приносит новые возможности. Вы сильнее, чем думаете, и мудрее, чем представляете.	{}	2025-08-27 18:24:46.639+00	\N
335	1	mood_analysis	I apologize, but I notice the input template contains empty placeholders ({{MOOD}}, {{ACTIVITIES}}, etc.). Without specific user input to analyze, I cannot generate a meaningful personalized response. \n\nCould you please provide the actual user input with:\n- Their current mood\n- Activities they've been doing\n- Any notes or concerns they've shared\n- Their stress level\n\nOnce you share the real input, I can conduct a proper analysis and create a thoughtful, culturally appropriate response in Russian that addresses their specific situation.	{}	2025-08-30 18:15:13.154+00	\N
355	1	mood_analysis	<emotional_analysis>\n1. Quotes: "потренировался и поиграл теперь иду работать"\n2. Activities: exercise, play/recreation, work\n3. Mood: 7/10 - positive, energetic; Stress: 3/10 - manageable\n4. Activities show good balance of exercise, leisure, and productivity\n5. Russian context: "В здоровом теле - здоровый дух"\n6. Emoji: 💪 (fits exercise and productivity theme)\n7. User demonstrates good activity balance and energy management\n8. Question about energy distribution\n9. Advice: maintain rhythm, include rest, stay hydrated\n10. Forecast: productive day ahead\n11. Metaphors: "как весенний ручей" (energetic flow), "как молодая берёзка" (flexibility)\n12. No specific tool calls needed\n</emotional_analysis>\n\nОтлично начинаешь день, как весенний ручей - бодро и энергично! 💪\n\nИнтересно наблюдать, как ты гармонично сочетаешь тренировку, игру и работу. Как ты чувствуешь, какая активность даёт тебе больше энергии?\n\nСтарайся сохранять этот прекрасный ритм дня, но не забывай делать небольшие передышки между делами. Держи под рукой бутылочку воды, это поможет поддержать энергию.\n\nУверена, такой сбалансированный подход принесёт отличные результаты, как	{}	2025-09-04 15:38:53.704+00	\N
357	1	weekly_insight	Привет, дорогой друг! Смотрю на твою неделю и вижу, что она была, возможно, непростой или очень занятой - такое бывает со всеми нами! Но знаешь, иногда "нулевые" недели дают нам шанс остановиться и подумать о том, что действительно важно. Ты молодец, что продолжаешь отслеживать свой прогресс - это уже показывает твое стремление к развитию. Давай сделаем следующую неделю более яркой? Предлагаю начать с чего-то простого и приятного - например, уделить хотя бы полчаса в день	{"weekStart": "2025-09-07T00:00:00.000Z", "dataPoints": 15, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-09-08 15:42:39.058+00	\N
358	1	weekly_insight	Привет, дорогой друг! Смотрю на твою неделю и вижу, что она была, возможно, непростой или очень занятой. Знаешь, иногда такие периоды нужны, чтобы перезагрузиться и набраться сил. Здорово, что ты следишь за своими достижениями - это уже показывает твое стремление к развитию! Давай сделаем следующую неделю немного ярче? Предлагаю начать с чего-то маленького, но приятного - например, уделить полчаса в день любимому хобби. Уверен, это зарядит тебя позитивной энергией!	{"weekStart": "2025-09-07T00:00:00.000Z", "dataPoints": 15, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-09-08 15:42:39.117+00	\N
311	1	mood_analysis	I apologize, but I notice the input template contains empty placeholders ({{MOOD}}, {{ACTIVITIES}}, etc.). To provide a meaningful, personalized response, I would need the actual content of the user's:\n\n- Current mood\n- Activities they've done\n- Any notes or concerns they've shared \n- Their stress level\n\nCould you please provide the specific user input so I can conduct a proper situation assessment and craft an appropriate response in Russian that addresses their unique circumstances?\n\nOnce you share the actual input, I'll analyze it carefully and provide a culturally-sensitive, empathetic response following the structured format you've outlined, complete with relevant Russian idioms, metaphors, and practical advice tailored to their situation.	{}	2025-08-22 19:01:29.043+00	\N
336	1	mood_analysis	<situation_assessment>\n- Mood is quite positive (7/10) with low stress (3/10)\n- User mentions success but doesn't specify details\n- Daily mood check indicates regular emotional monitoring\n- Opportunity to reinforce positive momentum\n- Success theme suggests using growth-oriented metaphors\n- Can reference Russian proverb "Дорогу осилит идущий" (The path yields to one who walks it)\n- Will use 🎉 to celebrate success\n- Focus on building on positive achievement\n</situation_assessment>\n\n🎉 Как здорово, что день принёс успех! Такие моменты - как первые весенние цветы, они наполняют нас энергией и радостью.\n\nУспех, каким бы маленьким он ни казался, всегда прокладывает путь к новым достижениям. Что для вас значит этот успех, какие двери он может открыть?\n\nПредлагаю записать сегодняшнее достижение в дневник побед, поделиться радостью с близкими и использовать эту позитивную энергию для постановки новой цели.\n\nУверена, это только начало вашего успешного пути. Как говорится, "Дорогу осилит идущий" - и вы уже уверенно шагаете вперёд!	{}	2025-08-30 18:34:33.089+00	\N
356	1	mood_analysis	Поздравляю с завершением проекта! 🎉 Как распустившийся весенний цветок, твоя работа раскрылась во всей красе.\n\nКаждый выполненный проект - это новая покорённая вершина. Что нового ты узнал о себе в процессе работы?\n\nОтметь это достижение любимым способом, сохрани самые важные заметки и выводы, дай себе день отдыха перед новыми свершениями.\n\nПусть этот успех станет трамплином для будущих достижений - ты показал, на что способен!	{}	2025-09-04 15:45:49.165+00	\N
31	1	mood_analysis	🎯 АНАЛИЗ СОСТОЯНИЯ\nВаше эмоциональное состояние демонстрирует позитивный настрой и личностный рост. Успешная командная работа и завершение задач свидетельствуют о продуктивности и вовлеченности. Однако невысокий уровень внутреннего напряжения указывает на необходимость более глубокой интроспекции и заботы о себе.\n\n💡 КОНКРЕТНЫЕ ДЕЙСТВИЯ\n1. Уделите время самоанализу, чтобы выявить подсознательные триггеры, которые могут скрываться за низким внутренним напряжением.\n2. Практикуйте простые техники релаксации, такие как дыхательные упражнения или медитация, для снижения стресса.\n3. Запланируйте встречу или активность с коллегой, чтобы укрепить дружеские связи и поддержку.\n\n🔮 ПРОГНОЗ\nВаше позитивное отношение и умение находить успех в повседневных делах станут ключом к дальнейшему личностному росту. Регулярная практика самоанализа и заботы о себе поможет снизить внутреннее напряжение и повысить общий уровень благополучия.	{}	2025-08-20 19:08:12.798+00	\N
359	1	weekly_insight	Привет, дорогой друг! Смотрю на твою неделю и вижу, что она была, возможно, непростой или ты был сильно занят другими важными делами. Знаешь, иногда такие периоды нужны, чтобы перезагрузиться и набраться сил. Ты молодец, что продолжаешь отслеживать свои результаты - это говорит о твоей осознанности и желании развиваться. Давай попробуем на следующей неделе начать с чего-то совсем простого и приятного - например, сделать один маленький шаг к своей цели каждый день?	{"weekStart": "2025-09-07T00:00:00.000Z", "dataPoints": 15, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-09-08 15:42:39.546+00	\N
360	1	weekly_insight	Привет, дорогой друг! Смотрю на твою неделю и вижу, что она была довольно спокойной - иногда такие периоды очень нужны, чтобы перезагрузиться и набраться сил. Здорово, что ты не гонишься за очками и даешь себе время просто быть. Знаешь, что я думаю? Может, на следующей неделе попробуем добавить что-то новенькое в твой день - например, короткую прогулку или любимое хобби? Уверен, это подарит тебе приятные эмоции и энергию! 🌟	{"weekStart": "2025-09-07T00:00:00.000Z", "dataPoints": 15, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-09-08 15:42:39.693+00	\N
312	1	mood_analysis	I apologize, but I notice that the input template contains empty placeholders ({{MOOD}}, {{ACTIVITIES}}, etc.). Without actual user input to analyze, I cannot generate a meaningful personalized response. \n\nTo provide an appropriate response in Russian, I would need:\n1. The user's current mood\n2. Activities they've been engaged in\n3. Any notes or concerns they've shared\n4. Their stress level\n\nCould you please provide the actual user input so I can craft a thoughtful, culturally appropriate response in Russian that addresses their specific situation?	{}	2025-08-22 19:11:59.035+00	\N
337	1	mood_analysis	<situation_assessment>\n- Mood is high (7/10) with low stress (3/10), indicating success and achievement\n- Key accomplishment: successful presentation to 500 people after preparation\n- Physical activity (training) combined with professional success\n- Shows self-improvement and public speaking achievement\n- Cultural context: public speaking viewed as significant professional milestone in Russia\n- Appropriate emoji: 🎉 (celebration of achievement)\n- Notable confidence boost warranting reinforcement\n- Can draw parallel with stage performers or athletes before big events\n- Opportunity to build on this success for future growth\n</situation_assessment>\n\n🎉 Какой великолепный успех! Выступить перед такой большой аудиторией - это как покорить свою личную вершину Эльбруса.\n\nТы показал, что подготовка и тренировка дают потрясающие результаты. Как думаешь, что именно в твоей подготовке сыграло ключевую роль в этом успехе?\n\nСохрани эту энергию победителя, запиши свои ощущения и методы подготовки - они пригодятся в будущем. Используй этот опыт как трамплин для новых достижений. Поделись успехом с близкими.\n\nУверен, это только начало твоих больших побед. Ты как артист, который блестяще отыграл премьеру - теперь каждое выступление будет всё увереннее и ярче.	{}	2025-08-30 18:35:04.263+00	\N
361	1	weekly_insight	Привет, дорогой друг! Смотрю на твою неделю и вижу, что она была, возможно, непростой или ты был сильно занят другими важными делами. Знаешь, иногда такие периоды "перезагрузки" очень полезны - они дают возможность остановиться, подумать и набраться сил. Мне нравится твоя честность в отслеживании активности. Может, на следующей неделе попробуем начать с чего-то совсем простого и приятного? Например, поставь себе маленькую цель, которая будет радовать - любимая игра или новое хобби.	{"weekStart": "2025-09-07T00:00:00.000Z", "dataPoints": 15, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-09-08 15:42:39.721+00	\N
362	1	weekly_insight	Привет, дорогой друг! Смотрю на твою неделю и вижу, что она была, возможно, не самой активной в плане достижений, но знаешь - иногда такие периоды нужны, чтобы перезагрузиться и набраться сил. Здорово, что ты продолжаешь отслеживать свой прогресс - это говорит о твоей осознанности и желании развиваться. Давай на следующей неделе начнем с чего-то простого и приятного - может, поставишь себе одну маленькую цель, которая будет радовать? Уверен, у тебя всё получится!	{"weekStart": "2025-09-07T00:00:00.000Z", "dataPoints": 15, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-09-08 15:42:40.493+00	\N
313	1	mood_analysis	<situation_assessment>\nThe user's mood is quite positive (7/10) with low stress (3/10) and mentions success, though details aren't provided. This presents an opportunity to celebrate while encouraging reflection on the achievement. The combination suggests a positive experience worth exploring deeper. Will use 🎉 to celebrate their success.\n\nKey themes: achievement, positive emotions, low stress\nCultural context: Russian value of personal accomplishments and modesty\nApproach: Celebratory but grounded, encouraging deeper reflection\n</situation_assessment>\n\n🎉 Как здорово слышать о твоём успехе! Такие моменты, как лучи весеннего солнца, согревают душу и дарят энергию.\n\nУспех часто приходит как результат наших усилий и подготовки. Что, по-твоему, помогло тебе достичь этой победы? Иногда маленькие шаги ведут к большим свершениям.\n\nПредлагаю записать ключевые моменты этого успеха, поделиться радостью с близкими и использовать этот позитивный опыт как трамплин для будущих достижений.\n\nПусть этот успех станет первой ласточкой в череде твоих будущих побед. Ты на правильном пути, и это только начало твоего расцвета.	{}	2025-08-22 19:13:33.872+00	\N
338	1	activity_analysis	🎉 ОТЛИЧНО!\n\nЗавершение проекта по ИИ - это серьезное достижение, которое требует глубоких знаний и упорства! Ты прекрасно справился с этой сложной задачей.\n\n🚀 ЧТО ДАЛЬШЕ:\nИспользуй полученный опыт для новых проектов в сфере ИИ. Подумай о возможности поделиться своими знаниями с коллегами или написать статью о результатах. Такие проекты отлично дополнят твое портфолио!	{}	2025-08-30 18:35:46.854+00	\N
363	1	mood_analysis	Молодец, что уделяешь время своему телу! 💪 Как закаленная сталь становится крепче, так и ты с каждой тренировкой.\n\nИнтересно наблюдать, как физическая активность влияет на общее настроение и энергию. Что нового ты заметил в себе после сегодняшней тренировки?\n\nОбязательно дай мышцам отдохнуть и восстановиться. Веди дневник тренировок, отмечая свои достижения. Прислушивайся к своему телу и не забывай про правильное питание.\n\nТы на верном пути к своим целям, и каждая тренировка – это еще один шаг к лучшей версии себя.	{}	2025-09-11 10:33:12.064+00	\N
364	1	mood_analysis	Вижу, что день проходит продуктивно! 💪 Учёба и работа над проектом - это всегда путь к росту.\n\nЗнаешь, каждый проект - как мозаика, что постепенно складывается в красивую картину. А какой элемент этой мозаики кажется тебе самым интересным?\n\nПопробуй разделить оставшуюся работу на небольшие части, отмечай каждое достижение, и не забывай делать короткие перерывы - как глоток свежего воздуха для мыслей.\n\nУверена, твой	{}	2025-09-19 15:44:33.368+00	\N
365	1	mood_analysis	Ура! 🎉 Какой замечательный день - ты как птица, расправившая крылья после важного полёта!\n\nУспешная защита проекта - это не просто достижение, а важная веха твоего роста. Что для тебя было самым ценным в этом опыте?\n\nПозволь себе насладиться моментом успеха, сохрани презентацию как памятный трофей, и не забудь поделиться радостью с близкими - такие моменты особенно прекрасны, когда их разделяешь с другими.\n\nКак молодая берёзка тянется к солнцу, так и твои достижения открывают путь к новым вершинам - это только начало твоего яркого	{}	2025-09-30 11:55:48.347+00	\N
314	1	mood_analysis	<situation_assessment>\nBased on the high mood (7/10) and low stress (3/10), the user seems to be in a positive state and wants to share a success. The incomplete sentence "Сегодня у меня был успех:" suggests anticipation of sharing good news. This is an opportunity to reinforce positive emotions and encourage reflection on achievements. Will use 🎉 to celebrate their success.\n\nKey focus:\n- Celebrate achievement\n- Encourage deeper reflection\n- Maintain positive momentum\n- Connect to Russian cultural value of perseverance\n</situation_assessment>\n\n🎉 Как здорово, что у вас сегодня был успех! Даже маленькие победы освещают наш путь, словно первые весенние лучи солнца.\n\nУспех - как распускающийся цветок, каждый его лепесток имеет свою историю. Что именно в этом достижении вызывает у вас особую гордость?\n\nПредлагаю записать это достижение в дневник побед, поделиться радостью с близкими, и использовать этот позитивный настрой как трамплин для новых свершений.\n\nУверена, это только начало вашей череды успехов. Как говорится, "Дорогу осилит идущий" - и вы уже на верном пути! 	{}	2025-08-22 19:14:36.988+00	\N
339	1	mood_analysis	I apologize, but I don't see the actual user input in your request - the placeholders {{NOTES}}, {{MOOD}}, {{ACTIVITIES}}, and {{STRESS_LEVEL}} are empty. Without specific user information, I cannot provide a personalized analysis and response.\n\nTo provide a meaningful response, I would need:\n1. The user's notes/situation description\n2. Their current mood\n3. Activities they've been doing\n4. Their stress level\n\nCould you please provide the actual user input, and I'll generate a thoughtful, culturally appropriate response following all the specified guidelines?	{}	2025-08-30 18:46:41.044+00	\N
315	1	mood_analysis	<situation_assessment>\n- Mood is quite good (7/10) with low stress (3/10)\n- User is watching "The Sopranos" and working on programming tasks\n- Activities seem balanced between leisure and productivity\n- User appears to be in a flow state, transitioning smoothly between tasks\n- Tone is casual and positive\n- Programming tasks completion suggests goal-oriented behavior\n- Cultural context: Watching American series is popular in Russia\n- Emoji choice: 😊 (reflecting positive, balanced mood)\n- Metaphor potential: Flow like a river, programming as puzzle-solving\n</situation_assessment>\n\n😊 Приятно видеть, как ты гармонично сочетаешь отдых и работу! "Сопрано" - отличный выбор для перезагрузки мозга.\n\nТвой плавный переход от сериала к программированию напоминает течение реки - спокойное и уверенное. Интересно, замечаешь ли ты, как такой баланс влияет на твою продуктивность?\n\nПопробуй сохранять этот ритм, делая короткие перерывы между задачами. Используй энергию от просмотра сериала как творческое топливо. Может, стоит создать плейлист для работы?\n\nУверен, твой подход к организации дня принесёт отличные результаты. Как говорится, "тише едешь - дальше будешь"!	{}	2025-08-22 19:21:12.074+00	\N
45	1	mood_analysis	🎯 АНАЛИЗ СОСТОЯНИЯ\nВаше эмоциональное состояние свидетельствует о глубоком внутреннем напряжении, вызванном недовольством собой и неудачами на работе. Критика начальника, вероятно, обострила ваши сомнения в собственной компетентности и способности справляться с задачами. Это, в свою очередь, повлекло за собой снижение самооценки и веры в себя, что мешает вам эффективно действовать.\n\n💡 КОНКРЕТНЫЕ ДЕЙСТВИЯ\n1. Сегодня выделите время для самоанализа и принятия произошедшего. Напишите в дневнике о своих чувствах и мыслях, чтобы снизить эмоциональное напряжение.\n2. Используйте техники глубокого дыхания и медитации, чтобы расслабиться и восстановить ресурсы. Это поможет вам лучше справляться со стрессом.\n3. Завтра поговорите с начальником, чтобы прояснить ситуацию и получить конструктивную обратную связь. Это позволит вам скорректировать свои действия и восстановить уверенность в себе.\n\n🔮 ПРОГНОЗ\nЕсли вы последуете этим рекомендациям, то сможете постепенно восстановить эмоциональное равновесие, укрепить веру в свои силы и вернуться к эффективной работе. Это, в свою очередь, поможет вам справиться с текущими трудностями и двигаться вперед.	{}	2025-08-20 19:12:14.871+00	\N
340	1	mood_analysis	<emotional_analysis>\n1. Quote: "рассказал презу и закрыл проект" - indicates professional achievement\n2. Activities: daily_mood_check\n3. Mood: 7/10 (positive), Stress: 3/10 (low-moderate)\n4. User shows accomplishment and relief\n5. Cultural context: Russian work culture values project completion\n6. Emoji choice: 🎉 (celebration appropriate)\n7. Analysis: Successful project completion, positive professional milestone\n8. Question focus: Future growth opportunities\n9. Advice: celebration, documentation, team recognition\n10. Forecast: Professional growth momentum\n11. Metaphors: "как первый весенний цветок", "птица после долгого полета"\n12. No specific tool calls needed\n</emotional_analysis>\n\nПоздравляю с важной победой! 🎉 Как первый весенний цветок пробивается сквозь снег, так и ты достиг этой значимой вершины.\n\nВ такие моменты особенно важно осознать пройденный путь. Что в этом проекте оказалось самым ценным для твоего профессионального роста?\n\nПредлагаю сделать паузу и отметить успех с командой, сохранить ключевые моменты проекта в своем дневнике и дать себе день на восстановление сил.\n\nЭтот успех - как птица, расправляющая крылья перед новым полётом. Уверен, впереди тебя ждут ещё более интересные про	{}	2025-08-30 18:48:59.999+00	\N
316	1	mood_analysis	<situation_assessment>\n- Mood is extremely high (10/10) with very low stress (2/10)\n- Key event: Successful presentation and promise of promotion\n- Strong positive emotions expressed through multiple exclamation marks\n- Professional achievement context is significant in Russian culture\n- Success calls for celebration but also humility\n- Can use metaphor of "взлет как сокол" (soaring like a falcon)\n- Cultural value of hard work paying off\n- Should acknowledge achievement while encouraging continued growth\n- Emoji: 🎉 (celebration appropriate for major achievement)\n</situation_assessment>\n\n🎉 Какой замечательный день! Как говорится, "По труду и награда" - ваш профессионализм заслуженно оценили.\n\nВы сейчас как сокол на взлёте - уверенно расправили крылья и набираете высоту. Интересно, как вы представляете свой следующий профессиональный горизонт?\n\nПредлагаю: отметьте этот успех с близкими, запишите свои сильные стороны, проявившиеся на презентации, и начните продумывать план развития на новой позиции.\n\nУверен, это только начало вашего профессионального роста. Впереди ещё много ярких достижений и побед!	{}	2025-08-22 19:31:21.668+00	\N
341	1	mood_analysis	Какой замечательный день! 🎉 Ты как первый весенний цветок, пробившийся сквозь снег - смело и уверенно.\n\nТвой успех сегодня - это не просто удача, а результат подготовки и таланта. Интересно, какие новые горизонты теперь открываются перед тобой?\n\nЗапиши свои сильные моменты презентации, отметь реакцию слушателей, подумай о развитии затронутых тем. Сохрани эту энергию успеха.\n\nКак молодая берёзка тянется к солнцу, так и твой профессиональный путь ведёт к новым высотам.	{}	2025-08-30 18:56:47.936+00	\N
317	1	mood_analysis	<situation_assessment>\n- Mood is very high (9/10), stress low (2/10)\n- Key achievement: successful presentation and promised promotion\n- Professional success is the main theme\n- Opportunity to use Russian success-related phrases\n- Choosing 🎉 for celebration\n- Can reference Russian concepts about career growth\n- Will use metaphor of spring blossoming/growth\n- Need to balance celebration with maintaining momentum\n- Focus on capitalizing on positive momentum\n- Cultural context: Russian value of professional achievement\n</situation_assessment>\n\n🎉 Какой замечательный день! Как весенний цветок, распускается ваша карьера - и это только начало вашего профессионального роста!\n\nВаш успех с презентацией показывает, как хорошо вы умеете раскрывать свой потенциал. Интересно, как вы представляете свой следующий профессиональный шаг?\n\nПредлагаю записать все ключевые моменты презентации, пока впечатления свежие. Подготовьте список целей на новой должности. И обязательно отметьте это достижение с близкими!\n\nУверена, это начало яркого периода в вашей карьере. Как говорится, "дорогу осилит идущий" - и вы уже на правильном пути!	{}	2025-08-22 19:34:15.668+00	\N
342	1	mood_analysis	Здорово, что ты заботишься о своём теле! 💪 Как молодой дубок набирается сил, так и ты растёшь над собой.\n\nТренировка - это не просто движение, а диалог с самим собой. Что нового ты узнал о себе во время сегодняшней тренировки?\n\nПопробуй записывать свои достижения в дневник, чередуй нагрузку с отдыхом, и прислушивайся к сигналам своего тела. Начни с малого, и постепенно усложняй задачи.\n\nПусть каждая тренировка делает тебя сильнее не только телом, но и духом. Ты на верном пути!	{}	2025-08-30 18:57:29.582+00	\N
318	1	activity_analysis	<response>\n💪 ТАК ДЕРЖАТЬ!\n\nТвоя тренировка сегодня - это отличный пример того, как спорт заряжает энергией и настраивает на продуктивный день! Особенно радует твой позитивный настрой на работу после пробежки.\n\n🚀 ЧТО ДАЛЬШЕ:\nПопробуй добавить к пробежкам простые упражнения на растяжку - это поможет восстановиться быстрее и сделает тренировки еще	{}	2025-08-22 20:36:10.261+00	\N
343	1	mood_analysis	Здорово, что ты заряжен энергией после игры! 💪 Как пружина, готовая распрямиться в нужном направлении.\n\nИнтересно наблюдать, как ты переключаешься с отдыха на работу, словно опытный штурман меняет курс корабля. Как думаешь, может быть, азарт от игры поможет тебе также ярко проявить себя в работе?\n\nПопробуй использовать эту волну энергии для быстрого старта, раздели рабочие задачи на короткие "раунды", делай небольшие перерывы для поддержания концентрации.\n\nУверен	{}	2025-08-30 18:58:07.451+00	\N
319	1	activity_analysis	<response>\n💪 ТАК ДЕРЖАТЬ!\n\nПрекрасное решение начать день с тренировки - это зарядит тебя энергией на весь рабочий день!\n\n🚀 ЧТО ДАЛЬШЕ:\nИспользуй этот прилив сил для самых важных рабочих задач. Сделай короткую разминку между встречами, чтобы поддерживать бодрость. А завтра попробуй повторить этот успешный сценарий - утренняя тренировка твор	{}	2025-08-22 20:40:44.899+00	\N
344	1	mood_analysis	I apologize, but I do not feel comfortable providing advice or analysis for this type of content. I would recommend:\n\n1. Focusing on more constructive personal development goals\n2. Speaking with a qualified mental health professional if needed\n3. Engaging in healthy activities and hobbies\n4. Building meaningful social connections and relationships\n\nWould you like to discuss other aspects of your day or set some positive goals for personal growth?	{}	2025-08-30 18:59:12.216+00	\N
320	1	activity_analysis	<response>\n💪 ТАК ДЕРЖАТЬ!\n\nПотрясающе, что ты начинаешь день с тренировки - это отличный способ зарядиться энергией для продуктивной работы!\n\n🚀 ЧТО ДАЛЬШЕ:\nИспользуй этот прилив энергии и бодрости для важных рабочих задач. Постарайся сохранить баланс между физической активностью и работой - это ключ к высокой продуктивности и хорошему самочувствию весь	{}	2025-08-22 20:43:52.386+00	\N
345	1	mood_analysis	Отлично видеть такой боевой настрой! 💪 Как заряженная пружина, готовая к действию.\n\nПодготовка - это первый шаг к успеху, как утренняя заря перед ярким днём. Интересно, какие новые горизонты ты видишь перед собой?\n\nНачни с малых целей, постепенно наращивая темп. Разделяй большие задачи на небольшие этапы. Не забывай делать паузы для восстановления сил.\n\nТвоя подготовка - как фундамент для будущих достижений. Пусть каждый шаг приближает к намеченной цели.	{}	2025-08-30 19:01:58.937+00	\N
321	1	activity_analysis	💪 ТАК ДЕРЖАТЬ!\n\nСерьезная тренировка и отличный настрой на работу - это именно то, что нужно для продуктивного дня! Физическая активность заряжает энергией и помогает достигать большего.\n\n🚀 ЧТО ДАЛЬШЕ:\nПопробуй разнообразить тренировки новыми упражнениями или добавить элементы растяжки для лучшего восстановления. Регулярные занятия помогут поддерживать бодрость духа и высокую работоспособность!	{}	2025-08-22 20:45:34.674+00	\N
349	1	weekly_insight	<answer>\nПривет, дорогой друг! Смотрю на твою неделю и вижу, что она была, возможно, не самой простой или активной. Но знаешь, иногда такие периоды нужны, чтобы перезагрузиться и набраться сил. Здорово, что ты остаёшься на связи и следишь за своими достижениями - это уже показывает твою осознанность и желание развиваться. Давай попробуем на следующей неделе начать с чего-то маленького, но приятного - например, сделать один шаг к давно откладываемой цели? Уверен, у тебя всё получится! 	{"weekStart": "2025-08-31T00:00:00.000Z", "dataPoints": 22, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-31 13:37:41.895+00	\N
348	1	weekly_insight	<answer>\nПривет, дорогой друг! Смотрю, эта неделя была для тебя, возможно, не самой активной в плане достижений, но знаешь - иногда такие периоды нужны, чтобы перезагрузиться и набраться сил. Здорово, что ты продолжаешь отслеживать свой прогресс - это уже показывает твое стремление к развитию! Давай сделаем следующую неделю немного ярче? Предлагаю начать с чего-то простого и приятного - например, поставь себе одну маленькую цель, которая будет радовать тебя каждый день. Уверен	{"weekStart": "2025-08-31T00:00:00.000Z", "dataPoints": 22, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-31 13:37:41.894+00	\N
346	1	weekly_insight	<answer>\nПривет, дорогой! Смотрю, эта неделя была для тебя, возможно, не самой активной, и знаешь что? Это абсолютно нормально! Иногда нам всем нужно время, чтобы перевести дух и просто побыть в своем ритме. Здорово, что ты честен с собой и ведешь учет своих достижений. Давай сделаем следующую неделю чуть более интересной? Предлагаю начать с чего-то простого и приятного - может, поставишь себе одну маленькую цель, которая будет приносить радость? Уверен, у тебя всё получится	{"weekStart": "2025-08-31T00:00:00.000Z", "dataPoints": 22, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-31 13:37:41.894+00	\N
347	1	weekly_insight	<answer>\nПривет, дорогой! Смотрю на твою неделю и вижу, что она была, возможно, непростой или очень занятой - иногда такие периоды нужны, чтобы перезагрузиться и набраться сил. Мне нравится, что ты следишь за своими достижениями - это уже показывает твое стремление к развитию! Давай сделаем следующую неделю более активной? Предлагаю начать с чего-то простого и приятного - например, поставь себе маленькую цель, которая будет приносить радость. Уверен, у тебя всё получится! 🌟\n</answer>	{"weekStart": "2025-08-31T00:00:00.000Z", "dataPoints": 22, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-31 13:37:41.893+00	\N
350	1	weekly_insight	<answer>\nПривет, дружище! Смотрю на твою неделю и вижу, что она была, возможно, не самой активной в плане достижений, но знаешь - это абсолютно нормально! Иногда нам нужно время, чтобы перезагрузиться и набраться сил. Мне нравится, что ты продолжаешь отслеживать свои результаты - это говорит о твоей осознанности и желании развиваться. Давай попробуем на следующей неделе начать с чего-то простого и приятного - например, поставь себе одну небольшую цель, которая будет приносить радость. Уверен, у	{"weekStart": "2025-08-31T00:00:00.000Z", "dataPoints": 22, "moodEntries": 0, "activityEntries": 0, "gamificationEntries": 1}	2025-08-31 13:37:41.919+00	\N
322	1	activity_analysis	💪 ТАК ДЕРЖАТЬ!\n\nПрекрасное начало дня с полноценной тренировки - это мощный заряд энергии и подготовка к продуктивной работе!\n\n🚀 ЧТО ДАЛЬШЕ:\nИспользуй этот прилив сил для максимальной эффективности в работе. Помни про правильную осанку в течение дня и делай короткие перерывы на разминку. Твоё тело скажет спасибо, а мозг будет работать ещё лучше!	{}	2025-08-22 20:49:47.456+00	\N
351	1	mood_analysis	I apologize, but I don't see any actual user input in the template you provided - the placeholders {{NOTES}}, {{MOOD}}, {{ACTIVITIES}}, and {{STRESS_LEVEL}} are empty. Could you please provide the specific user input you'd like me to analyze and respond to? Once you share the actual content, I can create a personalized response following the detailed structure you've outlined.	{}	2025-08-31 13:39:15.916+00	\N
323	1	activity_analysis	💪 ТАК ДЕРЖАТЬ!\n\nЦелый час продуктивной тренировки - это серьезный вклад в твое профессиональное развитие! Работа над собой всегда окупается.\n\n🚀 ЧТО ДАЛЬШЕ:\nПопробуй записывать ключевые моменты каждой тренировки, чтобы отслеживать прогресс. А для большей эффективности можно чередовать разные форматы - от практических занятий до теоретических обзоров. Ты на верном пути!	{}	2025-08-22 20:51:00.11+00	\N
274	1	mood_analysis	🎯 АНАЛИЗ СОСТОЯНИЯ\nСегодняшний успех на фоне внутреннего напряжения может свидетельствовать о внутреннем конфликте. Ваше эмоциональное состояние находится в нестабильном балансе, что может говорить о сложном периоде адаптации к новым обстоятельствам. Глубокое погружение в ситуацию и признание своих истинных чувств поможет найти источник напряжения и выработать стратегию его конструктивного разрешения.\n\n💡 КОНКРЕТНЫЕ ДЕЙСТВИЯ\n1. Выделите время для медитативной практики, чтобы обрести душевное равновесие.\n2. Используйте техники дыхательной релаксации для снятия мышечного напряжения.\n3. Сформулируйте конкретную цель на завтрашний день, которая поможет вам ощутить прогресс.\n\n🔮 ПРОГНОЗ\nПризнание и проработка внутренних противоречий позволит стабилизировать эмоциональный фон и обрести новые ресурсы для дальнейшего развития. Ваша способность к самоанализу и готовность к позитивным изменениям вселяют уверенность в успешном преодолении сложного периода.	{}	2025-08-20 20:12:42.759+00	\N
286	1	mood_analysis	🎯 АНАЛИЗ СОСТОЯНИЯ\nВаше текущее эмоциональное состояние демонстрирует высокий уровень подъема и энергии, что, вероятно, связано с чувством успеха и достижения поставленных целей. Несмотря на это, сохраняется определенное внутреннее напряжение, которое, возможно, является результатом постоянной самооценки и стремления к идеалу. Этот паттерн может отражать внутреннее давление и потребность в большей самопринятии.\n\n💡 КОНКРЕТНЫЕ ДЕЙСТВИЯ\n1. Сегодня уделите время для осознанной рефлексии и выражения благодарности за достигнутые успехи. Это поможет укрепить чувство удовлетворения и снизить внутреннее напряжение.\n2. Попробуйте практиковать техники mindfulness, например, медитацию или дыхательные упражнения, чтобы научиться лучше справляться со стрессом и культивировать самопринятие.\n3. Завтра выделите время для постановки реалистичных, поэтапных целей, которые будут способствовать поддержанию вашей мотивации и продуктивности без чрезмерных ожиданий.\n\n🔮 ПРОГНОЗ\nЕсли вы последуете этим рекомендациям, то сможете более гармонично интегрировать свои эмоции, повысить самопринятие и укрепить ощущение внутреннего баланса, что поспособствует вашему дальнейшему росту и развитию.	{}	2025-08-20 20:15:00.513+00	\N
295	1	mood_analysis	🎯 АНАЛИЗ СОСТОЯНИЯ\nУспешный опыт сегодняшнего дня говорит о вашей высокой мотивации и продуктивности. Однако низкий уровень внутреннего напряжения может свидетельствовать о накоплении незавершенных дел, которые подспудно тревожат вас. Необходимо отследить эти скрытые источники напряжения, чтобы предотвратить их негативное влияние на эмоциональное благополучие.\n\n💡 КОНКРЕТНЫЕ ДЕЙСТВИЯ\n1. Выделите 15-20 минут на тщательный разбор ключевых задач дня и их текущего статуса. Это поможет выявить любые незавершенные моменты.\n2. Попробуйте практику "осознанного дыхания" - глубокие вдохи и выдохи в течение 5-7 минут. Это эффективный способ снизить напряжение.\n3. Внесите в календарь встречу с собой на завтра, чтобы наметить план действий для завершения накопившихся дел.\n\n🔮 ПРОГНОЗ\nВы находитесь в продуктивном эмоциональном состоянии, которое позволит эффективно завершить текущие задачи. Однако важно проработать скрытые источники напряжения, чтобы поддержать высокую мотивацию в долгосрочной перспективе.	{}	2025-08-20 20:27:01.939+00	\N
297	1	mood_analysis	<emotional_reaction>\nОго, какой замечательный день у тебя! 🎉 Я так рада слышать о твоем успехе и вижу, что настроение на хорошем уровне!\n</emotional_reaction>\n\n<situation_analysis>\nСудя по всему, ты находишься в отличном эмоциональном состоянии, и уровень стресса довольно низкий. Это прекрасная комбинация для продуктивного и позитивного дня!\n</situation_analysis>\n\n<advice>\n• Отпразднуй свой успех - позволь себе что-то приятное сегодня\n• Запиши свои положительные эмоции в дневник - это поможет сохранить этот позитивный настрой\n• Составь план на завтра, используя сегодняшний позитивный импульс\n</advice>\n\n<forecast>\nУверена, что этот успех - только начало череды замечательных событий! Ты на правильном пути, и твой позитивный настрой обязательно притянет ещё больше хорошего. Продолжай в том же духе! ✨\n</forecast>	{}	2025-08-20 20:42:30.84+00	\N
298	1	mood_analysis	<emotional_reaction>\nКак здорово, что у тебя был успех! 🎉 Обожаю такие позитивные моменты, и твоё хорошее настроение очень заразительно! \n</emotional_reaction>\n\n<situation_analysis>\nСудя по твоему настроению и низкому уровню стресса, день сложился очень удачно. Это прекрасный показатель того, что ты двигаешься в правильном направлении!\n</situation_analysis>\n\n<advice>\n1. Обязательно отпразднуй этот успех - даже маленькая награда себе будет кстати!\n2. Запиши этот позитивный опыт в дневник - такие моменты вдохновляют в будущем.\n3. Используй эту победу как трамплин для новых достижений завтра.\n</advice>\n\n<forecast>\nУверен(а), что это только начало твоих побед! Ты на правильном пути, и впереди тебя ждёт ещё больше успехов и радостных моментов. Продолжай в том же духе! ✨\n</forecast>	{}	2025-08-20 20:48:04.783+00	\N
299	1	mood_analysis	<emotional_reaction>\nЯ вижу, что сегодня тебе действительно нелегко, и хочу, чтобы ты знал(а) - я здесь, чтобы поддержать тебя 💪 Высокий уровень стресса и сниженное настроение - это серьёзная нагрузка.\n</emotional_reaction>\n\n<situation_analysis>\nКогда мы чувствуем себя подавленно и напряжённо, кажется, что весь мир давит на плечи. Это абсолютно нормально просить о поддержке, и ты молодец, что делишься своими чувствами.\n</situation_analysis>\n\n<advice>\n• Сделай сегодня что-то приятное для себя: прими тёплую ванну или выпей любимый чай\n• Попробуй технику глубокого дыхания: вдох на четыре счёта, задержка, медленный выдох\n• Запланируй на завтра одно маленькое, но приятное дело, которое поднимет настроение\n</advice>\n\n<forecast>\nПомни, что после самых тёмных туч всегда выглядывает солнце. Ты сильнее, чем кажется, и эти трудности обязательно пройдут. Я верю в тебя! ✨\n</forecast>	{}	2025-08-20 20:51:17.177+00	\N
\.


--
-- Data for Name: ai_metrics; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.ai_metrics (id, user_id, metric_type, metric_value, metric_date, context, created_at) FROM stdin;
1	1	average_mood	7.1000	2025-08-17	{"period": "7_days", "data_points": 21}	2025-08-17 19:03:25.312174+00
2	1	stress_reduction	0.6000	2025-08-17	{"current": 2.0, "baseline": 5.0}	2025-08-17 19:03:25.312174+00
3	1	activity_success_rate	85.7000	2025-08-17	{"total": 7, "successful": 6}	2025-08-17 19:03:25.312174+00
4	1	sport_frequency	3.0000	2025-08-17	{"days": 7, "activities": 3}	2025-08-17 19:03:25.312174+00
\.


--
-- Data for Name: ai_recommendations; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.ai_recommendations (id, user_id, category, message, priority, action_taken, created_at, expires_at) FROM stdin;
1	1	спорт	Продолжайте заниматься спортом 3-4 раза в неделю. Это помогает поддерживать высокое настроение и снижать стресс.	low	f	2025-08-17 19:03:25.30792+00	\N
2	1	работа	Планируйте сложные задачи на начало недели, когда у вас больше энергии. Используйте выходные для отдыха и восстановления.	medium	f	2025-08-17 19:03:25.30792+00	\N
3	1	здоровье	Добавьте медитацию 10-15 минут в день для лучшего управления стрессом.	medium	f	2025-08-16 19:03:25.30792+00	\N
4	1	продуктивность	Ведите дневник достижений. Записывайте 3 успеха каждый день для поддержания мотивации.	low	f	2025-08-15 19:03:25.30792+00	\N
5	1	разработка	Отлично! Вы успешно завершили тестирование AI системы и убедились, что она работает отлично. Это прекрасный результат вашей работы и свидетельство вашего профессионализма. Продолжайте в том же духе, совершенствуйте свои навыки и не бойтесь новых вызовов - ваш профессиональный рост обеспечен!	low	f	2025-08-17 21:11:55.34+00	\N
6	1	разработка	Поздравляю! Тестирование AI системы прошло успешно. Ваша работа показывает, что вы постоянно стремитесь к улучшению и развитию. Продолжайте в том же духе, ваши усилия обязательно окупятся!	low	f	2025-08-17 21:12:16.76+00	\N
7	1	personal_ai	🎯 РЕКОМЕНДАЦИЯ 1: Создайте дневник настроения\n\nЧтобы улучшить осознанность своего эмоционального состояния, я рекомендую вам начать вести дневник настроения. Это простой и эффективный способ отслеживать свои эмоции и выявлять паттерны. Уделяйте 5-10 минут в конце каждого дня, чтобы записать, как вы себя чувствовали, и что повлияло на ваше настроение. Со временем вы сможете увидеть, какие события или привычки улучшают или ухудшают ваше самочувствие. Это поможет вам принимать более осознанные решения и развивать навыки саморегуляции.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Установите здоровые границы \n\nУчитывая, что вы не отмечали уровень стресса, важно обратить внимание на установление здоровых границ. Научитесь говорить "нет", когда вас просят о чем-то, что выходит за рамки ваших возможностей или приоритетов. Поощряйте себя делать перерывы и заниматься любимыми занятиями. Постепенно вы научитесь лучше управлять своим временем и энергией, что снизит уровень стресса и повысит продуктивность.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Составьте план самореализации \n\nТак как у вас пока нет записей об активностях, я предлагаю составить конкретный план достижения ваших целей. Определите 2-3 значимые для вас цели в разных сферах жизни (карьера, здоровье, хобби и т.д.). Разбейте их на конкретные шаги и установите сроки. Ежедневно выделяйте время на выполнение этих шагов. Отмечайте свои успехи, чтобы повышать мотивацию и видеть прогресс.\n\n🎯 Р	high	f	2025-08-20 19:00:07.249+00	\N
8	1	??????	🎯 АНАЛИЗ УСПЕХА\nВаша способность сфокусироваться на задаче и достигнуть результата в отведенное время - ключ к продуктивности. Вы продемонстрировали самодисциплину и умение оставаться на верном пути.\n\n🚀 КОНКРЕТНЫЙ ШАГ\nЗакрепите этот успех, составив список ключевых навыков, которые вам помогли. Регулярно практикуйте их, чтобы развить привычку высокой продуктивности.	low	f	2025-08-20 19:05:38.099+00	\N
9	1	work	🎯 АНАЛИЗ УСПЕХА\nВы успешно реализовали свои навыки продаж, показав уверенность и убедительность в общении с клиентом. Это говорит о том, что ваша подготовка была эффективной и вы умеете находить индивидуальный подход к каждому покупателю.\n\n🚀 КОНКРЕТНЫЙ ШАГ\nЗакрепите этот успех, записав в дневник ключевые моменты, которые помогли вам добиться результата. Это поможет вам повторить эффективные приемы в будущем и отточить навыки продаж еще больше.	low	f	2025-08-20 20:00:52.403+00	\N
10	1	health	🎯 АНАЛИЗ УСПЕХА\nВаша тренировка помогла вам улучшить настроение и самочувствие - это отличный показатель того, что вы движетесь в правильном направлении.\n\n🚀 КОНКРЕТНЫЙ ШАГ\nПродолжайте придерживаться регулярного тренировочного режима, чтобы и дальше укреплять свое физическое и ментальное здоровье. Ключ - в системности и умении наслаждаться самим процессом, а не только конечным результатом.	low	f	2025-08-20 20:24:52.144+00	\N
11	1	learning	<response>\n🎉 ОТЛИЧНО!\n\nКакой замечательный успех в сфере недвижимости! Приятно видеть, как твои усилия приносят такие впечатляющие результаты, особенно когда проект завершается на позитивной ноте!\n\n🚀 ЧТО ДАЛЬШЕ: Пока праздничное настроение на высоте, запиши ключевые моменты успешного совещания - это поможет повторить успех в будущих проектах!\n</response>	low	f	2025-08-20 21:04:14.68+00	\N
12	1	learning	<response>\n🎉 ОТЛИЧНО!\n\nСпорт - это настоящий источник счастья, и ты это прекрасно доказал! Твоя беговая тренировка - отличный пример заботы о себе.\n\n🚀 ЧТО ДАЛЬШЕ: Используй этот позитивный настрой для создания регулярной привычки - запланируй следующую пробежку, пока эндорфины на максимуме!\n</response>	low	f	2025-08-22 19:35:52.638+00	\N
13	1	work	<response>\n🎉 ОТЛИЧНО!\n\nВау, целый час продуктивной работы - это потрясающее достижение! Ты действительно умеешь концентрироваться на важных задачах.\n\n🚀 ЧТО ДАЛЬШЕ: Сделай небольшой перерыв, прогуляйся или выпей чашку любимого напитка, и возвращайся к работе с новыми силами! Твой организм заслужил этот отдых.\n</response>	low	f	2025-08-22 19:55:35.206+00	\N
14	1	work	<response>\n🎉 ОТЛИЧНО!\n\nПотрясающе, что ты уделил целый час тренировке - это серьезный вклад в свое профессиональное развитие!\n\n🚀 ЧТО ДАЛЬШЕ: Запиши свои ключевые инсайты после тренинга и подумай, как применить новые знания уже завтра на работе. Это поможет закрепить результат!\n</response>	low	f	2025-08-22 19:57:21.57+00	\N
15	1	health	<response>\n🎉 ОТЛИЧНО!\n\nВау, какая впечатляющая тренировка! Бег - это отличный выбор для поддержания здоровья и энергии.\n\n🚀 ЧТО ДАЛЬШЕ: Попробуй разнообразить маршрут своих пробежек - это поможет сохранить интерес и мотивацию. Природа, парки или новые улицы сделают каждую тренировку особенной!\n</response>	low	f	2025-08-22 20:20:59.064+00	\N
16	1	work	<response>\n🎉 ОТЛИЧНО!\n\nВпечатляющая тренировка! Физическая активность перед работой - это мощный заряд энергии и продуктивности на весь день.\n\n🚀 ЧТО ДАЛЬШЕ: Попробуй сделать такие тренировки регулярной утренней привычкой - это поможет тебе быть в тонусе и эффективнее справляться с рабочими задачами!\n</response>	low	f	2025-08-22 20:28:08.432+00	\N
17	1	work	<response>\n🎉 ОТЛИЧНО!\n\nПросто супер, что ты совместил тренировку с рабочим днём - это признак настоящего профессионала! Физическая активность заряжает энергией на весь день.\n\n🚀 ЧТО ДАЛЬШЕ: Попробуй сделать такие тренировки регулярной частью твоего рабочего графика - это поможет оставаться продуктивным и энергичным!\n</response>	low	f	2025-08-22 20:28:37.965+00	\N
18	1	work	<response>\n🎉 ОТЛИЧНО!\n\nТы молодец, что совместил тренировку с рабочим днём - это отличный способ оставаться энергичным и продуктивным!\n\n🚀 ЧТО ДАЛЬШЕ: Попробуй сделать такие тренировки регулярной частью рабочего графика - это поможет сохранять бодрость и концентрацию в течение всего дня.\n</response>	low	f	2025-08-22 20:32:23.675+00	\N
19	1	work	<response>\n🎉 ОТЛИЧНО!\n\nФизическая активность перед работой - это мощный заряд энергии и правильный настрой на продуктивный день! Ты молодец, что уделяешь время себе!\n\n🚀 ЧТО ДАЛЬШЕ: Попробуй сделать утреннюю тренировку своей регулярной привычкой - это поможет держать высокую эффективность весь рабочий день!\n</response>	low	f	2025-08-22 20:34:35.519+00	\N
20	1	health	<response>\n💪 ТАК ДЕРЖАТЬ!\n\nТвоя тренировка сегодня - это отличный пример того, как спорт заряжает энергией и настраивает на продуктивный день! Особенно радует твой позитивный настрой на работу после пробежки.\n\n🚀 ЧТО ДАЛЬШЕ:\nПопробуй добавить к пробежкам простые упражнения на растяжку - это поможет восстановиться быстрее и сделает тренировки еще	low	f	2025-08-22 20:36:10.249+00	\N
21	1	work	<response>\n💪 ТАК ДЕРЖАТЬ!\n\nПрекрасное решение начать день с тренировки - это зарядит тебя энергией на весь рабочий день!\n\n🚀 ЧТО ДАЛЬШЕ:\nИспользуй этот прилив сил для самых важных рабочих задач. Сделай короткую разминку между встречами, чтобы поддерживать бодрость. А завтра попробуй повторить этот успешный сценарий - утренняя тренировка твор	low	f	2025-08-22 20:40:44.89+00	\N
22	1	work	<response>\n💪 ТАК ДЕРЖАТЬ!\n\nПотрясающе, что ты начинаешь день с тренировки - это отличный способ зарядиться энергией для продуктивной работы!\n\n🚀 ЧТО ДАЛЬШЕ:\nИспользуй этот прилив энергии и бодрости для важных рабочих задач. Постарайся сохранить баланс между физической активностью и работой - это ключ к высокой продуктивности и хорошему самочувствию весь	low	f	2025-08-22 20:43:52.376+00	\N
23	1	health	💪 ТАК ДЕРЖАТЬ!\n\nСерьезная тренировка и отличный настрой на работу - это именно то, что нужно для продуктивного дня! Физическая активность заряжает энергией и помогает достигать большего.\n\n🚀 ЧТО ДАЛЬШЕ:\nПопробуй разнообразить тренировки новыми упражнениями или добавить элементы растяжки для лучшего восстановления. Регулярные занятия помогут поддерживать бодрость духа и высокую работоспособность!	low	f	2025-08-22 20:45:34.643+00	\N
24	1	health	💪 ТАК ДЕРЖАТЬ!\n\nПрекрасное начало дня с полноценной тренировки - это мощный заряд энергии и подготовка к продуктивной работе!\n\n🚀 ЧТО ДАЛЬШЕ:\nИспользуй этот прилив сил для максимальной эффективности в работе. Помни про правильную осанку в течение дня и делай короткие перерывы на разминку. Твоё тело скажет спасибо, а мозг будет работать ещё лучше!	low	f	2025-08-22 20:49:47.441+00	\N
25	1	work	💪 ТАК ДЕРЖАТЬ!\n\nЦелый час продуктивной тренировки - это серьезный вклад в твое профессиональное развитие! Работа над собой всегда окупается.\n\n🚀 ЧТО ДАЛЬШЕ:\nПопробуй записывать ключевые моменты каждой тренировки, чтобы отслеживать прогресс. А для большей эффективности можно чередовать разные форматы - от практических занятий до теоретических обзоров. Ты на верном пути!	low	f	2025-08-22 20:51:00.061+00	\N
26	1	work	🎉 ОТЛИЧНО!\n\nЗавершение проекта по ИИ - это серьезное достижение, которое требует глубоких знаний и упорства! Ты прекрасно справился с этой сложной задачей.\n\n🚀 ЧТО ДАЛЬШЕ:\nИспользуй полученный опыт для новых проектов в сфере ИИ. Подумай о возможности поделиться своими знаниями с коллегами или написать статью о результатах. Такие проекты отлично дополнят твое портфолио!	medium	f	2025-08-30 18:35:46.839+00	\N
27	1	learning	🌟 ВПЕЧАТЛЯЮЩЕ!\n\nТы отлично поработал над своим развитием, целый час активного обучения - это серьезный вклад в свой профессиональный рост!\n\n🚀 ЧТО ДАЛЬШЕ:\nПредлагаю закрепить полученные знания на практике и поделиться опытом с коллегами. Это поможет лучше усвоить материал и вдохновить других на развитие. Продолжай в том же духе, ты на верном пути! 💫	medium	f	2025-09-04 15:34:54.735+00	\N
28	1	personal_ai	🎯 РЕКОМЕНДАЦИЯ 1: Начни вести дневник настроения\nСогласно предоставленным данным, у тебя пока нет записей о своем настроении. Начать вести дневник настроения - отличный способ лучше понять свое эмоциональное состояние и выявить закономерности. Каждый вечер записывай, как ты себя чувствовал в течение дня по 10-балльной шкале. Также отмечай, что повлияло на твое настроение - важные события, встречи, активности. Через несколько недель ты сможешь увидеть, когда ты чаще всего бываешь в хорошем или плохом расположении духа. Это поможет тебе лучше управлять своими эмоциями и находить способы поддерживать позитивный настрой.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Занимайся регулярными физическими упражнениями\nРегулярная физическая активность отлично помогает справляться со стрессом и повышать общий тонус. Выбери несколько раз в неделю, когда ты будешь уделять 30-60 минут на физические упражнения - это может быть бег, силовая тренировка, йога или просто прогулка. Найди занятие, которое тебе по-настоящему нравится, чтобы это не было в тягость, а приносило удовольствие. Постепенно увеличивай продолжительность и интенсивность тренировок. Ты заметишь, как улучшится твое самочувствие, энергия и настроение.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Используй техники осознанности и медитации\nПрактика осознанности и медитации отлично помогает снизить уровень стресса и тревожности. Выдели хотя бы 10-15 минут в день, чтобы просто посидеть в тишине, сосредоточиться на дыхании и наблюдать за своими мыслями и ощ	high	f	2025-09-08 16:36:45.477+00	\N
29	1	personal_ai	Благодарю вас за подробное описание задачи! С радостью предоставлю вам 5 персонализированных рекомендаций, основанных на предоставленных данных.\n\n🎯 РЕКОМЕНДАЦИЯ 1: Начните вести дневник настроения\nСудя по отсутствию данных о настроении, вам будет полезно начать регулярно фиксировать свое эмоциональное состояние. Ведение дневника поможет вам лучше понять свои эмоциональные паттерны и найти способы управлять стрессом. Начните с простой ежедневной записи - всего пару предложений о том, как вы себя чувствуете. Со временем вы сможете анализировать динамику и замечать связи между событиями и вашим настроением.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Определите приоритетные области для развития\nБез информации об ваших активностях и успешности трудно дать детальные рекомендации. Предлагаю начать с определения ключевых областей, которые требуют вашего внимания. Возможно, это работа, здоровье, отношения или хобби - выберите 2-3 сферы, которые сейчас наиболее важны для вас. Затем сформулируйте конкретные цели в этих областях и составьте план их достижения.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Внедрите практику осознанности\nУчитывая, что у вас пока нет данных об уровне стресса, можно предположить, что вам будет полезно развить навыки осознанности. Попробуйте ежедневно уделять 5-10 минут медитации или другим практикам, которые помогают вам "быть в моменте". Это поможет снизить тревожность, улучшить концентрацию и принятие. Начните с простого дыхательного упражнения или прогулки на природе.\n\n🎯 РЕКОМЕНДАЦИЯ 4: Создайте структуру для достижения	high	f	2025-09-08 16:38:50.753+00	\N
30	1	personal_ai	Спасибо за интересное задание! Основываясь на предоставленных данных, вот 5 персонализированных рекомендаций, которые могут помочь в вашем личном развитии:\n\n🎯 РЕКОМЕНДАЦИЯ 1: Установите режим дня\nВаши данные показывают, что вы еще не ведете учет своих активностей и эмоционального состояния. Это важно, чтобы лучше понять свои паттерны и потребности. Начните с установления простого, но структурированного режима дня. Выделите время для сна, приема пищи, работы и отдыха. Это поможет снизить уровень стресса и повысить продуктивность.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Займитесь физической активностью\nРегулярная физическая активность благотворно влияет не только на физическое, но и на психологическое состояние. Выберите несколько раз в неделю для тренировок, будь то прогулки, йога или силовые упражнения. Это поможет вам лучше справляться со стрессом и повысит вашу работоспособность.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Ведите дневник\nВедение дневника - отличный способ отследить ваши мысли, эмоции и достижения. Начните записывать свое настроение, планы на день и выполненные задачи. Это поможет вам лучше понять свои паттерны и выявить области для улучшения.\n\n🎯 РЕКОМЕНДАЦИЯ 4: Практикуйте тайм-менеджмент\nЭффективное управление временем поможет вам быть более организованным и достигать своих целей. Попробуйте методики вроде "Помидора" или метода Айзенхауэра, чтобы расставить приоритеты и избегать прокрастинации. Это увеличит вашу продуктивность и успешность.\n\n🎯 РЕКОМЕНДАЦИЯ 5: Найдите баланс\nВаж	high	f	2025-09-08 16:39:25.313+00	\N
31	1	personal_ai	Хорошо, давайте вместе создадим персонализированные рекомендации, основываясь на доступных данных пользователя.\n\n🎯 РЕКОМЕНДАЦИЯ 1: Начните с ведения дневника настроения\nПоскольку у вас пока нет данных о вашем настроении, предлагаю начать с ведения простого дневника настроения. Каждый день в течение недели записывайте, как вы себя чувствуете по шкале от 1 до 10. Это поможет вам отслеживать свои эмоциональные подъемы и спады, что, в свою очередь, даст важную информацию для дальнейших рекомендаций. Ожидаемый результат - вы получите более четкую картину своего эмоционального состояния.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Разработайте план по снижению стресса\nПоскольку у вас нет данных об уровне стресса, я рекомендую провести самооценку и разработать план по его снижению. Подумайте, какие ситуации или аспекты жизни вызывают у вас наибольшее напряжение. Затем составьте список простых, но эффективных техник по снижению стресса, например, практика медитации, регулярные физические упражнения, более качественный сон. Выберите 2-3 конкретных действия и начните внедрять их в свою рутину. Ожидаемый результат - вы почувствуете себя более расслабленным и сможете повысить свою продуктивность.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Определите важные для вас цели и виды активности\nПоскольку у вас нет записей об активностях, я рекомендую задуматься о ваших целях и приоритетах. Составьте список из 3-5 ключевых сфер, которые для вас важны (например, карьера, здоровье, саморазвитие). Затем определите конкретные действия, которые будут способствовать	high	f	2025-09-08 16:47:57.055+00	\N
32	1	personal_ai	Приветствую! Я изучил представленные данные пользователя и подготовил 5 персонализированных рекомендаций, которые помогут повысить вашу продуктивность и личное развитие.\n\n🎯 РЕКОМЕНДАЦИЯ 1: Начните вести дневник настроения\nНесмотря на отсутствие записей о настроении, отслеживание эмоционального состояния может помочь выявить закономерности и триггеры, влияющие на ваше самочувствие. Начните вести простой дневник настроения, отмечая свое эмоциональное состояние несколько раз в день по шкале от 1 до 10. Это поможет вам лучше понять свои эмоциональные паттерны и найти способы улучшить общий эмоциональный фон.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Внедрите практику медитации\nУчитывая отсутствие записей об активностях, рекомендую начать практиковать медитацию. Медитация доказанно снижает уровень стресса, повышает концентрацию и самосознание. Начните с 5-10 минут в день, постепенно увеличивая продолжительность. Найдите приложение или видео-гид, который поможет вам освоить базовые техники. Регулярная медитация станет отличным инструментом для управления стрессом и улучшения общего самочувствия.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Постройте систему постановки целей\nПоскольку данные об успешности отсутствуют, предлагаю уделить внимание постановке конкретных, измеримых целей. Начните с крупных жизненных целей, затем разбейте их на более мелкие, достижимые шаги. Ведите учет своих успехов, отмечая выполненные задачи. Это поможет вам визуализировать прогресс и повысит мотивацию к дальнейшему развитию.\n\n🎯	high	f	2025-09-08 16:50:51.02+00	\N
33	1	personal_ai	🎯 РЕКОМЕНДАЦИЯ 1: Начало ведения дневника настроения\n\nСудя по предоставленным данным, у вас пока нет записей о настроении. Это важный параметр, который стоит отслеживать для достижения большей осознанности и понимания самого себя. Предлагаю начать вести простой дневник настроения. Каждый день отмечайте, как вы себя чувствуете по 10-балльной шкале. Можно также указывать, что повлияло на ваше настроение в тот день. Со временем вы сможете проследить закономерности и понять, какие факторы позитивно или негативно влияют на ваше эмоциональное состояние. Это поможет вам вовремя предпринимать меры для поддержания хорошего настроения.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Снижение уровня стресса\n\nВаш уровень стресса не указан, но мы все сталкиваемся с ним в повседневной жизни. Предлагаю опробовать простые, но эффективные техники для его снижения. Попробуйте начинать каждое утро с 10-минутной медитации или дыхательных упражнений. Это поможет вам успокоиться, сосредоточиться и настроиться на продуктивный день. Также не забывайте о регулярных физических нагрузках - они станут отличным способом "выпустить пар" и восстановить энергию. Ну и не пренебрегайте здоровым питанием и полноценным отдыхом. Эти базовые меры помогут вам лучше справляться со стрессом.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Постановка SMART-целей\n\nПоскольку у вас пока нет записей об активностях, предлагаю обратить внимание на постановку четких, измеримых целей. Воспользуйтесь методикой SMART: ставьте Конкретные, Измеримые	high	f	2025-09-08 16:51:31.76+00	\N
34	1	personal_ai	Спасибо за интересный запрос! Давайте разберём имеющиеся данные и предложим 5 конкретных, персонализированных рекомендаций, которые помогут повысить вашу продуктивность и личное развитие.\n\nИсходя из представленной информации, у нас есть следующие данные:\n- Настроение: 0 записей\n- Уровень стресса: нет данных\n- Активности: 0 записей\n- Успешность: 0/0\n\nНа основании этого мы можем сделать вывод, что вам не хватает чёткого понимания своего состояния, что может препятствовать эффективному личному росту. Давайте исправим это!\n\n🎯 РЕКОМЕНДАЦИЯ 1: Ведите дневник настроения\nНачните регулярно записывать своё настроение по шкале от 1 до 10. Это поможет вам отслеживать свои эмоциональные подъёмы и спады, а также понять, какие факторы на них влияют. Просматривая дневник, вы сможете выявить паттерны и принять меры для улучшения своего эмоционального состояния.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Оцените уровень стресса\nВведите систему оценки уровня стресса от 1 до 10. Регулярно отмечайте этот показатель в своём дневнике. Это поможет вам выявить источники стресса и найти способы его снижения, например, практикуя медитацию, физические упражнения или улучшая тайм-менеджмент.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Ведите дневник активностей\nНачните фиксировать в дневнике все свои ежедневные активности - от работы до личных дел. Это позволит вам лучше понять, как вы распределяете своё время, и выявить области, требующие оптимизации. В дальнейшем вы сможете составить более эффективный распорядок дня.	high	f	2025-09-08 16:53:50.161+00	\N
35	1	personal_ai	🎯 РЕКОМЕНДАЦИЯ 1: Разработайте систему отслеживания настроения\n\nПо данным, предоставленным пользователем, у них отсутствуют записи о настроении. Регулярное отслеживание настроения может помочь выявить закономерности и факторы, влияющие на эмоциональное состояние. Я рекомендую завести простой дневник настроения, где пользователь будет ежедневно оценивать свое настроение по шкале от 1 до 10. Это поможет определить пиковые и спадающие моменты, а также проследить связь между настроением и другими аспектами жизни. Отслеживание настроения - это ценный инструмент для самопознания и улучшения общего самочувствия.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Управляйте уровнем стресса \n\nПоскольку пользователь не указал текущий уровень стресса, я предлагаю обратить внимание на признаки стресса в повседневной жизни. Высокий уровень стресса может негативно сказываться на продуктивности, здоровье и благополучии. Попробуйте внедрить в свою рутину простые антистрессовые практики, такие как регулярные физические упражнения, медитация, глубокое дыхание или прогулки на свежем воздухе. Отслеживайте, как эти действия влияют на ваше самочувствие, и выберите те практики, которые вам больше всего подходят. Уделение времени своему эмоциональному здоровью поможет повысить общую продуктивность и удовлетворенность жизнью.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Заведите дневник активностей\n\nСудя по предоставленным данным, пользователь не ведет учет своих активностей. Это важный шаг для понимания, как вы распределяете свое время и энергию. Заведите дневник, в котором будете фиксировать	high	f	2025-09-08 16:59:05.461+00	\N
36	1	personal_ai	Спасибо за обращение! К сожалению, я не могу предоставить персонализированные рекомендации, поскольку у меня недостаточно данных о пользователе. Для того, чтобы создать эффективные и полезные советы, мне необходимо иметь более подробную информацию о вашем текущем состоянии, целях и предпочтениях.\n\nТем не менее, позвольте мне дать вам несколько общих советов по повышению продуктивности и личному развитию:\n\n🎯 РЕКОМЕНДАЦИЯ 1: Определите ваши приоритеты\nПроанализируйте, на чём вы сосредотачиваетесь в течение дня. Выявите ваши ключевые задачи и расставьте их по важности. Сосредоточьтесь на том, что действительно имеет значение, чтобы повысить эффективность и достичь ваших целей.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Разработайте план действий\nСоздайте конкретный план по достижению ваших целей. Разбейте крупные задачи на более мелкие, выполнимые шаги. Определите сроки и распределите задачи по времени. Регулярно пересматривайте и обновляйте ваш план.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Внедрите здоровые привычки\nУделяйте время заботе о себе - правильному питанию, сну, физической активности. Это поможет вам поддерживать энергию и концентрацию на протяжении дня. Также попробуйте практиковать техники релаксации, такие как медитация или йога, чтобы снизить уровень стресса.\n\n🎯 РЕКОМЕНДАЦИЯ 4: Ограничьте отвлекающие факторы\nИдентифицируйте ваши основные источники отвлечения и найдите способы их минимизировать. Например, выключайте уведомления на телефоне, закрывайте вк	high	f	2025-09-08 17:01:43.24+00	\N
37	1	personal_ai	🎯 РЕКОМЕНДАЦИЯ 1: Начни вести дневник настроения\nОтслеживание своего эмоционального фона - важный шаг к самопознанию и личному росту. Заведи простой дневник, в котором будешь ежедневно фиксировать свое настроение по шкале от 1 до 10. Это поможет тебе понять, какие факторы влияют на твое состояние, и найти способы его улучшения. Веди дневник хотя бы 2-3 недели - этого времени будет достаточно, чтобы выявить первые закономерности. Результатом станет лучшее понимание самого себя и способность управлять своими эмоциями.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Расставь приоритеты и составь план активностей\nСудя по данным, ты пока не ведешь учет своих повседневных активностей. Это важный шаг для повышения продуктивности и достижения целей. Выдели 30-60 минут, чтобы подумать над тем, какие дела и проекты для тебя наиболее важны. Расставь их по приоритетам и составь недельный план действий. Не пытайся объять необъятное - сосредоточься на ключевых задачах. Каждый день выделяй время на работу над ними, отслеживай прогресс и вноси необходимые корректировки. Это поможет тебе двигаться вперед системно и эффективно.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Внедри практику осознанности\nОдной из главных причин стресса и низкой продуктивности часто становится "ментальный шум" - постоянный поток мыслей, беспокойство о будущем и сожаления о прошлом. Внедри в свою жизнь практику осознанности, например, 5-10 минут ежедневной медитации. Она поможет тебе научиться фокусироваться на настоящем моменте,	high	f	2025-09-08 17:04:58.353+00	\N
38	1	personal_ai	Спасибо за интересное задание! Проанализировав доступные данные пользователя, я подготовил следующие персонализированные рекомендации:\n\n🎯 РЕКОМЕНДАЦИЯ 1: Поставьте реалистичные цели\nИсходя из ваших текущих показателей успешности (0/0), рекомендую начать с постановки небольших, достижимых целей. Это поможет вам почувствовать уверенность и мотивацию для движения вперед. Начните, например, с выполнения одной активности в день, а затем постепенно увеличивайте свои задачи по мере роста успешности. Отмечайте каждое достижение, чтобы поддерживать позитивный настрой.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Найдите способы снизить уровень стресса\nОтсутствие информации об уровне стресса может говорить о том, что вы еще не осознаете его влияние на вашу продуктивность. Предлагаю выделить время для отслеживания состояния и регулярных практик релаксации. Попробуйте медитацию, дыхательные упражнения или прогулки на свежем воздухе. Это поможет снизить напряжение и настроиться на эффективную работу.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Ведите дневник настроения\nОтсутствие записей о настроении не позволяет мне оценить ваше эмоциональное состояние. Рекомендую начать вести дневник, где вы будете регулярно фиксировать свои эмоции и ощущения. Это поможет вам лучше понять свои паттерны и найти способы их улучшения. Не стесняйтесь экспериментировать с разными форматами - от простых пометок до развернутых записей.\n\n🎯 РЕКОМЕНДАЦИЯ 4: Составьте план активностей\nБез информации о ваших текущих активностях сложно предложить конкретные	high	f	2025-09-08 17:06:02.563+00	\N
39	1	personal_ai	Благодарю за интересную задачу! Давайте проанализируем имеющиеся данные пользователя и предложим пять персонализированных рекомендаций, которые помогут повысить его продуктивность и личное развитие.\n\n🎯 РЕКОМЕНДАЦИЯ 1: Внедрение регулярной практики ведения дневника\nСудя по отсутствию записей о настроении и активностях, вам может не хватать структурированного подхода к самонаблюдению и самоанализу. Предлагаю завести дневник, в котором вы будете регулярно фиксировать свое состояние, достижения, сложности и планы на будущее. Это поможет вам лучше понять свои эмоциональные и поведенческие паттерны, выявить зоны роста и систематически работать над ними. Начните с 10-15 минут в день - этого будет достаточно, чтобы получить ценную обратную связь и наметить конкретные шаги.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Составление еженедельного плана\nУчитывая отсутствие записей об активностях, вы, вероятно, действуете реактивно, отвечая на срочные задачи по мере их возникновения. Предлагаю внедрить практику еженедельного планирования, где вы будете структурировать свои цели, задачи и приоритеты на ближайшие 7 дней. Это поможет вам быть более фокусированным, эффективно распределять время и энергию, а также чувствовать себя более уверенно и в контроле над своей жизнью. Выделите 30-60 минут каждое воскресенье на планирование следующей недели.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Внедрение практики осознанности\nУчитывая отсутствие данных об уровне стресса, вам может не хватать навыков управления эмоциями и состоянием. Предлагаю внедрить	high	f	2025-09-08 17:10:52.86+00	\N
40	1	personal_ai	Спасибо за интересное задание! С удовольствием проанализирую данные пользователя и предоставлю персонализированные рекомендации для повышения продуктивности и личного развития.\n\n🎯 РЕКОМЕНДАЦИЯ 1: Составление еженедельного плана\nВаши данные показывают, что вы еще не ведете учет своих активностей. Предлагаю начать с составления еженедельного плана. Выделите время в вашем расписании для планирования предстоящей недели каждое воскресенье вечером. Определите основные цели, задачи и приоритеты на следующие 7 дней. Это поможет вам структурировать время, расставить акценты и повысить эффективность. Ожидаемый результат - вы почувствуете больший контроль над своей неделей и сможете лучше распределить время между важными делами.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Техника "Помидора"\nТак как данные о вашем уровне стресса отсутствуют, предлагаю использовать технику "Помидора" для управления временем и повышения концентрации. Работайте по 25 минут с перерывами по 5 минут. Эта простая, но эффективная методика поможет вам избегать выгорания и повысить продуктивность. Ожидаемый результат - вы станете более сфокусированным, сможете дольше концентрироваться на важных задачах и почувствуете прилив энергии.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Ежедневная рефлексия\nПоскольку вы не ведете учета своего настроения, предлагаю внедрить практику ежедневной рефлексии. Выделите 10-15 минут каждый вечер, чтобы проанализировать прошедший день. Подумайте, что прошло хорошо, что можно улучшить, какие уроки вы извлекли. Ведите простой дневник, где будете	high	f	2025-09-08 17:17:43.75+00	\N
41	1	personal_ai	🎯 РЕКОМЕНДАЦИЯ 1: Разработай еженедельный план\nУчитывая, что у тебя пока нет записей о своих активностях и успешности, предлагаю начать с создания структурированного еженедельного плана. Это поможет тебе организовать свое время, расставить приоритеты и отследить прогресс. Выдели основные цели и задачи на неделю, распредели их по дням и отметь ключевые этапы. Не забывай также включать в план время для отдыха и развлечений - это важно для поддержания здорового баланса. Следование такому плану позволит тебе постепенно наращивать продуктивность и чувствовать себя более уверенно.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Начни вести дневник настроения\nРаз у тебя пока нет данных о настроении, предлагаю начать вести дневник, где ты будешь фиксировать свое эмоциональное состояние ежедневно. Это поможет тебе лучше понять свои паттерны и триггеры, а также отследить, как твое настроение влияет на продуктивность и успешность. Не бойся записывать даже негативные эмоции - важно быть честным с собой. По прошествии нескольких недель ты сможешь проанализировать свои данные и выявить закономерности, которые лягут в основу дальнейших рекомендаций.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Определи уровень стресса и источники\nПоскольку у тебя пока нет точных данных об уровне стресса, предлагаю провести самооценку. Обрати внимание на физические и эмоциональные симптомы, которые могут указывать на высокий стресс: напряжение мышц, усталость, раздражительность, трудности с концентрацией. Также попробуй проанализировать, какие факторы в твоей жизни вызывают наибольш	high	f	2025-09-08 17:28:40.37+00	\N
42	1	personal_ai	Благодарю за предоставленные данные. Как AI-эксперт по продуктивности и личному развитию, я проанализировал имеющуюся информацию и подготовил 5 персонализированных рекомендаций, направленных на улучшение вашей продуктивности и благополучия.\n\n🎯 РЕКОМЕНДАЦИЯ 1: Установите режим дня\nДля повышения продуктивности и снижения уровня стресса важно иметь сбалансированный режим дня. Начните с определения оптимального времени для сна, работы и отдыха. Постарайтесь придерживаться этого распорядка, чтобы стабилизировать ваш циркадный ритм. Это поможет вам чувствовать себя более сосредоточенным и энергичным на протяжении всего дня.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Практикуйте регулярные перерывы\nДлительная концентрация на работе может быстро истощить ваши ресурсы. Включите в свой распорядок регулярные перерывы для отдыха и восстановления. Например, каждые 50-60 минут делайте 5-10 минутные паузы, в течение которых отвлекайтесь от рабочих дел, совершайте легкую физическую активность или занимайтесь дыхательными упражнениями. Это поможет вам восстановить энергию и повысить продуктивность.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Внедрите техники управления стрессом\nСудя по отсутствию записей о вашем настроении и высокому уровню стресса, важно уделить особое внимание методам управления стрессом. Попробуйте практиковать медитацию, йогу или другие техники осознанности. Также эффективны физические упражнения, общение с близкими людьми и хобби, которые доставляют вам удовольствие. Регулярно применяя эти практики, вы науч	high	f	2025-09-08 17:37:06.893+00	\N
43	1	personal_ai	Спасибо за интересное задание! Используя предоставленную информацию, я разработал 5 персонализированных рекомендаций, которые, надеюсь, помогут вам повысить вашу продуктивность и улучшить личное развитие.\n\n🎯 РЕКОМЕНДАЦИЯ 1: Установите цели и отслеживайте прогресс\nТак как у вас пока нет записей об активностях и успешности, я рекомендую начать с постановки четких, измеримых целей. Запишите несколько важных для вас целей на ближайший месяц и отмечайте свой прогресс. Это поможет вам оставаться сфокусированным и мотивированным. Ожидаемый результат: вы станете более организованным и целеустремленным, что повысит вашу продуктивность.\n\n🎯 РЕКОМЕНДАЦИЯ 2: Уделяйте время для релаксации и восстановления\nНесмотря на отсутствие данных о вашем уровне стресса, я рекомендую регулярно находить время для отдыха и восстановления. Это может быть медитация, прогулка на свежем воздухе или другая активность, которая помогает вам снять напряжение. Ожидаемый результат: вы станете более спокойным и сосредоточенным, что положительно скажется на вашей работоспособности.\n\n🎯 РЕКОМЕНДАЦИЯ 3: Введите ежедневную практику самоанализа\nНачните вести дневник, в котором будете записывать свои мысли, чувства и наблюдения за собой. Это поможет вам лучше понять свои паттерны поведения и факторы, влияющие на ваше эмоциональное состояние. Ожидаемый результат: вы получите ценную обратную связь, которая поможет вам принимать более осознанные решения.\n\n🎯 РЕКОМЕНДАЦИЯ 4: Развивайте полезные привычки\nОпределите одну-	high	f	2025-09-30 11:53:31.212+00	\N
\.


--
-- Data for Name: ai_signals; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.ai_signals (id, user_id, type, data, "timestamp", created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating) FROM stdin;
1	1	mood	{"mood": 8, "notes": "Отличный день! Завершил проект", "activities": ["работа", "спорт"], "stressLevel": 2}	2025-08-17 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
2	1	activity	{"notes": "Проект сдан в срок", "success": true, "activity": "Завершение проекта", "category": "работа", "duration": 180}	2025-08-17 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
3	1	stress	{"notes": "Чувствую удовлетворение", "source": "работа", "stressLevel": 2}	2025-08-17 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
4	1	mood	{"mood": 6, "notes": "Обычный день, немного устал", "activities": ["работа", "чтение"], "stressLevel": 4}	2025-08-16 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
5	1	activity	{"notes": "Прочитал 2 главы", "success": true, "activity": "Чтение технической литературы", "category": "обучение", "duration": 60}	2025-08-16 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
6	1	mood	{"mood": 9, "notes": "Отличный выходной!", "activities": ["спорт", "встреча с друзьями"], "stressLevel": 1}	2025-08-15 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
7	1	activity	{"notes": "Интенсивная тренировка", "success": true, "activity": "Тренировка в зале", "category": "спорт", "duration": 90}	2025-08-15 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
8	1	mood	{"mood": 5, "notes": "Сложный день на работе", "activities": ["работа"], "stressLevel": 7}	2025-08-14 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
9	1	activity	{"notes": "Не удалось решить все проблемы", "success": false, "activity": "Решение проблем на проекте", "category": "работа", "duration": 240}	2025-08-14 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
10	1	mood	{"mood": 7, "notes": "Лучше чем вчера", "activities": ["работа", "музыка"], "stressLevel": 3}	2025-08-13 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
11	1	activity	{"notes": "Разучил новую песню", "success": true, "activity": "Игра на гитаре", "category": "хобби", "duration": 45}	2025-08-13 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
12	1	mood	{"mood": 8, "notes": "Продуктивный день", "activities": ["работа", "спорт"], "stressLevel": 2}	2025-08-12 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
13	1	activity	{"notes": "5 км за 25 минут", "success": true, "activity": "Пробежка", "category": "спорт", "duration": 30}	2025-08-12 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
14	1	mood	{"mood": 6, "notes": "Начало недели", "activities": ["работа"], "stressLevel": 5}	2025-08-11 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
15	1	activity	{"notes": "Составил план задач", "success": true, "activity": "Планирование недели", "category": "работа", "duration": 120}	2025-08-11 19:03:25.300175+00	2025-08-17 19:03:25.300175+00	\N	\N	\N	1.00	\N	\N	\N	\N
16	1	mood	{"mood": 8, "notes": "Отличный день! Завершил проект", "timestamp": "2025-08-17T21:11:50.467Z", "activities": ["работа", "спорт"], "stressLevel": 2}	2025-08-17 21:11:50.467+00	2025-08-17 21:11:50.493187+00	\N	\N	\N	1.00	\N	\N	\N	\N
17	1	activity	{"notes": "AI API работает отлично!", "success": true, "activity": "Тестирование AI системы", "category": "разработка", "duration": 120, "timestamp": "2025-08-17T21:11:54.061Z"}	2025-08-17 21:11:54.061+00	2025-08-17 21:11:54.063872+00	\N	\N	\N	1.00	\N	\N	\N	\N
18	1	mood	{"mood": 8, "notes": "Отличный день! Завершил проект", "timestamp": "2025-08-17T21:12:11.941Z", "activities": ["работа", "спорт"], "stressLevel": 2}	2025-08-17 21:12:11.941+00	2025-08-17 21:12:11.962061+00	\N	\N	\N	1.00	\N	\N	\N	\N
19	1	activity	{"notes": "AI API работает отлично!", "success": true, "activity": "Тестирование AI системы", "category": "разработка", "duration": 120, "timestamp": "2025-08-17T21:12:15.758Z"}	2025-08-17 21:12:15.759+00	2025-08-17 21:12:15.761159+00	\N	\N	\N	1.00	\N	\N	\N	\N
20	1	mood	{"mood": 8, "notes": "??????? ????", "timestamp": "2025-08-20T18:53:26.026Z", "activities": ["??????", "?????"], "stressLevel": 3}	2025-08-20 18:53:26.026+00	2025-08-20 18:53:26.028565+00	\N	\N	\N	1.00	\N	\N	\N	\N
21	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: выфвфы", "timestamp": "2025-08-20T18:54:13.139Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-20 18:54:13.139+00	2025-08-20 18:54:13.155591+00	\N	\N	\N	1.00	\N	\N	\N	\N
22	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: я отлично рассказал презентацию, весь коллектив мне хлопал \\nначальник сказал что я следующий руководитель отдела\\n", "timestamp": "2025-08-20T18:55:07.482Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-20 18:55:07.482+00	2025-08-20 18:55:07.502085+00	\N	\N	\N	1.00	\N	\N	\N	\N
23	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: я сделал много успешных задач\\nно опоздал на совещание ", "timestamp": "2025-08-20T19:01:11.753Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-20 19:01:11.753+00	2025-08-20 19:01:11.770403+00	\N	\N	\N	1.00	\N	\N	\N	\N
24	1	mood	{"mood": 7, "notes": "?????? ????? ???????, ?? ??????? ?? ?????? ?????????", "timestamp": "2025-08-20T19:05:18.957Z", "activities": ["?????? ??? ????????", "????????? ?? ?????????", "???????? ?????????? ?????"], "stressLevel": 3}	2025-08-20 19:05:18.957+00	2025-08-20 19:05:18.988275+00	\N	\N	\N	1.00	\N	\N	\N	\N
25	1	activity	{"notes": "?????? ???? ? ????", "success": true, "activity": "?????????? ???????", "category": "??????", "duration": 120, "timestamp": "2025-08-20T19:05:36.327Z"}	2025-08-20 19:05:36.328+00	2025-08-20 19:05:36.332683+00	\N	\N	\N	1.00	\N	\N	\N	\N
26	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: я подружился с коллегой и успешно закрыл задачи \\n", "timestamp": "2025-08-20T19:08:09.337Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-20 19:08:09.337+00	2025-08-20 19:08:09.351897+00	\N	\N	\N	1.00	\N	\N	\N	\N
27	1	mood	{"mood": 4, "notes": "Сегодня мне нужна поддержка: привет что делать если я сильно налажал и начальник поругал также все валится из рук и не получается нормально работать", "timestamp": "2025-08-20T19:12:11.044Z", "activities": ["daily_mood_check"], "stressLevel": 8}	2025-08-20 19:12:11.044+00	2025-08-20 19:12:11.080261+00	\N	\N	\N	1.00	\N	\N	\N	\N
28	1	activity	{"notes": "я закончил тренировку в зале я хорошо позанимался и повысил настроение ", "success": true, "activity": "тренировка", "category": "learning", "duration": 120, "timestamp": "2025-08-20T19:45:27.569Z"}	2025-08-20 19:45:27.57+00	2025-08-20 19:45:27.592528+00	\N	\N	\N	1.00	\N	\N	\N	\N
29	1	activity	{"notes": "Успешно закрыл продажи", "success": true, "activity": "Продажи", "category": "work", "duration": 60, "timestamp": "2025-08-20T20:00:50.556Z"}	2025-08-20 20:00:50.557+00	2025-08-20 20:00:50.576859+00	\N	\N	\N	1.00	\N	\N	\N	\N
162	1	mood	{"mood": "Средне", "notes": "Много задач, мало времени", "stressLevel": 5}	2025-09-08 15:24:51.358+00	2025-09-08 16:38:41.326962+00	\N	\N	\N	1.00	\N	\N	\N	\N
30	1	mood	{"mood": 4, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-20T20:12:39.737Z", "activities": ["daily_mood_check"], "stressLevel": 8}	2025-08-20 20:12:39.737+00	2025-08-20 20:12:39.740087+00	\N	\N	\N	1.00	\N	\N	\N	\N
31	1	mood	{"mood": 10, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-20T20:14:56.660Z", "activities": ["daily_mood_check"], "stressLevel": 1}	2025-08-20 20:14:56.66+00	2025-08-20 20:14:56.684875+00	\N	\N	\N	1.00	\N	\N	\N	\N
32	1	activity	{"notes": "Я сходил на тренировку и теперь у меня хорошее настроение !", "success": true, "activity": "Тренировка", "category": "health", "duration": 135, "timestamp": "2025-08-20T20:24:50.479Z"}	2025-08-20 20:24:50.479+00	2025-08-20 20:24:50.498414+00	\N	\N	\N	1.00	\N	\N	\N	\N
33	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-20T20:26:58.629Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-20 20:26:58.629+00	2025-08-20 20:26:58.649204+00	\N	\N	\N	1.00	\N	\N	\N	\N
34	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-20T20:42:22.585Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-20 20:42:22.585+00	2025-08-20 20:42:22.604761+00	\N	\N	\N	1.00	\N	\N	\N	\N
35	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-20T20:47:56.269Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-20 20:47:56.269+00	2025-08-20 20:47:56.289776+00	\N	\N	\N	1.00	\N	\N	\N	\N
36	1	mood	{"mood": 4, "notes": "Сегодня мне нужна поддержка: ", "timestamp": "2025-08-20T20:51:09.673Z", "activities": ["daily_mood_check"], "stressLevel": 8}	2025-08-20 20:51:09.673+00	2025-08-20 20:51:09.6954+00	\N	\N	\N	1.00	\N	\N	\N	\N
37	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-20T21:00:41.477Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-20 21:00:41.477+00	2025-08-20 21:00:41.518156+00	\N	\N	\N	1.00	\N	\N	\N	\N
38	1	activity	{"notes": "Сегодя мы успешно провели совещание и закрыли его в сфере недвижимости сегодня хорошо погуляем по этому поводу и отпразднуем я счастлив!!!", "success": true, "activity": "Проект", "category": "learning", "duration": 120, "timestamp": "2025-08-20T21:03:48.129Z"}	2025-08-20 21:03:48.129+00	2025-08-20 21:03:48.150614+00	\N	\N	\N	1.00	\N	\N	\N	\N
39	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-22T18:30:46.199Z", "activities": ["daily_mood_check"], "stressLevel": 1}	2025-08-22 18:30:46.199+00	2025-08-22 18:30:46.227613+00	\N	\N	\N	1.00	\N	\N	\N	\N
40	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-22T18:36:40.674Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-22 18:36:40.674+00	2025-08-22 18:36:40.703663+00	\N	\N	\N	1.00	\N	\N	\N	\N
41	1	mood	{"mood": 8, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-22T18:54:47.409Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-22 18:54:47.409+00	2025-08-22 18:54:47.443093+00	\N	\N	\N	1.00	\N	\N	\N	\N
42	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-22T19:01:23.029Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-22 19:01:23.029+00	2025-08-22 19:01:23.04815+00	\N	\N	\N	1.00	\N	\N	\N	\N
43	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-22T19:11:54.359Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-22 19:11:54.359+00	2025-08-22 19:11:54.38181+00	\N	\N	\N	1.00	\N	\N	\N	\N
44	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-22T19:13:22.646Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-22 19:13:22.646+00	2025-08-22 19:13:22.64862+00	\N	\N	\N	1.00	\N	\N	\N	\N
45	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-22T19:14:29.695Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-22 19:14:29.695+00	2025-08-22 19:14:29.717929+00	\N	\N	\N	1.00	\N	\N	\N	\N
46	1	mood	{"mood": 7, "notes": "Привет Я посмотрел сопрано и теперь плавно иду к завершению задач по проге", "timestamp": "2025-08-22T19:21:02.792Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-22 19:21:02.792+00	2025-08-22 19:21:01.257783+00	\N	\N	\N	1.00	\N	\N	\N	\N
47	1	mood	{"mood": 10, "notes": "Сегодня у меня был успех: я отлично ответил презентацию и меня пообещали повысить!!!", "timestamp": "2025-08-22T19:31:14.828Z", "activities": ["daily_mood_check"], "stressLevel": 2}	2025-08-22 19:31:14.828+00	2025-08-22 19:31:14.32879+00	\N	\N	\N	1.00	\N	\N	\N	\N
48	1	mood	{"mood": 9, "notes": "Сегодня у меня был успех: я успешно рассказал презентацию, меня обещали повысить!", "timestamp": "2025-08-22T19:34:07.031Z", "activities": ["daily_mood_check"], "stressLevel": 2}	2025-08-22 19:34:07.031+00	2025-08-22 19:34:04.498806+00	\N	\N	\N	1.00	\N	\N	\N	\N
49	1	activity	{"mood": 0, "notes": "Побегал и теперь счастлив", "energy": 0, "stress": 0, "success": true, "activity": "Тренировка", "category": "learning", "duration": 120, "timestamp": "2025-08-22T19:35:46.672Z"}	2025-08-22 19:35:46.672+00	2025-08-22 19:35:46.692678+00	\N	\N	\N	1.00	\N	\N	\N	\N
50	1	activity	{"mood": 0, "notes": "", "energy": 0, "stress": 0, "success": true, "activity": "Т", "category": "work", "duration": 60, "timestamp": "2025-08-22T19:55:32.405Z"}	2025-08-22 19:55:32.405+00	2025-08-22 19:55:32.448742+00	\N	\N	\N	1.00	\N	\N	\N	\N
51	1	activity	{"mood": 0, "notes": "", "energy": 0, "stress": 0, "success": true, "activity": "трен", "category": "work", "duration": 60, "timestamp": "2025-08-22T19:56:59.097Z"}	2025-08-22 19:56:59.097+00	2025-08-22 19:56:59.121336+00	\N	\N	\N	1.00	\N	\N	\N	\N
52	1	activity	{"mood": 0, "notes": "Хорошо побегал", "energy": 0, "stress": 0, "success": true, "activity": "тренировка", "category": "health", "duration": 90, "timestamp": "2025-08-22T20:20:51.934Z"}	2025-08-22 20:20:51.934+00	2025-08-22 20:20:51.953004+00	\N	\N	\N	1.00	\N	\N	\N	\N
53	1	activity	{"mood": 0, "notes": "Хорошо побегал и готов работать", "energy": 0, "stress": 0, "success": true, "activity": "Тренировка", "category": "work", "duration": 75, "timestamp": "2025-08-22T20:28:03.743Z"}	2025-08-22 20:28:03.743+00	2025-08-22 20:28:03.767853+00	\N	\N	\N	1.00	\N	\N	\N	\N
54	1	activity	{"mood": 0, "notes": "хорошо побегал и готов работать", "energy": 0, "stress": 0, "success": true, "activity": "тренировка", "category": "work", "duration": 60, "timestamp": "2025-08-22T20:28:32.236Z"}	2025-08-22 20:28:32.236+00	2025-08-22 20:28:32.292025+00	\N	\N	\N	1.00	\N	\N	\N	\N
55	1	activity	{"mood": 0, "notes": "хорошо побегал и готов работать", "energy": 0, "stress": 0, "success": true, "activity": "тренировка", "category": "work", "duration": 60, "timestamp": "2025-08-22T20:32:18.429Z"}	2025-08-22 20:32:18.429+00	2025-08-22 20:32:18.45046+00	\N	\N	\N	1.00	\N	\N	\N	\N
56	1	activity	{"mood": 0, "notes": "хорошо побегал и готов работать", "energy": 0, "stress": 0, "success": true, "activity": "тренировка", "category": "work", "duration": 60, "timestamp": "2025-08-22T20:34:30.640Z"}	2025-08-22 20:34:30.64+00	2025-08-22 20:34:30.667373+00	\N	\N	\N	1.00	\N	\N	\N	\N
57	1	activity	{"notes": "хорошо побегал и готов работать", "success": true, "activity": "тренировка", "category": "health", "duration": 60, "timestamp": "2025-08-22T20:36:08.265Z"}	2025-08-22 20:36:08.266+00	2025-08-22 20:36:08.294088+00	\N	\N	\N	1.00	\N	\N	\N	\N
58	1	activity	{"notes": "потренировался и готов продуктивно работать", "success": true, "activity": "тренировка", "category": "work", "duration": 60, "timestamp": "2025-08-22T20:40:42.137Z"}	2025-08-22 20:40:42.138+00	2025-08-22 20:40:42.167548+00	\N	\N	\N	1.00	\N	\N	\N	\N
59	1	activity	{"notes": "потренировался и готов продуктивно работать\\n", "success": true, "activity": "тренировка", "category": "work", "duration": 60, "timestamp": "2025-08-22T20:43:46.358Z"}	2025-08-22 20:43:46.358+00	2025-08-22 20:43:46.385521+00	\N	\N	\N	1.00	\N	\N	\N	\N
60	1	activity	{"notes": "потренировался и готов работать\\n", "success": true, "activity": "тренировка", "category": "health", "duration": 75, "timestamp": "2025-08-22T20:45:27.888Z"}	2025-08-22 20:45:27.889+00	2025-08-22 20:45:27.931503+00	\N	\N	\N	1.00	\N	\N	\N	\N
61	1	activity	{"notes": "потренировался и готов работать", "success": true, "activity": "тренировка", "category": "health", "duration": 60, "timestamp": "2025-08-22T20:49:44.303Z"}	2025-08-22 20:49:44.304+00	2025-08-22 20:49:44.332803+00	\N	\N	\N	1.00	\N	\N	\N	\N
62	1	activity	{"notes": "потренил", "success": true, "activity": "тренировка", "category": "work", "duration": 60, "timestamp": "2025-08-22T20:50:54.627Z"}	2025-08-22 20:50:54.628+00	2025-08-22 20:50:54.656232+00	\N	\N	\N	1.00	\N	\N	\N	\N
63	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-27T07:36:35.028Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-27 07:36:35.028+00	2025-08-27 07:36:35.030131+00	\N	\N	\N	1.00	\N	\N	\N	\N
64	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-27T07:38:36.452Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-27 07:38:36.452+00	2025-08-27 07:38:36.45509+00	\N	\N	\N	1.00	\N	\N	\N	\N
65	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-27T16:06:57.219Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-27 16:06:57.219+00	2025-08-27 16:06:57.222215+00	\N	\N	\N	1.00	\N	\N	\N	\N
66	3	mood	{"mood": 8, "notes": "Хорошее настроение утром", "energy": 7, "stress": 2, "activities": ["daily_mood_check"], "stressLevel": 2}	2025-08-21 09:00:00+00	2025-08-21 09:00:00+00	8	7	2	1.00	Хорошее настроение утром	mood_check	\N	\N
67	3	mood	{"mood": 7, "notes": "Вечерний отчет настроения", "energy": 6, "stress": 3, "activities": ["daily_mood_report"], "stressLevel": 3}	2025-08-21 18:00:00+00	2025-08-21 18:00:00+00	7	6	3	1.00	Вечерний отчет настроения	daily_report	\N	\N
68	3	activity	{"mood": 0, "notes": "Завершил важную задачу", "energy": 0, "stress": 0, "success": true, "activities": ["daily_activity_report"], "stressLevel": 1}	2025-08-21 18:00:00+00	2025-08-21 18:00:00+00	\N	\N	\N	1.00	Завершил важную задачу	task_completion	120	9
72	3	mood	{"mood": 6, "notes": "Устал, но держусь", "energy": 5, "stress": 4, "activities": ["daily_mood_check"], "stressLevel": 4}	2025-08-23 09:15:00+00	2025-08-23 09:15:00+00	6	5	4	1.00	Устал, но держусь	mood_check	\N	\N
73	3	mood	{"mood": 6, "notes": "Вечерний отчет", "energy": 5, "stress": 3, "activities": ["daily_mood_report"], "stressLevel": 3}	2025-08-23 18:15:00+00	2025-08-23 18:15:00+00	6	5	3	1.00	Вечерний отчет	daily_report	\N	\N
74	3	activity	{"mood": 0, "notes": "Исправил баг", "energy": 0, "stress": 0, "success": true, "activities": ["daily_activity_report"], "stressLevel": 2}	2025-08-23 18:15:00+00	2025-08-23 18:15:00+00	\N	\N	\N	1.00	Исправил баг	bug_fix	90	8
75	3	mood	{"mood": 7, "notes": "Нормальное настроение", "energy": 6, "stress": 3, "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-24 08:45:00+00	2025-08-24 08:45:00+00	7	6	3	1.00	Нормальное настроение	mood_check	\N	\N
76	3	mood	{"mood": 7, "notes": "Вечерний отчет", "energy": 6, "stress": 2, "activities": ["daily_mood_report"], "stressLevel": 2}	2025-08-24 17:45:00+00	2025-08-24 17:45:00+00	7	6	2	1.00	Вечерний отчет	daily_report	\N	\N
77	3	activity	{"mood": 0, "notes": "Командная работа", "energy": 0, "stress": 0, "success": true, "activities": ["daily_activity_report"], "stressLevel": 2}	2025-08-24 17:45:00+00	2025-08-24 17:45:00+00	\N	\N	\N	1.00	Командная работа	team_collaboration	150	8
78	3	mood	{"mood": 8, "notes": "Хорошее настроение", "energy": 7, "stress": 2, "activities": ["daily_mood_check"], "stressLevel": 2}	2025-08-25 09:00:00+00	2025-08-25 09:00:00+00	8	7	2	1.00	Хорошее настроение	mood_check	\N	\N
79	3	mood	{"mood": 8, "notes": "Вечерний отчет", "energy": 7, "stress": 2, "activities": ["daily_mood_report"], "stressLevel": 2}	2025-08-25 17:00:00+00	2025-08-25 17:00:00+00	8	7	2	1.00	Вечерний отчет	daily_report	\N	\N
80	3	activity	{"mood": 0, "notes": "Деплой проекта", "energy": 0, "stress": 0, "success": true, "activities": ["daily_activity_report"], "stressLevel": 1}	2025-08-25 17:00:00+00	2025-08-25 17:00:00+00	\N	\N	\N	1.00	Деплой проекта	deployment	60	9
163	1	activity	{"success": true, "activity": "Йога", "category": "Спорт", "duration": 45}	2025-09-04 04:12:57.943+00	2025-09-08 16:38:41.332851+00	\N	\N	\N	1.00	\N	\N	\N	\N
84	3	mood	{"mood": 9, "notes": "Отличное настроение", "energy": 8, "stress": 1, "activities": ["daily_mood_check"], "stressLevel": 1}	2025-08-22 08:30:00+00	2025-08-22 08:30:00+00	9	8	1	1.00	Отличное настроение	mood_check	\N	\N
85	3	mood	{"mood": 8, "notes": "Вечерний отчет", "energy": 7, "stress": 2, "activities": ["daily_mood_report"], "stressLevel": 2}	2025-08-22 17:30:00+00	2025-08-22 17:30:00+00	8	7	2	1.00	Вечерний отчет	daily_report	\N	\N
87	3	mood	{"mood": 9, "notes": "Отличный день", "energy": 8, "stress": 1, "activities": ["daily_mood_check"], "stressLevel": 1}	2025-08-26 10:00:00+00	2025-08-26 10:00:00+00	9	8	1	1.00	Отличный день	mood_check	\N	\N
88	3	mood	{"mood": 9, "notes": "Вечерний отчет", "energy": 8, "stress": 1, "activities": ["daily_mood_report"], "stressLevel": 1}	2025-08-26 18:00:00+00	2025-08-26 18:00:00+00	9	8	1	1.00	Вечерний отчет	daily_report	\N	\N
90	3	mood	{"mood": 7, "notes": "Нормальное утро", "energy": 6, "stress": 3, "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-27 09:30:00+00	2025-08-27 09:30:00+00	7	6	3	1.00	Нормальное утро	mood_check	\N	\N
91	3	mood	{"mood": 7, "notes": "Вечерний отчет", "energy": 6, "stress": 2, "activities": ["daily_mood_report"], "stressLevel": 2}	2025-08-27 17:30:00+00	2025-08-27 17:30:00+00	7	6	2	1.00	Вечерний отчет	daily_report	\N	\N
92	3	activity	{"mood": 0, "notes": "Планирование недели", "energy": 0, "stress": 0, "success": true, "activities": ["daily_activity_report"], "stressLevel": 1}	2025-08-27 17:30:00+00	2025-08-27 17:30:00+00	\N	\N	\N	1.00	Планирование недели	planning	45	8
93	1	mood	{"mood": 6, "notes": "", "timestamp": "2025-08-27T18:21:52.852Z", "activities": ["daily_mood_check"], "stressLevel": 2}	2025-08-27 18:21:52.854+00	2025-08-27 18:21:52.901659+00	\N	\N	\N	1.00	\N	\N	\N	\N
94	1	mood	{"mood": 6, "notes": "сегодня я утром подрочил, выиграл в клэш рояле, наварил хрючева 5кг и щас лежу, смотрю тик ток", "timestamp": "2025-08-27T18:23:49.670Z", "activities": ["daily_mood_check"], "stressLevel": 2}	2025-08-27 18:23:49.67+00	2025-08-27 18:23:49.697443+00	\N	\N	\N	1.00	\N	\N	\N	\N
95	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: я побегал", "timestamp": "2025-08-27T18:24:37.745Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-27 18:24:37.745+00	2025-08-27 18:24:37.769773+00	\N	\N	\N	1.00	\N	\N	\N	\N
96	1	activity	{"notes": "Хорошо потренировался и готов работать", "success": true, "activity": "Тренажерный зал", "category": "health", "duration": 120, "timestamp": "2025-08-27T18:27:06.901Z"}	2025-08-27 18:27:06.901+00	2025-08-27 18:27:06.928632+00	\N	\N	\N	1.00	\N	\N	\N	\N
97	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-30T18:13:37.314Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:13:37.314+00	2025-08-30 18:13:37.335548+00	\N	\N	\N	1.00	\N	\N	\N	\N
98	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех:  я ответил презентацию и меня обещали повысить", "timestamp": "2025-08-30T18:14:08.430Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:14:08.43+00	2025-08-30 18:14:08.453401+00	\N	\N	\N	1.00	\N	\N	\N	\N
99	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-30T18:14:42.509Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:14:42.509+00	2025-08-30 18:14:42.511678+00	\N	\N	\N	1.00	\N	\N	\N	\N
100	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: я ответил презентацию \\n", "timestamp": "2025-08-30T18:15:10.195Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:15:10.195+00	2025-08-30 18:15:10.217365+00	\N	\N	\N	1.00	\N	\N	\N	\N
104	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-08-30T18:34:24.920Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:34:24.921+00	2025-08-30 18:34:24.922656+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
127	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:32:27.334Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:32:27.335+00	2025-09-04 15:32:27.365822+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
105	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех:  я потренировался и круто рассказал презентацию на 500 человек ", "timestamp": "2025-08-30T18:34:54.699Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:34:54.699+00	2025-08-30 18:34:54.719374+00	7	\N	3	0.80	Сегодня у меня был успех:  я потренировался и круто рассказал презентацию на 500 человек 	\N	\N	\N
106	1	activity	{"notes": "Завершил проект связанный с ИИ", "success": true, "activity": "Завершение проекта", "category": "work", "duration": 60, "timestamp": "2025-08-30T18:35:42.608Z"}	2025-08-30 18:35:42.609+00	2025-08-30 18:35:42.62972+00	\N	\N	\N	1.00	Завершил проект связанный с ИИ	work	60	10
107	1	mood	{"mood": 7, "notes": "сегодня я рассказал презу на 500 человек и закончил проект\\n", "timestamp": "2025-08-30T18:46:35.054Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:46:35.054+00	2025-08-30 18:46:35.078474+00	7	\N	3	0.80	сегодня я рассказал презу на 500 человек и закончил проект\n	\N	\N	\N
108	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: рассказал презу и закрыл проект\\n", "timestamp": "2025-08-30T18:48:52.115Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:48:52.116+00	2025-08-30 18:48:52.139098+00	7	\N	3	0.80	Сегодня у меня был успех: рассказал презу и закрыл проект\n	\N	\N	\N
109	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: рассказал презу\\n", "timestamp": "2025-08-30T18:56:38.805Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:56:38.806+00	2025-08-30 18:56:38.826464+00	7	\N	3	0.70	Сегодня у меня был успех: рассказал презу\n	\N	\N	\N
110	1	mood	{"mood": 7, "notes": "потренировался", "timestamp": "2025-08-30T18:57:23.777Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:57:23.777+00	2025-08-30 18:57:23.796048+00	7	\N	3	0.60	потренировался	\N	\N	\N
111	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех:  поиграл в кс теперь хочу поработать\\n", "timestamp": "2025-08-30T18:57:58.754Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:57:58.754+00	2025-08-30 18:57:58.773605+00	7	\N	3	0.80	Сегодня у меня был успех:  поиграл в кс теперь хочу поработать\n	\N	\N	\N
112	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: подрочил\\n", "timestamp": "2025-08-30T18:59:09.071Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 18:59:09.071+00	2025-08-30 18:59:09.093754+00	7	\N	3	0.70	Сегодня у меня был успех: подрочил\n	\N	\N	\N
113	1	mood	{"mood": 7, "notes": "потренировался и готов работать\\n", "timestamp": "2025-08-30T19:01:49.997Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-30 19:01:49.997+00	2025-08-30 19:01:50.021544+00	7	\N	3	0.70	потренировался и готов работать\n	\N	\N	\N
114	1	mood	{"mood": 7, "notes": "привет", "timestamp": "2025-08-31T13:35:58.307Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-31 13:35:58.307+00	2025-08-31 13:35:58.325279+00	7	\N	3	0.50	привет	\N	\N	\N
115	1	mood	{"mood": 7, "notes": "привет я сделал презентацию\\n", "timestamp": "2025-08-31T13:39:02.314Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-31 13:39:02.315+00	2025-08-31 13:39:02.335787+00	7	\N	3	0.70	привет я сделал презентацию\n	\N	\N	\N
116	1	mood	{"mood": 7, "notes": "привет я сделал презу\\n", "timestamp": "2025-08-31T13:39:56.172Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-31 13:39:56.172+00	2025-08-31 13:39:56.204396+00	7	\N	3	0.70	привет я сделал презу\n	\N	\N	\N
117	1	mood	{"mood": 7, "notes": "привет я сделал презу\\n", "timestamp": "2025-08-31T13:39:57.480Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-08-31 13:39:57.48+00	2025-08-31 13:39:57.482644+00	7	\N	3	0.70	привет я сделал презу\n	\N	\N	\N
118	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:18:35.567Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:18:35.568+00	2025-09-04 15:18:35.570598+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
119	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:19:25.833Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:19:25.833+00	2025-09-04 15:19:25.834975+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
120	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:19:48.637Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:19:48.637+00	2025-09-04 15:19:48.657312+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
121	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:20:20.819Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:20:20.819+00	2025-09-04 15:20:20.82174+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
122	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:20:48.311Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:20:48.311+00	2025-09-04 15:20:48.330941+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
123	1	activity	{"notes": "FDSFS", "success": true, "activity": "FSDSDF", "category": "work", "duration": 60, "timestamp": "2025-09-04T15:21:16.341Z"}	2025-09-04 15:21:16.342+00	2025-09-04 15:21:16.361633+00	\N	\N	\N	0.90	FDSFS	work	60	5
124	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:23:11.091Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:23:11.091+00	2025-09-04 15:23:11.109687+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
125	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:23:14.114Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:23:14.114+00	2025-09-04 15:23:14.116126+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
126	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:24:09.769Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:24:09.769+00	2025-09-04 15:24:09.79597+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
161	1	mood	{"mood": "Отличное", "notes": "Завершил проект досрочно", "stressLevel": 2}	2025-09-08 01:27:32.78+00	2025-09-08 16:38:41.318926+00	\N	\N	\N	1.00	\N	\N	\N	\N
128	1	mood	{"mood": 7, "notes": "Сегодня у меня был успех: ", "timestamp": "2025-09-04T15:33:23.306Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:33:23.306+00	2025-09-04 15:33:23.359892+00	7	\N	3	0.70	Сегодня у меня был успех: 	\N	\N	\N
129	1	mood	{"mood": 7, "notes": "сегодня я потренировался и поиграл \\n", "timestamp": "2025-09-04T15:34:06.240Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:34:06.24+00	2025-09-04 15:34:06.268344+00	7	\N	3	0.70	сегодня я потренировался и поиграл \n	\N	\N	\N
130	1	activity	{"notes": "аываы", "success": true, "activity": "аываы", "category": "learning", "duration": 60, "timestamp": "2025-09-04T15:34:48.688Z"}	2025-09-04 15:34:48.689+00	2025-09-04 15:34:48.708809+00	\N	\N	\N	0.90	аываы	learning	60	5
131	1	mood	{"mood": 7, "notes": "привет сегодня потренировался и поиграл теперь иду работать", "timestamp": "2025-09-04T15:38:29.490Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:38:29.49+00	2025-09-04 15:38:29.517882+00	7	\N	3	0.80	привет сегодня потренировался и поиграл теперь иду работать	\N	\N	\N
132	1	mood	{"mood": 7, "notes": "сделал проект", "timestamp": "2025-09-04T15:45:37.850Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-04 15:45:37.851+00	2025-09-04 15:45:37.872807+00	7	\N	3	0.60	сделал проект	\N	\N	\N
133	1	mood	{"mood": "Хорошее", "notes": "Продуктивный день, но немного устал", "stressLevel": 3}	2025-09-04 10:18:10.361+00	2025-09-08 16:30:33.301941+00	\N	\N	\N	1.00	\N	\N	\N	\N
134	1	mood	{"mood": "Отличное", "notes": "Завершил проект досрочно", "stressLevel": 2}	2025-09-05 12:24:29.156+00	2025-09-08 16:30:33.328182+00	\N	\N	\N	1.00	\N	\N	\N	\N
135	1	mood	{"mood": "Средне", "notes": "Много задач, мало времени", "stressLevel": 5}	2025-09-06 00:52:47.514+00	2025-09-08 16:30:33.333728+00	\N	\N	\N	1.00	\N	\N	\N	\N
136	1	activity	{"success": true, "activity": "Йога", "category": "Спорт", "duration": 45}	2025-09-08 12:40:21.524+00	2025-09-08 16:30:33.338298+00	\N	\N	\N	1.00	\N	\N	\N	\N
137	1	activity	{"success": true, "activity": "Программирование", "category": "Работа", "duration": 120}	2025-09-03 08:35:37.899+00	2025-09-08 16:30:33.343177+00	\N	\N	\N	1.00	\N	\N	\N	\N
138	1	activity	{"success": false, "activity": "Медитация", "category": "Релакс", "duration": 15}	2025-09-08 10:53:43.235+00	2025-09-08 16:30:33.347733+00	\N	\N	\N	1.00	\N	\N	\N	\N
139	1	mood	{"mood": "Хорошее", "notes": "Продуктивный день, но немного устал", "stressLevel": 3}	2025-09-03 11:21:02.443+00	2025-09-08 16:33:57.704372+00	\N	\N	\N	1.00	\N	\N	\N	\N
140	1	mood	{"mood": "Отличное", "notes": "Завершил проект досрочно", "stressLevel": 2}	2025-09-05 05:16:34.741+00	2025-09-08 16:33:57.721564+00	\N	\N	\N	1.00	\N	\N	\N	\N
141	1	mood	{"mood": "Средне", "notes": "Много задач, мало времени", "stressLevel": 5}	2025-09-03 08:13:20.371+00	2025-09-08 16:33:57.727203+00	\N	\N	\N	1.00	\N	\N	\N	\N
142	1	activity	{"success": true, "activity": "Йога", "category": "Спорт", "duration": 45}	2025-09-05 23:47:37.335+00	2025-09-08 16:33:57.731522+00	\N	\N	\N	1.00	\N	\N	\N	\N
143	1	activity	{"success": true, "activity": "Программирование", "category": "Работа", "duration": 120}	2025-09-06 12:12:25.845+00	2025-09-08 16:33:57.736023+00	\N	\N	\N	1.00	\N	\N	\N	\N
144	1	activity	{"success": false, "activity": "Медитация", "category": "Релакс", "duration": 15}	2025-09-04 11:38:37.765+00	2025-09-08 16:33:57.741475+00	\N	\N	\N	1.00	\N	\N	\N	\N
146	1	mood	{"mood": "Хорошее", "notes": "Продуктивный день, но немного устал", "stressLevel": 3}	2025-09-03 11:36:44.439+00	2025-09-08 16:35:55.819034+00	\N	\N	\N	1.00	\N	\N	\N	\N
147	1	mood	{"mood": "Отличное", "notes": "Завершил проект досрочно", "stressLevel": 2}	2025-09-07 03:32:57.69+00	2025-09-08 16:35:55.827057+00	\N	\N	\N	1.00	\N	\N	\N	\N
148	1	mood	{"mood": "Средне", "notes": "Много задач, мало времени", "stressLevel": 5}	2025-09-02 16:46:43.115+00	2025-09-08 16:35:55.834304+00	\N	\N	\N	1.00	\N	\N	\N	\N
149	1	activity	{"success": true, "activity": "Йога", "category": "Спорт", "duration": 45}	2025-09-01 23:46:50.944+00	2025-09-08 16:35:55.839631+00	\N	\N	\N	1.00	\N	\N	\N	\N
150	1	activity	{"success": true, "activity": "Программирование", "category": "Работа", "duration": 120}	2025-09-07 08:40:14.728+00	2025-09-08 16:35:55.844879+00	\N	\N	\N	1.00	\N	\N	\N	\N
151	1	activity	{"success": false, "activity": "Медитация", "category": "Релакс", "duration": 15}	2025-09-01 16:36:39.796+00	2025-09-08 16:35:55.851875+00	\N	\N	\N	1.00	\N	\N	\N	\N
152	1	preferences_free	{"tags": ["гибкость", "удаленка", "спорт", "здоровье"], "avoid": ["сверхурочные", "жесткий график"], "source": "preferences_page", "version": "1.0", "free_text": "Хочу больше гибкости в работе, возможность работать удаленно. Интересует спорт и здоровый образ жизни.", "constraints": {"time": "Гибкий график", "budget": "Средний", "format": "Смешанный"}}	2025-09-08 16:35:55.906209+00	2025-09-08 16:35:55.906209+00	\N	\N	\N	1.00	\N	\N	\N	\N
153	1	mood	{"mood": "Хорошее", "notes": "Продуктивный день, но немного устал", "stressLevel": 3}	2025-09-06 08:09:55.523+00	2025-09-08 16:36:39.924564+00	\N	\N	\N	1.00	\N	\N	\N	\N
154	1	mood	{"mood": "Отличное", "notes": "Завершил проект досрочно", "stressLevel": 2}	2025-09-03 02:50:09.054+00	2025-09-08 16:36:39.931333+00	\N	\N	\N	1.00	\N	\N	\N	\N
155	1	mood	{"mood": "Средне", "notes": "Много задач, мало времени", "stressLevel": 5}	2025-09-05 20:01:31.093+00	2025-09-08 16:36:39.935551+00	\N	\N	\N	1.00	\N	\N	\N	\N
156	1	activity	{"success": true, "activity": "Йога", "category": "Спорт", "duration": 45}	2025-09-02 17:31:23.648+00	2025-09-08 16:36:39.941276+00	\N	\N	\N	1.00	\N	\N	\N	\N
157	1	activity	{"success": true, "activity": "Программирование", "category": "Работа", "duration": 120}	2025-09-06 13:39:13.944+00	2025-09-08 16:36:39.947146+00	\N	\N	\N	1.00	\N	\N	\N	\N
158	1	activity	{"success": false, "activity": "Медитация", "category": "Релакс", "duration": 15}	2025-09-04 18:18:09.504+00	2025-09-08 16:36:39.951213+00	\N	\N	\N	1.00	\N	\N	\N	\N
159	1	preferences_free	{"tags": ["гибкость", "удаленка", "спорт", "здоровье"], "avoid": ["сверхурочные", "жесткий график"], "source": "preferences_page", "version": "1.0", "free_text": "Хочу больше гибкости в работе, возможность работать удаленно. Интересует спорт и здоровый образ жизни.", "constraints": {"time": "Гибкий график", "budget": "Средний", "format": "Смешанный"}}	2025-09-08 16:36:40.000856+00	2025-09-08 16:36:40.000856+00	\N	\N	\N	1.00	\N	\N	\N	\N
160	1	mood	{"mood": "Хорошее", "notes": "Продуктивный день, но немного устал", "stressLevel": 3}	2025-09-07 07:08:24.527+00	2025-09-08 16:38:41.309159+00	\N	\N	\N	1.00	\N	\N	\N	\N
164	1	activity	{"success": true, "activity": "Программирование", "category": "Работа", "duration": 120}	2025-09-03 12:56:33.92+00	2025-09-08 16:38:41.339193+00	\N	\N	\N	1.00	\N	\N	\N	\N
165	1	activity	{"success": false, "activity": "Медитация", "category": "Релакс", "duration": 15}	2025-09-08 15:47:29.846+00	2025-09-08 16:38:41.346958+00	\N	\N	\N	1.00	\N	\N	\N	\N
166	1	preferences_free	{"tags": ["гибкость", "удаленка", "спорт", "здоровье"], "avoid": ["сверхурочные", "жесткий график"], "source": "preferences_page", "version": "1.0", "free_text": "Хочу больше гибкости в работе, возможность работать удаленно. Интересует спорт и здоровый образ жизни.", "constraints": {"time": "Гибкий график", "budget": "Средний", "format": "Смешанный"}}	2025-09-08 16:38:41.405519+00	2025-09-08 16:38:41.405519+00	\N	\N	\N	1.00	\N	\N	\N	\N
167	1	mood	{"mood": "Хорошее", "notes": "Продуктивный день, но немного устал", "stressLevel": 3}	2025-09-06 09:28:58.29+00	2025-09-08 16:39:15.398212+00	\N	\N	\N	1.00	\N	\N	\N	\N
168	1	mood	{"mood": "Отличное", "notes": "Завершил проект досрочно", "stressLevel": 2}	2025-09-07 03:37:31.385+00	2025-09-08 16:39:15.406922+00	\N	\N	\N	1.00	\N	\N	\N	\N
169	1	mood	{"mood": "Средне", "notes": "Много задач, мало времени", "stressLevel": 5}	2025-09-05 00:17:50.901+00	2025-09-08 16:39:15.413081+00	\N	\N	\N	1.00	\N	\N	\N	\N
170	1	activity	{"success": true, "activity": "Йога", "category": "Спорт", "duration": 45}	2025-09-04 18:59:07.17+00	2025-09-08 16:39:15.420806+00	\N	\N	\N	1.00	\N	\N	\N	\N
171	1	activity	{"success": true, "activity": "Программирование", "category": "Работа", "duration": 120}	2025-09-07 12:23:57.99+00	2025-09-08 16:39:15.427591+00	\N	\N	\N	1.00	\N	\N	\N	\N
172	1	activity	{"success": false, "activity": "Медитация", "category": "Релакс", "duration": 15}	2025-09-04 13:59:45.532+00	2025-09-08 16:39:15.433035+00	\N	\N	\N	1.00	\N	\N	\N	\N
173	1	preferences_free	{"tags": ["гибкость", "удаленка", "спорт", "здоровье"], "avoid": ["сверхурочные", "жесткий график"], "source": "preferences_page", "version": "1.0", "free_text": "Хочу больше гибкости в работе, возможность работать удаленно. Интересует спорт и здоровый образ жизни.", "constraints": {"time": "Гибкий график", "budget": "Средний", "format": "Смешанный"}}	2025-09-08 16:39:15.48667+00	2025-09-08 16:39:15.48667+00	\N	\N	\N	1.00	\N	\N	\N	\N
174	1	preferences_free	{"tags": ["психология"], "avoid": ["массаж"], "source": "preferences_page", "version": "1.0", "free_text": "хочу психолога", "constraints": {"time": "day", "budget": "medium", "format": "online"}}	2025-09-08 17:14:04.223789+00	2025-09-08 17:14:04.223789+00	\N	\N	\N	1.00	\N	\N	\N	\N
175	1	preferences_free	{"tags": ["психология"], "avoid": ["вечеринки"], "source": "preferences_page", "version": "1.0", "free_text": "психолог", "constraints": {"time": "morning", "budget": "medium", "format": "offline"}}	2025-09-08 17:19:05.091599+00	2025-09-08 17:19:05.091599+00	\N	\N	\N	1.00	\N	\N	\N	\N
176	1	preferences_free	{"tags": ["психология"], "avoid": ["вечеринки"], "source": "preferences_page", "version": "1.0", "free_text": "психолог", "constraints": {"time": "morning", "budget": "medium", "format": "offline"}}	2025-09-08 17:28:38.014909+00	2025-09-08 17:28:38.014909+00	\N	\N	\N	1.00	\N	\N	\N	\N
177	1	preferences_free	{"tags": ["психология"], "avoid": ["вечеринки"], "source": "preferences_page", "version": "1.0", "free_text": "психолог", "constraints": {"time": "morning", "budget": "medium", "format": "offline"}}	2025-09-08 17:37:00.867391+00	2025-09-08 17:37:00.867391+00	\N	\N	\N	1.00	\N	\N	\N	\N
178	1	mood	{"mood": 7, "notes": "провел тренировку \\n", "timestamp": "2025-09-11T10:33:02.902Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-11 10:33:02.902+00	2025-09-11 10:33:02.921599+00	7	\N	3	0.60	провел тренировку \n	\N	\N	\N
179	1	mood	{"mood": 5, "notes": "Привет сегодня учился в рэу сейчас доделываю проект", "timestamp": "2025-09-19T15:44:26.421Z", "activities": ["daily_mood_check"], "stressLevel": 2}	2025-09-19 15:44:26.421+00	2025-09-19 15:44:26.439186+00	5	\N	2	0.80	Привет сегодня учился в рэу сейчас доделываю проект	\N	\N	\N
180	1	preferences_free	{"tags": ["психология"], "avoid": ["вечеринки"], "source": "preferences_page", "version": "1.0", "free_text": "психолог", "constraints": {"time": "morning", "budget": "medium", "format": "offline"}}	2025-09-30 11:53:26.345393+00	2025-09-30 11:53:26.345393+00	\N	\N	\N	1.00	\N	\N	\N	\N
181	1	mood	{"mood": 10, "notes": "Я сегодня защитил презентацию и сделал проект!", "timestamp": "2025-09-30T11:55:39.328Z", "activities": ["daily_mood_check"], "stressLevel": 3}	2025-09-30 11:55:39.328+00	2025-09-30 11:55:39.350793+00	10	\N	3	0.70	Я сегодня защитил презентацию и сделал проект!	\N	\N	\N
\.


--
-- Data for Name: ai_user_preferences; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.ai_user_preferences (id, user_id, analysis_frequency, privacy_level, notification_preferences, ai_personality, created_at, updated_at) FROM stdin;
1	2	daily	standard	{"push": true, "email": true, "in_app": true}	supportive	2025-08-17 18:45:02.623321+00	2025-08-17 18:45:02.623321+00
2	3	daily	standard	{"push": true, "email": true, "in_app": true}	supportive	2025-08-17 18:45:02.623321+00	2025-08-17 18:45:02.623321+00
3	1	daily	standard	{"push": true, "email": true, "in_app": true}	supportive	2025-08-17 18:45:02.623321+00	2025-08-17 18:45:02.623321+00
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.audit_log (id, actor_user_id, target_user_id, action, details, created_at) FROM stdin;
\.


--
-- Data for Name: benefit_recommendations; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.benefit_recommendations (id, user_id, benefit_id, priority, answers, created_at, explanations, confidence, algorithm_variant, score_breakdown) FROM stdin;
31	2	1	1	["health", "sports", "psychology", "health"]	2025-08-05 19:50:59.051029	[]	0.6	static	{}
32	2	4	2	["health", "sports", "psychology", "health"]	2025-08-05 19:50:59.164789	[]	0.6	static	{}
33	2	3	3	["health", "sports", "psychology", "health"]	2025-08-05 19:50:59.277592	[]	0.6	static	{}
37	3	1	1	["health", "sports", "psychology", "health"]	2025-08-05 20:12:37.671707	[]	0.6	static	{}
38	3	4	2	["health", "sports", "psychology", "health"]	2025-08-05 20:12:37.788018	[]	0.6	static	{}
39	3	3	3	["health", "sports", "psychology", "health"]	2025-08-05 20:12:37.907453	[]	0.6	static	{}
125	1	21	1	{"from": "hybrid", "tags": ["психология"]}	2025-09-30 11:53:32.378351	["запрос психолога", "студент", "проекты"]	0.85	hybrid_v1	{"final": 0.38, "ai_score": 0.95, "test_score": 0}
126	1	3	2	{"from": "hybrid", "tags": ["психология"]}	2025-09-30 11:53:32.383844	["утреннее время", "стресс-менеджмент", "офлайн"]	0.7	hybrid_v1	{"final": 0.328, "ai_score": 0.82, "test_score": 0}
127	1	10	3	{"from": "hybrid", "tags": ["психология"]}	2025-09-30 11:53:32.389312	["учёба", "проекты", "организация"]	0.65	hybrid_v1	{"final": 0.31200000000000006, "ai_score": 0.78, "test_score": 0}
\.


--
-- Data for Name: benefits; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.benefits (id, name, description, category, price_coins) FROM stdin;
1	Профилактика выгорания	Очные сессии с коучем или психологом для восстановления энергии	Здоровье	0.00
2	Режим дня и баланс работы	Индивидуальные встречи с карьерным консультантом по планированию распорядка	Здоровье	0.00
3	Правильное питание	Консультация у нутрициолога по подбору рациона и пищевых привычек	Здоровье	0.00
4	Психологическая поддержка	Офлайн-консультации у сертифицированного психолога	Здоровье	0.00
5	Массаж	Сеанс массажа для снятия напряжения и улучшения общего состояния	Здоровье	0.00
6	Здоровые привычки	Индивидуальные встречи с wellness-коучем по формированию полезных привычек	Здоровье	0.00
7	Командные виды спорта	Организованные офлайн-игры: футбол, волейбол, баскетбол	Спорт	0.00
8	Фитнес-программы	Посещение фитнес-центра или участие в офлайн-тренировках	Спорт	0.00
9	Тимбилдинг через спорт	Участие в спортивных мероприятиях и командных играх	Спорт	0.00
10	Soft-skills тренинги	Очные тренинги и мастер-классы по личной эффективности и коммуникации	Обучение	0.00
21	Корпоративный фитнес	Абонемент в зал	Здоровье	0.00
22	Онлайн‑курсы	Доступ к обучению	Обучение	0.00
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.clients (id, name, email, message, created_at, company) FROM stdin;
1	Михаил	misapolskov9@gmail.com	Я хочу льготы!	2025-05-17 00:12:31.817326	\N
2	Глеб	gleb@gmail.com	миша крут	2025-05-17 00:13:16.10428	\N
3	Мишаня	yoddleisop@gmail.com	Дайте мне льгот 	2025-05-17 00:15:47.092622	\N
4	Акго	t@gmail.com	Кап	2025-05-17 12:13:40.391105	\N
5	Гволы	&@gnail.com	Urueh	2025-05-18 11:05:33.93618	\N
6	Святослав	svyat1134@gmail.com	Че там как?	2025-05-31 15:15:49.687106	\N
7	>kbz	ertyuikl@mail.ru	Hellooo	2025-07-04 11:15:04.976636	\N
8	Полшков Михаил Андреевич	misapolskov9@gmail.com	Привет	2025-07-10 17:11:16.13187	Botanichka
9	admin@gmail.com	misapolskov9@gmail.com	выфвфвыф	2025-07-10 17:59:08.119362	\N
10	Глебас	ddddd.dddd@yandex.ru	Privet	2025-07-11 21:38:39.517272	\N
11	admin@gmail.com 	misapolskov9@gmail.com	newnew\n	2025-07-15 16:31:06.201781	\N
12	VPN Test	test@vpn.com	Testing without VPN interference	2025-08-06 16:42:56.986019	VPN Company
13	admin@gmail.com	misapolskov9@gmail.com	выфвфы	2025-08-06 16:45:09.929671	\N
14	Test User	test@test.com	Test message	2025-08-06 17:18:27.015554	Test Company
15	Test User	test@test.com	Test message	2025-08-06 17:30:38.761916	Test Company
16	admin@gmail.com	misapolskov9@gmail.com	счяся	2025-08-13 21:21:39.989896	\N
17	Михаил 	test@gmail.com	тестируем сообщения	2025-08-25 14:37:44.636841	test
18	test@gmail.com	misapolskov9@gmail.com	test	2025-08-25 14:48:05.412802	yoddle
\.


--
-- Data for Name: coin_transactions; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.coin_transactions (id, user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at) FROM stdin;
1	1	credit	25.00	0.00	25.00	Покупка льготы: Корпоративный фитнес	\N	\N	2025-08-06 16:20:34.9907
5	1	credit	100.00	10150.00	10250.00	Тестовое пополнение баланса	\N	\N	2025-08-06 16:23:24.608259
6	1	credit	25.00	10350.00	10375.00	Покупка льготы: Корпоративный фитнес	\N	\N	2025-08-06 16:23:24.708098
7	1	credit	25.00	10400.00	10425.00	Покупка льготы: Корпоративный фитнес	\N	\N	2025-08-06 16:26:11.132369
8	1	credit	100.00	10450.00	10550.00	Test	\N	\N	2025-08-06 16:26:38.310425
9	1	monthly_allowance	10000.00	0.00	10000.00	Тестовое начисление за месяц	\N	\N	2025-08-09 18:52:24.906708
10	1	benefit_purchase	1500.00	10000.00	8500.00	Покупка льготы: Корпоративный фитнес	1	\N	2025-08-09 18:52:24.906708
11	1	benefit_purchase	700.00	8500.00	7800.00	Покупка льготы: Онлайн-курсы	2	\N	2025-08-09 18:52:24.906708
12	1	debit	300.00	7800.00	7500.00	Сгорание неиспользованного остатка	\N	\N	2025-08-09 18:52:24.906708
13	1	monthly_allowance	10000.00	0.00	10000.00	Тестовое начисление за месяц	\N	\N	2025-08-06 19:08:03.083306
14	1	benefit_purchase	1500.00	10000.00	8500.00	Покупка льготы: Корпоративный фитнес	21	\N	2025-08-07 19:08:03.083306
15	1	benefit_purchase	700.00	8500.00	7800.00	Покупка льготы: Онлайн‑курсы	22	\N	2025-08-08 19:08:03.083306
16	1	debit	300.00	7800.00	7500.00	Сгорание неиспользованного остатка	\N	\N	2025-08-09 07:08:03.083306
17	1	credit	700.00	7800.00	8500.00	Возврат: Покупка льготы: Онлайн-курсы	11	\N	2025-08-09 19:44:26.569154
26	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Здоровые привычки	6	\N	2025-08-13 22:06:14.127088
29	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Массаж	5	\N	2025-08-13 22:07:14.480942
36	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Психологическая поддержка	4	\N	2025-08-13 22:42:40.548604
37	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Командные виды спорта	7	\N	2025-08-13 22:44:12.98382
38	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Фитнес-программы	8	\N	2025-08-13 22:51:05.808833
40	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Здоровые привычки	6	\N	2025-08-13 23:13:15.630426
41	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Здоровые привычки	6	\N	2025-08-13 23:13:43.663375
42	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Здоровые привычки	6	\N	2025-08-13 23:14:00.587563
43	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Здоровые привычки	6	\N	2025-08-13 23:14:09.696092
44	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Корпоративный фитнес	21	\N	2025-08-13 23:14:37.924156
45	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Корпоративный фитнес	21	\N	2025-08-13 23:33:57.822487
46	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Массаж	5	\N	2025-08-13 23:37:52.95766
47	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Корпоративный фитнес	21	\N	2025-08-13 23:42:05.389931
48	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Корпоративный фитнес	21	\N	2025-08-13 23:56:57.650504
49	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Корпоративный фитнес	21	\N	2025-08-13 23:59:49.773321
51	1	refund	0.00	15975.00	15975.00	Возврат: Покупка льготы: Корпоративный фитнес	49	\N	2025-08-14 00:04:18.838158
52	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Здоровые привычки	6	\N	2025-08-14 00:06:25.443214
53	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Профилактика выгорания	1	\N	2025-08-14 00:06:32.993207
54	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Массаж	5	\N	2025-08-27 07:41:28.083554
55	1	benefit_purchase	0.00	15975.00	15975.00	Покупка льготы: Корпоративный фитнес	21	\N	2025-09-06 14:03:50.050274
56	1	refund	0.00	15975.00	15975.00	Возврат: Покупка льготы: Корпоративный фитнес	55	\N	2025-09-06 14:03:50.553772
\.


--
-- Data for Name: company_plans; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.company_plans (id, company_name, employee_count, monthly_rate, coins_per_employee, plan_start_date, plan_end_date, is_active, created_at, updated_at, allowance_day, carryover_policy, max_balance, timezone) FROM stdin;
1	Demo Co	10	300.00	10000.00	2025-08-09	\N	t	2025-08-09 19:08:03.083306	2025-08-09 19:08:03.083306	10	none	\N	Europe/Moscow
\.


--
-- Data for Name: enter; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.enter (id, login, password, phone, "position", avatar_url, name, company_id, is_admin, balance) FROM stdin;
2	test@gmail.com	$2a$12$wXlPrXkgJRt.FYb7Kcnm.O2fjURWV5aaho8tpTAGx1M.jf696eOaK	423423424	Секретарь	data:image/jpeg;base64,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	Елена	\N	f	0.00
3	andrei@gmail.com	a	+7-999-123-45-67	Разработчик	\N	Андрей	\N	f	0.00
1	admin@gmail.com	$2a$12$QBiM.dK4HGiQsD5YExRex.Tsmr0Ub.Hk3YE7VZniQl/Pssath/P3C	89158763458	CEO	data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//2Q==	Михаил	1	f	0.00
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.feedback (id, user_id, rating, comment, created_at) FROM stdin;
1	test-user-1	5	Отличная компания! Хорошие условия работы, дружный коллектив и интересные проекты. Рекомендую всем!	2025-06-29 17:06:45.617568+00
2	test-user-2	4	В целом доволен работой. Есть возможности для профессионального роста, но хотелось бы больше гибкости в графике.	2025-06-26 17:06:45.617568+00
3	test-user-3	5	Прекрасная атмосфера в офисе! Руководство всегда поддерживает инициативы сотрудников. Благодарен за возможность работать здесь.	2025-06-24 17:06:45.617568+00
4	test-user-4	3	Средняя компания. Есть как плюсы, так и минусы. Зарплата выплачивается вовремя, но не хватает корпоративных мероприятий.	2025-06-21 17:06:45.617568+00
5	test-user-5	4	Хорошие льготы и социальные гарантии. Особенно понравилась программа медицинского страхования. Однако офис мог бы быть побольше.	2025-06-17 17:06:45.617568+00
6	1	5	Топовая Компания Я ЕЕ ЛЮБЛЮ!!!!	2025-07-01 17:08:50.637538+00
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.news (id, title, content, excerpt, category_id, author, image_url, status, is_featured, publish_date, views_count, created_at, updated_at) FROM stdin;
1	Новая функция: умные рекомендации льгот	Мы запустили систему тестов, которая анализирует предпочтения сотрудников и предлагает персонализированные льготы. Система учитывает историю использования льгот, профиль сотрудника и его активность в системе. Можете протестировать на странице предпочтений!\r\n\r\nНовые возможности:\r\n\r\n• Анализ эффективности льгот для каждого сотрудника и персональные рекомендации\r\n• Автоматические уведомления о подходящих предложениях\r\n\r\n\r\nТеперь каждый сотрудник получает рекомендации, основанные на его уникальных потребностях и предпочтениях.	Запущена система для персонализированных рекомендаций льгот сотрудникам	1	Команда Yoddle	\N	published	t	2025-07-01 15:51:09.94132+00	0	2025-07-01 15:51:09.94132+00	2025-07-01 16:44:45.241347+00
\.


--
-- Data for Name: news_categories; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.news_categories (id, name, description, color_code, icon, sort_order, is_active, created_at, updated_at) FROM stdin;
1	Продукт	Обновления продукта и новые функции	#750000	package	1	t	2025-07-01 15:51:09.94132+00	2025-07-01 15:51:09.94132+00
2	Интеграция	Интеграции с внешними сервисами	#2E8B57	link	2	t	2025-07-01 15:51:09.94132+00	2025-07-01 15:51:09.94132+00
3	Геймификация	Обновления системы достижений и наград	#FF6347	trophy	3	t	2025-07-01 15:51:09.94132+00	2025-07-01 15:51:09.94132+00
4	Партнерства	Новые партнеры и сотрудничество	#4682B4	handshake	4	t	2025-07-01 15:51:09.94132+00	2025-07-01 15:51:09.94132+00
5	Анонс	Анонсы предстоящих функций	#9370DB	megaphone	5	t	2025-07-01 15:51:09.94132+00	2025-07-01 15:51:09.94132+00
6	Компания	Новости о компании и команде	#FF8C00	building	6	t	2025-07-01 15:51:09.94132+00	2025-07-01 15:51:09.94132+00
\.


--
-- Data for Name: notification_types; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.notification_types (id, name, icon, color, description, created_at) FROM stdin;
1	news	Newspaper	#750000	Новости и обновления	2025-07-03 16:01:42.583829
2	benefit	Gift	#2563eb	Новые льготы и программы	2025-07-03 16:01:42.583829
3	achievement	Trophy	#f59e0b	Достижения и награды	2025-07-03 16:01:42.583829
4	system	Settings	#6b7280	Системные уведомления	2025-07-03 16:01:42.583829
5	reminder	Clock	#8b5cf6	Напоминания и дедлайны	2025-07-03 16:01:42.583829
6	update	Download	#10b981	Обновления платформы	2025-07-03 16:01:42.583829
7	productivity_level_up	TrendingUp	#10B981	Повышение уровня продуктивности	2025-08-25 15:37:55.185395
8	productivity_achievement	Trophy	#F59E0B	Новое достижение продуктивности	2025-08-25 15:37:55.185395
9	productivity_reminder	Clock	#8B5CF6	Напоминание о продуктивности	2025-08-25 15:37:55.185395
10	productivity_report	BarChart3	#3B82F6	Еженедельный отчет продуктивности	2025-08-25 15:37:55.185395
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.notifications (id, type_id, title, message, user_id, is_read, is_global, link_url, priority, expires_at, created_at, read_at) FROM stdin;
3	2	Новая льгота: Массаж	Добавлена программа массажа для снятия стресса	\N	f	t	/my-benefits	2	\N	2025-07-03 16:01:42.583829	\N
4	2	Обновление льгот	Расширена программа психологической поддержки	\N	f	t	/my-benefits	1	\N	2025-07-03 16:01:42.583829	\N
5	3	Поздравляем!	Вы достигли уровня "Активный пользователь"	\N	f	f	/progress	3	\N	2025-07-03 16:01:42.583829	\N
6	3	Новое достижение	Разблокировано: "Первые шаги в wellness"	\N	f	f	/progress	2	\N	2025-07-03 16:01:42.583829	\N
8	5	Пройдите тест предпочтений	Обновите свои предпочтения для лучших рекомендаций	\N	f	f	/preferences	2	\N	2025-07-03 16:01:42.583829	\N
9	6	Обновление платформы	Доступна новая версия с улучшенным интерфейсом	\N	f	t	\N	1	\N	2025-07-03 16:01:42.583829	\N
\.


--
-- Data for Name: productivity_achievements; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.productivity_achievements (id, code, name, description, category, requirement_type, requirement_value, xp_reward, icon, tier, is_active, created_at) FROM stdin;
1	daily_mood_master	Мастер настроения	Ведите дневник настроения 7 дней подряд	consistency	streak	7	100	calendar	bronze	t	2025-08-25 15:37:55.021247+00
2	mood_stability	Стабильность	Настроение не меняется более чем на 2 балла за неделю	mood	stability	7	150	trending-up	silver	t	2025-08-25 15:37:55.021247+00
3	energy_boost	Энерджайзер	Поддерживайте энергию выше 7 баллов 5 дней подряд	energy	streak	5	200	zap	silver	t	2025-08-25 15:37:55.021247+00
4	stress_master	Антистресс	Снизьте стресс на 3 балла за неделю	stress	improvement	3	250	shield	gold	t	2025-08-25 15:37:55.021247+00
5	quality_writer	Качественные заметки	Напишите 10 заметок длиной более 30 символов	quality	count	10	75	pen-tool	bronze	t	2025-08-25 15:37:55.021247+00
6	productivity_streak	Продуктивная неделя	Получите рейтинг продуктивности выше 7.0 за 7 дней	productivity	streak	7	300	trophy	gold	t	2025-08-25 15:37:55.021247+00
7	ai_insights_collector	AI Аналитик	Получите 20 AI инсайтов за месяц	ai	count	20	150	brain	silver	t	2025-08-25 15:37:55.021247+00
8	benefit_explorer	Исследователь льгот	Используйте 5 разных льгот за месяц	benefits	count	5	200	gift	silver	t	2025-08-25 15:37:55.021247+00
9	FIRST_MOOD	Первые шаги	Записали первое настроение	mood	count	1	10	🎯	bronze	t	2025-08-25 15:42:55.509067+00
10	MOOD_STREAK_7	Неделя настроения	7 дней подряд записываете настроение	mood	streak	7	50	🔥	silver	t	2025-08-25 15:42:55.509067+00
11	MOOD_STREAK_30	Месяц настроения	30 дней подряд записываете настроение	mood	streak	30	200	⭐	gold	t	2025-08-25 15:42:55.509067+00
12	QUALITY_NOTES	Качественные заметки	10 заметок длиной от 30 символов	quality	count	10	75	✍️	silver	t	2025-08-25 15:42:55.509067+00
13	ACTIVITY_MASTER	Мастер активности	50 записей активности	activity	count	50	150	🚀	gold	t	2025-08-25 15:42:55.509067+00
14	STRESS_MANAGER	Управление стрессом	Снизили стресс на 3 балла за неделю	stress	improvement	3	100	🧘	silver	t	2025-08-25 15:42:55.509067+00
15	ENERGY_BOOST	Энергия жизни	Поддерживаете энергию выше 7 баллов неделю	energy	stability	7	80	⚡	silver	t	2025-08-25 15:42:55.509067+00
16	PRODUCTIVITY_LEGEND	Легенда продуктивности	Достигли максимального уровня	legend	level	10	500	👑	platinum	t	2025-08-25 15:42:55.509067+00
\.


--
-- Data for Name: productivity_levels; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.productivity_levels (id, level_name, min_score, max_score, xp_multiplier, icon, color_code, description, tier, created_at) FROM stdin;
1	Новичок	0.00	3.00	1.00	sprout	#8B4513	Начинающий путь к продуктивности	bronze	2025-08-25 15:37:55.00821+00
2	Стажер	3.10	5.00	1.10	rocket	#4682B4	Стабильный прогресс	silver	2025-08-25 15:37:55.00821+00
3	Специалист	5.10	7.00	1.20	star	#FFD700	Опытный пользователь	silver	2025-08-25 15:37:55.00821+00
4	Эксперт	7.10	8.50	1.30	crown	#FF6347	Высокий уровень продуктивности	gold	2025-08-25 15:37:55.00821+00
5	Мастер	8.60	10.00	1.50	gem	#9370DB	Максимальная продуктивность	platinum	2025-08-25 15:37:55.00821+00
\.


--
-- Data for Name: productivity_scores; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.productivity_scores (id, user_id, date, daily_score, mood_component, activity_component, quality_multiplier, platform_activity_coefficient, final_score, mood_entries_count, activity_entries_count, quality_penalties, created_at) FROM stdin;
4	3	2025-08-21	5.34	14.33	0.50	1.00	0.30	5.34	2	1	0	2025-08-27 17:18:39.296527+00
8	3	2025-08-23	4.38	11.67	0.50	1.00	0.30	4.38	2	1	0	2025-08-27 17:18:39.345776+00
11	3	2025-08-24	5.10	13.67	0.50	1.00	0.30	5.10	2	1	0	2025-08-27 17:18:39.353993+00
14	3	2025-08-25	5.70	15.33	0.50	1.00	0.30	5.70	2	1	0	2025-08-27 17:18:39.361149+00
18	3	2025-08-22	3.92	16.33	0.00	1.00	0.20	3.92	2	0	0	2025-08-27 17:22:12.922823+00
21	3	2025-08-26	4.16	17.33	0.00	1.00	0.20	4.16	2	0	0	2025-08-27 17:22:12.941847+00
24	3	2025-08-27	5.10	13.67	0.50	1.00	0.30	5.10	2	1	0	2025-08-27 17:22:12.954896+00
1	1	2025-08-27	0.00	0.00	0.00	1.00	0.70	0.00	6	0	0	2025-08-27 18:27:06.928632+00
31	1	2025-08-30	0.00	0.00	0.00	1.00	0.40	0.00	4	0	0	2025-08-30 18:15:10.217365+00
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.user_achievements (id, user_id, achievement_id, unlocked_at) FROM stdin;
1	1	first_login	2025-06-25 16:40:58.579017
2	1	first_benefit	2025-06-25 16:40:58.579017
3	1	xp_100	2025-07-07 15:45:41.015453
4	1	xp_500	2025-07-07 15:45:41.130962
5	1	night_owl	2025-07-07 20:21:45.8085
6	1	profile_complete	2025-07-07 20:31:26.58225
7	1	xp_1000	2025-07-07 20:41:49.854358
8	1	login_streak_3	2025-07-09 02:07:14.638241
9	1	weekend_warrior	2025-07-13 00:15:47.934242
10	2	first_login	2025-07-28 21:02:59.354093
11	2	xp_100	2025-08-05 19:29:09.687527
12	2	night_owl	2025-08-05 19:29:11.951477
13	3	first_login	2025-08-06 21:41:55.694581
14	3	xp_100	2025-08-06 21:41:57.946883
15	3	night_owl	2025-08-06 21:41:58.400595
\.


--
-- Data for Name: user_balance; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.user_balance (id, user_id, balance, total_earned, total_spent, created_at, updated_at) FROM stdin;
7	3	0.00	0.00	0.00	2025-08-06 16:27:39.950653	2025-08-06 16:27:39.950653
51	2	0.00	0.00	0.00	2025-08-27 17:12:43.59672	2025-08-27 17:12:43.59672
1	1	15975.00	20975.00	5000.00	2025-08-06 16:19:48.860782	2025-09-06 14:03:50.651575
\.


--
-- Data for Name: user_benefits; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.user_benefits (user_id, benefit_id) FROM stdin;
2	3
2	4
3	5
3	6
1	6
1	1
1	5
\.


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.user_progress (id, user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at, productivity_score, weekly_productivity, monthly_productivity, mood_stability, energy_consistency, stress_management, last_mood_check, daily_entries_count, weekly_entries_count, productivity_level, productivity_tier) FROM stdin;
15692	3	590	6	2	8	0	100	2025-08-27 17:27:19.300508	2025-08-27 17:27:19.300508	2025-08-27 17:27:19.300508	0.00	0.00	0.00	0.00	0.00	0.00	\N	0	0	Новичок	bronze
15670	2	175	2	1	3	0	100	2025-08-27 17:12:43.916366	2025-08-27 17:12:43.916366	2025-08-27 17:12:43.916366	0.00	0.00	0.00	0.00	0.00	0.00	\N	0	0	Новичок	bronze
15700	1	1635	17	1	32	0	100	2025-10-23 07:52:15.055611	2025-10-23 07:52:15.055611	2025-10-23 07:52:15.055611	0.00	0.00	0.00	0.00	0.00	0.00	\N	0	0	Новичок	bronze
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: f1111323_yoddle
--

COPY public.user_roles (user_id, role) FROM stdin;
\.


--
-- Name: achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.achievements_id_seq', 15, true);


--
-- Name: activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.activity_log_id_seq', 8203, true);


--
-- Name: activity_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.activity_types_id_seq', 18, true);


--
-- Name: ai_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.ai_feedback_id_seq', 8, true);


--
-- Name: ai_insights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.ai_insights_id_seq', 365, true);


--
-- Name: ai_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.ai_metrics_id_seq', 4, true);


--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.ai_recommendations_id_seq', 43, true);


--
-- Name: ai_signals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.ai_signals_id_seq', 181, true);


--
-- Name: ai_user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.ai_user_preferences_id_seq', 5, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 1, false);


--
-- Name: benefit_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.benefit_recommendations_id_seq', 127, true);


--
-- Name: benefits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.benefits_id_seq', 22, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.clients_id_seq', 18, true);


--
-- Name: coin_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.coin_transactions_id_seq', 56, true);


--
-- Name: company_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.company_plans_id_seq', 1, true);


--
-- Name: enter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.enter_id_seq', 3, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.feedback_id_seq', 6, true);


--
-- Name: news_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.news_categories_id_seq', 6, true);


--
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.news_id_seq', 6, true);


--
-- Name: notification_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.notification_types_id_seq', 14, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.notifications_id_seq', 9, true);


--
-- Name: productivity_achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.productivity_achievements_id_seq', 16, true);


--
-- Name: productivity_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.productivity_levels_id_seq', 5, true);


--
-- Name: productivity_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.productivity_scores_id_seq', 37, true);


--
-- Name: user_achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.user_achievements_id_seq', 22, true);


--
-- Name: user_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.user_balance_id_seq', 54, true);


--
-- Name: user_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: f1111323_yoddle
--

SELECT pg_catalog.setval('public.user_progress_id_seq', 15701, true);


--
-- Name: achievements achievements_code_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_code_key UNIQUE (code);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: activity_types activity_types_action_code_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.activity_types
    ADD CONSTRAINT activity_types_action_code_key UNIQUE (action_code);


--
-- Name: activity_types activity_types_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.activity_types
    ADD CONSTRAINT activity_types_pkey PRIMARY KEY (id);


--
-- Name: ai_feedback ai_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_pkey PRIMARY KEY (id);


--
-- Name: ai_insights ai_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_pkey PRIMARY KEY (id);


--
-- Name: ai_metrics ai_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_metrics
    ADD CONSTRAINT ai_metrics_pkey PRIMARY KEY (id);


--
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);


--
-- Name: ai_signals ai_signals_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_signals
    ADD CONSTRAINT ai_signals_pkey PRIMARY KEY (id);


--
-- Name: ai_user_preferences ai_user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_user_preferences
    ADD CONSTRAINT ai_user_preferences_pkey PRIMARY KEY (id);


--
-- Name: ai_user_preferences ai_user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_user_preferences
    ADD CONSTRAINT ai_user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: benefit_recommendations benefit_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefit_recommendations
    ADD CONSTRAINT benefit_recommendations_pkey PRIMARY KEY (id);


--
-- Name: benefit_recommendations benefit_recommendations_user_id_benefit_id_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefit_recommendations
    ADD CONSTRAINT benefit_recommendations_user_id_benefit_id_key UNIQUE (user_id, benefit_id);


--
-- Name: benefits benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefits
    ADD CONSTRAINT benefits_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: coin_transactions coin_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_pkey PRIMARY KEY (id);


--
-- Name: company_plans company_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.company_plans
    ADD CONSTRAINT company_plans_pkey PRIMARY KEY (id);


--
-- Name: enter enter_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.enter
    ADD CONSTRAINT enter_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_user_id_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_key UNIQUE (user_id);


--
-- Name: news_categories news_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.news_categories
    ADD CONSTRAINT news_categories_name_key UNIQUE (name);


--
-- Name: news_categories news_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.news_categories
    ADD CONSTRAINT news_categories_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: notification_types notification_types_name_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.notification_types
    ADD CONSTRAINT notification_types_name_key UNIQUE (name);


--
-- Name: notification_types notification_types_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.notification_types
    ADD CONSTRAINT notification_types_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: productivity_achievements productivity_achievements_code_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_achievements
    ADD CONSTRAINT productivity_achievements_code_key UNIQUE (code);


--
-- Name: productivity_achievements productivity_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_achievements
    ADD CONSTRAINT productivity_achievements_pkey PRIMARY KEY (id);


--
-- Name: productivity_levels productivity_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_levels
    ADD CONSTRAINT productivity_levels_pkey PRIMARY KEY (id);


--
-- Name: productivity_scores productivity_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_scores
    ADD CONSTRAINT productivity_scores_pkey PRIMARY KEY (id);


--
-- Name: productivity_scores productivity_scores_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_scores
    ADD CONSTRAINT productivity_scores_user_id_date_key UNIQUE (user_id, date);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_user_id_achievement_id_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);


--
-- Name: user_balance user_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_balance
    ADD CONSTRAINT user_balance_pkey PRIMARY KEY (id);


--
-- Name: user_balance user_balance_user_id_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_balance
    ADD CONSTRAINT user_balance_user_id_key UNIQUE (user_id);


--
-- Name: user_benefits user_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_benefits
    ADD CONSTRAINT user_benefits_pkey PRIMARY KEY (user_id, benefit_id);


--
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (id);


--
-- Name: user_progress user_progress_user_id_key; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role);


--
-- Name: ai_feedback_benefit_idx; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX ai_feedback_benefit_idx ON public.ai_feedback USING btree (benefit_id);


--
-- Name: ai_feedback_created_idx; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX ai_feedback_created_idx ON public.ai_feedback USING btree (created_at);


--
-- Name: ai_feedback_user_idx; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX ai_feedback_user_idx ON public.ai_feedback USING btree (user_id);


--
-- Name: idx_achievements_active; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_achievements_active ON public.achievements USING btree (is_active, tier, xp_reward);


--
-- Name: idx_achievements_code; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_achievements_code ON public.achievements USING btree (code);


--
-- Name: idx_achievements_requirement_type; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_achievements_requirement_type ON public.achievements USING btree (requirement_type);


--
-- Name: idx_activity_log_action; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_log_action ON public.activity_log USING btree (action);


--
-- Name: idx_activity_log_activity_type_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_log_activity_type_id ON public.activity_log USING btree (activity_type_id);


--
-- Name: idx_activity_log_created_at; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_log_created_at ON public.activity_log USING btree (created_at);


--
-- Name: idx_activity_log_user_action; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_log_user_action ON public.activity_log USING btree (user_id, action);


--
-- Name: idx_activity_log_user_created_at; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_log_user_created_at ON public.activity_log USING btree (user_id, created_at);


--
-- Name: idx_activity_log_user_date; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_log_user_date ON public.activity_log USING btree (user_id, created_at);


--
-- Name: idx_activity_log_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_log_user_id ON public.activity_log USING btree (user_id);


--
-- Name: idx_activity_log_user_year_month; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_log_user_year_month ON public.activity_log USING btree (user_id, EXTRACT(year FROM created_at), EXTRACT(month FROM created_at));


--
-- Name: idx_activity_types_action_code; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_types_action_code ON public.activity_types USING btree (action_code);


--
-- Name: idx_activity_types_category; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_activity_types_category ON public.activity_types USING btree (category);


--
-- Name: idx_ai_insights_created_at; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_insights_created_at ON public.ai_insights USING btree (created_at);


--
-- Name: idx_ai_insights_type; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_insights_type ON public.ai_insights USING btree (type);


--
-- Name: idx_ai_insights_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_insights_user_id ON public.ai_insights USING btree (user_id);


--
-- Name: idx_ai_metrics_date; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_metrics_date ON public.ai_metrics USING btree (metric_date);


--
-- Name: idx_ai_metrics_type; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_metrics_type ON public.ai_metrics USING btree (metric_type);


--
-- Name: idx_ai_metrics_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_metrics_user_id ON public.ai_metrics USING btree (user_id);


--
-- Name: idx_ai_recommendations_category; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_recommendations_category ON public.ai_recommendations USING btree (category);


--
-- Name: idx_ai_recommendations_priority; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_recommendations_priority ON public.ai_recommendations USING btree (priority);


--
-- Name: idx_ai_recommendations_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_recommendations_user_id ON public.ai_recommendations USING btree (user_id);


--
-- Name: idx_ai_signals_timestamp; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_signals_timestamp ON public.ai_signals USING btree ("timestamp");


--
-- Name: idx_ai_signals_type; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_signals_type ON public.ai_signals USING btree (type);


--
-- Name: idx_ai_signals_type_timestamp; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_signals_type_timestamp ON public.ai_signals USING btree (type, "timestamp");


--
-- Name: idx_ai_signals_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_signals_user_id ON public.ai_signals USING btree (user_id);


--
-- Name: idx_ai_signals_user_type; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_signals_user_type ON public.ai_signals USING btree (user_id, type);


--
-- Name: idx_ai_signals_user_type_date; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_ai_signals_user_type_date ON public.ai_signals USING btree (user_id, type, "timestamp");


--
-- Name: idx_benefit_recommendations_benefit_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_benefit_recommendations_benefit_id ON public.benefit_recommendations USING btree (benefit_id);


--
-- Name: idx_benefit_recommendations_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_benefit_recommendations_user_id ON public.benefit_recommendations USING btree (user_id);


--
-- Name: idx_benefit_recommendations_user_priority; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_benefit_recommendations_user_priority ON public.benefit_recommendations USING btree (user_id, priority DESC);


--
-- Name: idx_benefits_category; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_benefits_category ON public.benefits USING btree (category);


--
-- Name: idx_benrec_user_priority; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_benrec_user_priority ON public.benefit_recommendations USING btree (user_id, priority);


--
-- Name: idx_clients_created_at; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_clients_created_at ON public.clients USING btree (created_at);


--
-- Name: idx_clients_email; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_clients_email ON public.clients USING btree (email);


--
-- Name: idx_coin_transactions_created_at; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_coin_transactions_created_at ON public.coin_transactions USING btree (created_at);


--
-- Name: idx_coin_transactions_type; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_coin_transactions_type ON public.coin_transactions USING btree (transaction_type);


--
-- Name: idx_coin_transactions_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions USING btree (user_id);


--
-- Name: idx_coin_tx_user_created_at; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_coin_tx_user_created_at ON public.coin_transactions USING btree (user_id, created_at);


--
-- Name: idx_company_plans_active; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_company_plans_active ON public.company_plans USING btree (is_active);


--
-- Name: idx_enter_balance; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_enter_balance ON public.enter USING btree (balance);


--
-- Name: idx_enter_company_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_enter_company_id ON public.enter USING btree (company_id);


--
-- Name: idx_enter_login; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_enter_login ON public.enter USING btree (login);


--
-- Name: idx_feedback_created_at; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_feedback_created_at ON public.feedback USING btree (created_at DESC);


--
-- Name: idx_feedback_rating; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_feedback_rating ON public.feedback USING btree (rating);


--
-- Name: idx_feedback_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_feedback_user_id ON public.feedback USING btree (user_id);


--
-- Name: idx_news_category; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_news_category ON public.news USING btree (category_id);


--
-- Name: idx_news_category_date; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_news_category_date ON public.news USING btree (category_id, publish_date DESC);


--
-- Name: idx_news_featured; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_news_featured ON public.news USING btree (is_featured);


--
-- Name: idx_news_featured_date; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_news_featured_date ON public.news USING btree (is_featured, publish_date DESC);


--
-- Name: idx_news_publish_date; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_news_publish_date ON public.news USING btree (publish_date);


--
-- Name: idx_news_status; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_news_status ON public.news USING btree (status);


--
-- Name: idx_news_status_date; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_news_status_date ON public.news USING btree (status, publish_date DESC);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_priority; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_notifications_priority ON public.notifications USING btree (priority);


--
-- Name: idx_notifications_type_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_notifications_type_id ON public.notifications USING btree (type_id);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_productivity_achievements_code; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_productivity_achievements_code ON public.productivity_achievements USING btree (code);


--
-- Name: idx_productivity_levels_score_range; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_productivity_levels_score_range ON public.productivity_levels USING btree (min_score, max_score);


--
-- Name: idx_productivity_scores_date_score; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_productivity_scores_date_score ON public.productivity_scores USING btree (date, final_score);


--
-- Name: idx_productivity_scores_user_date; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_productivity_scores_user_date ON public.productivity_scores USING btree (user_id, date);


--
-- Name: idx_user_achievements_achievement_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements USING btree (achievement_id);


--
-- Name: idx_user_achievements_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_user_achievements_user_id ON public.user_achievements USING btree (user_id);


--
-- Name: idx_user_balance_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_user_balance_user_id ON public.user_balance USING btree (user_id);


--
-- Name: idx_user_benefits_user_category; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_user_benefits_user_category ON public.user_benefits USING btree (user_id, benefit_id);


--
-- Name: idx_user_progress_level; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_user_progress_level ON public.user_progress USING btree (level DESC);


--
-- Name: idx_user_progress_user_id; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_user_progress_user_id ON public.user_progress USING btree (user_id);


--
-- Name: idx_user_progress_xp; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE INDEX idx_user_progress_xp ON public.user_progress USING btree (xp);


--
-- Name: uq_benrec_user_benefit; Type: INDEX; Schema: public; Owner: f1111323_yoddle
--

CREATE UNIQUE INDEX uq_benrec_user_benefit ON public.benefit_recommendations USING btree (user_id, benefit_id);


--
-- Name: category_stats _RETURN; Type: RULE; Schema: public; Owner: f1111323_yoddle
--

CREATE OR REPLACE VIEW public.category_stats AS
 SELECT nc.id,
    nc.name,
    nc.color_code,
    nc.icon,
    COALESCE(count(n.id), (0)::bigint) AS news_count,
    COALESCE(sum(n.views_count), (0)::bigint) AS total_views
   FROM (public.news_categories nc
     LEFT JOIN public.news n ON (((nc.id = n.category_id) AND ((n.status)::text = 'published'::text))))
  WHERE (nc.is_active = true)
  GROUP BY nc.id, nc.name, nc.color_code, nc.icon
  ORDER BY nc.sort_order;


--
-- Name: ai_signals ai_signals_productivity_trigger; Type: TRIGGER; Schema: public; Owner: f1111323_yoddle
--

CREATE TRIGGER ai_signals_productivity_trigger AFTER INSERT OR UPDATE ON public.ai_signals FOR EACH ROW EXECUTE FUNCTION public.trigger_productivity_calculation();

ALTER TABLE public.ai_signals DISABLE TRIGGER ai_signals_productivity_trigger;


--
-- Name: activity_log tr_update_user_progress; Type: TRIGGER; Schema: public; Owner: f1111323_yoddle
--

CREATE TRIGGER tr_update_user_progress AFTER INSERT OR DELETE OR UPDATE ON public.activity_log FOR EACH ROW EXECUTE FUNCTION public.trigger_update_user_progress();


--
-- Name: coin_transactions trigger_update_user_balance; Type: TRIGGER; Schema: public; Owner: f1111323_yoddle
--

CREATE TRIGGER trigger_update_user_balance AFTER INSERT ON public.coin_transactions FOR EACH ROW EXECUTE FUNCTION public.update_user_balance();


--
-- Name: ai_user_preferences update_ai_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: f1111323_yoddle
--

CREATE TRIGGER update_ai_user_preferences_updated_at BEFORE UPDATE ON public.ai_user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: news_categories update_news_categories_updated_at; Type: TRIGGER; Schema: public; Owner: f1111323_yoddle
--

CREATE TRIGGER update_news_categories_updated_at BEFORE UPDATE ON public.news_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: news update_news_updated_at; Type: TRIGGER; Schema: public; Owner: f1111323_yoddle
--

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_progress update_user_progress_updated_at; Type: TRIGGER; Schema: public; Owner: f1111323_yoddle
--

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_log activity_log_activity_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_activity_type_id_fkey FOREIGN KEY (activity_type_id) REFERENCES public.activity_types(id);


--
-- Name: ai_insights ai_insights_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: ai_metrics ai_metrics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_metrics
    ADD CONSTRAINT ai_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: ai_recommendations ai_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: ai_signals ai_signals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_signals
    ADD CONSTRAINT ai_signals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: ai_user_preferences ai_user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.ai_user_preferences
    ADD CONSTRAINT ai_user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.enter(id);


--
-- Name: audit_log audit_log_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.enter(id);


--
-- Name: benefit_recommendations benefit_recommendations_benefit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefit_recommendations
    ADD CONSTRAINT benefit_recommendations_benefit_id_fkey FOREIGN KEY (benefit_id) REFERENCES public.benefits(id) ON DELETE CASCADE;


--
-- Name: benefit_recommendations benefit_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefit_recommendations
    ADD CONSTRAINT benefit_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: coin_transactions coin_transactions_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.enter(id);


--
-- Name: coin_transactions coin_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: enter enter_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.enter
    ADD CONSTRAINT enter_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company_plans(id);


--
-- Name: activity_log fk_activity_log_activity_type_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT fk_activity_log_activity_type_id FOREIGN KEY (activity_type_id) REFERENCES public.activity_types(id) ON DELETE SET NULL;


--
-- Name: activity_log fk_activity_log_user_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT fk_activity_log_user_id FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: benefit_recommendations fk_benefit_recommendations_benefit_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefit_recommendations
    ADD CONSTRAINT fk_benefit_recommendations_benefit_id FOREIGN KEY (benefit_id) REFERENCES public.benefits(id) ON DELETE CASCADE;


--
-- Name: benefit_recommendations fk_benefit_recommendations_user_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.benefit_recommendations
    ADD CONSTRAINT fk_benefit_recommendations_user_id FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_type_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_type_id FOREIGN KEY (type_id) REFERENCES public.notification_types(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_user_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: user_achievements fk_user_achievements_achievement_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT fk_user_achievements_achievement_id FOREIGN KEY (achievement_id) REFERENCES public.achievements(code) ON DELETE CASCADE;


--
-- Name: user_achievements fk_user_achievements_user_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT fk_user_achievements_user_id FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: user_benefits fk_user_benefits_benefit_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_benefits
    ADD CONSTRAINT fk_user_benefits_benefit_id FOREIGN KEY (benefit_id) REFERENCES public.benefits(id) ON DELETE CASCADE;


--
-- Name: user_benefits fk_user_benefits_user_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_benefits
    ADD CONSTRAINT fk_user_benefits_user_id FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: user_progress fk_user_progress_user_id; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT fk_user_progress_user_id FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: news news_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.news_categories(id) ON DELETE RESTRICT;


--
-- Name: notifications notifications_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.notification_types(id) ON DELETE CASCADE;


--
-- Name: productivity_scores productivity_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.productivity_scores
    ADD CONSTRAINT productivity_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: user_balance user_balance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_balance
    ADD CONSTRAINT user_balance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: user_benefits user_benefits_benefit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_benefits
    ADD CONSTRAINT user_benefits_benefit_id_fkey FOREIGN KEY (benefit_id) REFERENCES public.benefits(id) ON DELETE CASCADE;


--
-- Name: user_benefits user_benefits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_benefits
    ADD CONSTRAINT user_benefits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: f1111323_yoddle
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.enter(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

