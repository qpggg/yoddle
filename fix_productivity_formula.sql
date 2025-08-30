-- =====================================================
-- ИСПРАВЛЕНИЕ ФОРМУЛЫ РАСЧЕТА ПРОДУКТИВНОСТИ
-- =====================================================
-- Заменяем неправильную формулу на правильную согласно документации

-- Обновляем функцию calculate_productivity_score
CREATE OR REPLACE FUNCTION calculate_productivity_score(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(5,2) AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- КОММЕНТАРИЙ К ИЗМЕНЕНИЯМ
-- =====================================================
-- 
-- ИСПРАВЛЕНА ФОРМУЛА РАСЧЕТА ПРОДУКТИВНОСТИ:
-- 
-- БЫЛО (неправильно):
-- v_final_score := (v_mood_score * 0.6 + v_activity_score * 0.4) * v_quality_multiplier * 1.2 * v_platform_coefficient;
-- 
-- СТАЛО (правильно):
-- v_final_score := ((v_mood_score / 3.0) + (v_successful_activities * 0.5) + (v_failed_activities * (-0.5))) * 1.2 * v_platform_coefficient;
-- 
-- ИЗМЕНЕНИЯ:
-- ✅ Убрана неправильная формула с весами 0.6 и 0.4
-- ✅ Добавлен правильный расчет: сумма рейтингов / 3
-- ✅ Добавлен учет успешных активностей × 0.5
-- ✅ Добавлен учет неуспешных активностей × (-0.5)
-- ✅ Исправлен коэффициент активности платформы K
-- ✅ Убрана логика quality_multiplier (не нужна по новому алгоритму)
-- 
-- =====================================================


