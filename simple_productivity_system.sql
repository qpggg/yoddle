-- =====================================================
-- ПРОСТАЯ СИСТЕМА ПРОДУКТИВНОСТИ (БЕЗ XP МНОЖИТЕЛЯ)
-- =====================================================

-- 1. Функция для расчета простого рейтинга продуктивности
CREATE OR REPLACE FUNCTION calculate_simple_productivity_rating(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_mood_score DECIMAL(5,2) := 0;
    v_activity_score DECIMAL(5,2) := 0;
    v_final_rating DECIMAL(5,2) := 0;
    v_mood_count INTEGER := 0;
    v_activity_count INTEGER := 0;
BEGIN
    -- Получаем среднее настроение за день
    SELECT 
        COALESCE(AVG(mood_rating), 0),
        COUNT(*)
    INTO v_mood_score, v_mood_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date
    AND type = 'mood'
    AND mood_rating IS NOT NULL;

    -- Получаем среднюю активность за день
    SELECT 
        COALESCE(AVG(success_rating), 0),
        COUNT(*)
    INTO v_activity_score, v_activity_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND DATE(timestamp) = p_date
    AND type = 'activity'
    AND success_rating IS NOT NULL;

    -- Формула: (настроение + (активность/7)*10) / 2
    IF v_mood_count > 0 OR v_activity_count > 0 THEN
        v_final_rating := (v_mood_score + (v_activity_score / 7) * 10) / 2;
    ELSE
        v_final_rating := 0;
    END IF;

    RETURN ROUND(v_final_rating, 2);
END;
$$ LANGUAGE plpgsql;

-- 2. Функция для подсчета дней с данными
CREATE OR REPLACE FUNCTION count_tracked_days(p_user_id INTEGER)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- 3. Функция для расчета продуктивности за период
CREATE OR REPLACE FUNCTION calculate_period_productivity(p_user_id INTEGER, p_days INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_avg_rating DECIMAL(5,2) := 0;
BEGIN
    SELECT AVG(calculate_simple_productivity_rating(p_user_id, DATE(timestamp)))
    INTO v_avg_rating
    FROM generate_series(
        CURRENT_DATE - INTERVAL '1 day' * p_days,
        CURRENT_DATE,
        INTERVAL '1 day'
    ) AS dates(date)
    WHERE calculate_simple_productivity_rating(p_user_id, dates.date) > 0;
    
    RETURN COALESCE(v_avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- 4. Функция для подсчета простых достижений
CREATE OR REPLACE FUNCTION count_simple_achievements(p_user_id INTEGER)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- 5. Функция для получения всех показателей продуктивности
CREATE OR REPLACE FUNCTION get_user_productivity_stats(p_user_id INTEGER)
RETURNS TABLE(
    current_rating DECIMAL(5,2),
    weekly_rating DECIMAL(5,2),
    monthly_rating DECIMAL(5,2),
    tracked_days INTEGER,
    achievements_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        calculate_simple_productivity_rating(p_user_id, CURRENT_DATE) as current_rating,
        ROUND(calculate_period_productivity(p_user_id, 7), 2) as weekly_rating,
        ROUND(calculate_period_productivity(p_user_id, 30), 2) as monthly_rating,
        count_tracked_days(p_user_id) as tracked_days,
        count_simple_achievements(p_user_id) as achievements_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Тестируем функции
SELECT 'Функции созданы успешно!' as status;

-- 7. Проверяем работу для пользователя 1
SELECT * FROM get_user_productivity_stats(1);
