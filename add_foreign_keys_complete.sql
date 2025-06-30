-- ДОБАВЛЕНИЕ ВСЕХ ОТСУТСТВУЮЩИХ FOREIGN KEYS
-- Создание целостности данных между таблицами

-- 1. СВЯЗИ ДЛЯ USER_ACHIEVEMENTS
-- Связь с таблицей пользователей
ALTER TABLE user_achievements 
ADD CONSTRAINT IF NOT EXISTS fk_user_achievements_user_id 
FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;

-- Связь с справочником достижений  
ALTER TABLE user_achievements 
ADD CONSTRAINT IF NOT EXISTS fk_user_achievements_achievement_id 
FOREIGN KEY (achievement_id) REFERENCES achievements(code) ON DELETE CASCADE;

-- 2. СВЯЗИ ДЛЯ USER_PROGRESS
-- Связь с таблицей пользователей
ALTER TABLE user_progress 
ADD CONSTRAINT IF NOT EXISTS fk_user_progress_user_id 
FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;

-- 3. СВЯЗИ ДЛЯ ACTIVITY_LOG
-- Связь с таблицей пользователей
ALTER TABLE activity_log 
ADD CONSTRAINT IF NOT EXISTS fk_activity_log_user_id 
FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;

-- Связь с типами активности (если еще не добавлена)
ALTER TABLE activity_log 
ADD CONSTRAINT IF NOT EXISTS fk_activity_log_activity_type_id 
FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE SET NULL;

-- 4. СВЯЗИ ДЛЯ BENEFIT_RECOMMENDATIONS  
-- Связь с таблицей пользователей
ALTER TABLE benefit_recommendations 
ADD CONSTRAINT IF NOT EXISTS fk_benefit_recommendations_user_id 
FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;

-- Связь с справочником льгот
ALTER TABLE benefit_recommendations 
ADD CONSTRAINT IF NOT EXISTS fk_benefit_recommendations_benefit_id 
FOREIGN KEY (benefit_id) REFERENCES benefits(id) ON DELETE CASCADE;

-- 5. СВЯЗИ ДЛЯ USER_BENEFITS (если существует)
-- Проверяем существование таблицы и добавляем связи
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_benefits') THEN
        -- Связь с пользователями
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'fk_user_benefits_user_id') THEN
            ALTER TABLE user_benefits 
            ADD CONSTRAINT fk_user_benefits_user_id 
            FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;
        END IF;
        
        -- Связь с льготами  
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'fk_user_benefits_benefit_id') THEN
            ALTER TABLE user_benefits 
            ADD CONSTRAINT fk_user_benefits_benefit_id 
            FOREIGN KEY (benefit_id) REFERENCES benefits(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 6. СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ВНЕШНИХ КЛЮЧЕЙ (улучшение производительности)
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_benefit_recommendations_user_id ON benefit_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_benefit_recommendations_benefit_id ON benefit_recommendations(benefit_id);

-- 7. СОЗДАНИЕ ПОЛЕЗНЫХ VIEW С СВЯЗАННЫМИ ДАННЫМИ

-- VIEW: Прогресс пользователей с именами
CREATE OR REPLACE VIEW user_progress_detailed AS
SELECT 
    up.id,
    up.user_id,
    e.name as user_name,
    e.login as user_email,
    up.xp,
    up.level,
    up.login_streak,
    up.days_active,
    up.benefits_used,
    up.profile_completion,
    up.last_activity,
    up.created_at,
    up.updated_at
FROM user_progress up
JOIN enter e ON up.user_id = e.id;

-- VIEW: Достижения пользователей с деталями
CREATE OR REPLACE VIEW user_achievements_detailed AS
SELECT 
    ua.id,
    ua.user_id,
    e.name as user_name,
    ua.achievement_id,
    a.name as achievement_name,
    a.description as achievement_description,
    a.icon as achievement_icon,
    a.xp_reward,
    a.tier,
    ua.unlocked_at
FROM user_achievements ua
JOIN enter e ON ua.user_id = e.id
JOIN achievements a ON ua.achievement_id = a.code;

-- VIEW: Рекомендации льгот с деталями  
CREATE OR REPLACE VIEW benefit_recommendations_detailed AS
SELECT 
    br.id,
    br.user_id,
    e.name as user_name,
    br.benefit_id,
    b.name as benefit_name,
    b.description as benefit_description,
    b.category as benefit_category,
    br.priority,
    br.answers,
    br.created_at
FROM benefit_recommendations br
JOIN enter e ON br.user_id = e.id
JOIN benefits b ON br.benefit_id = b.id;

-- 8. ФУНКЦИЯ ДЛЯ ПРОВЕРКИ ЦЕЛОСТНОСТИ ДАННЫХ
CREATE OR REPLACE FUNCTION check_data_integrity() 
RETURNS TABLE(table_name TEXT, issue_count BIGINT, issue_description TEXT) 
LANGUAGE plpgsql AS $$
BEGIN
    -- Проверка пользователей без прогресса
    RETURN QUERY
    SELECT 'user_progress'::TEXT, COUNT(*)::BIGINT, 'Пользователи без записи в user_progress'::TEXT
    FROM enter e 
    LEFT JOIN user_progress up ON e.id = up.user_id 
    WHERE up.user_id IS NULL;
    
    -- Проверка активности без пользователей (не должно быть)
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

-- 9. ВЫВОД ИНФОРМАЦИИ О СОЗДАННЫХ СВЯЗЯХ
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('user_achievements', 'user_progress', 'activity_log', 'benefit_recommendations', 'user_benefits')
ORDER BY tc.table_name, tc.constraint_name;

-- 10. ЗАПУСК ПРОВЕРКИ ЦЕЛОСТНОСТИ
SELECT * FROM check_data_integrity(); 