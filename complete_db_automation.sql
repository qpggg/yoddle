-- ПОЛНАЯ АВТОМАТИЗАЦИЯ БД YODDLE
-- 1. Исправление Foreign Keys (без синтаксических ошибок)
-- 2. Автоматизация user_progress из activity_log

-- ========================================
-- ЧАСТЬ 1: ИСПРАВЛЕННЫЕ FOREIGN KEYS
-- ========================================

-- 1. СВЯЗИ ДЛЯ USER_ACHIEVEMENTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_user_achievements_user_id') THEN
        ALTER TABLE user_achievements 
        ADD CONSTRAINT fk_user_achievements_user_id 
        FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_user_achievements_achievement_id') THEN
        ALTER TABLE user_achievements 
        ADD CONSTRAINT fk_user_achievements_achievement_id 
        FOREIGN KEY (achievement_id) REFERENCES achievements(code) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. СВЯЗИ ДЛЯ USER_PROGRESS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_user_progress_user_id') THEN
        ALTER TABLE user_progress 
        ADD CONSTRAINT fk_user_progress_user_id 
        FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. СВЯЗИ ДЛЯ ACTIVITY_LOG
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_activity_log_user_id') THEN
        ALTER TABLE activity_log 
        ADD CONSTRAINT fk_activity_log_user_id 
        FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_activity_log_activity_type_id') THEN
        ALTER TABLE activity_log 
        ADD CONSTRAINT fk_activity_log_activity_type_id 
        FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. СВЯЗИ ДЛЯ BENEFIT_RECOMMENDATIONS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_benefit_recommendations_user_id') THEN
        ALTER TABLE benefit_recommendations 
        ADD CONSTRAINT fk_benefit_recommendations_user_id 
        FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_benefit_recommendations_benefit_id') THEN
        ALTER TABLE benefit_recommendations 
        ADD CONSTRAINT fk_benefit_recommendations_benefit_id 
        FOREIGN KEY (benefit_id) REFERENCES benefits(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ========================================
-- ЧАСТЬ 2: АВТОМАТИЗАЦИЯ USER_PROGRESS
-- ========================================

-- СНАЧАЛА СОЗДАЕМ ФУНКЦИЮ ДЛЯ РАСЧЕТА СТРИКА ЛОГИНОВ
DROP FUNCTION IF EXISTS get_login_streak(INTEGER) CASCADE;
CREATE FUNCTION get_login_streak(p_user_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
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

-- ТЕПЕРЬ СОЗДАЕМ VIEW ДЛЯ АВТОМАТИЧЕСКОГО РАСЧЕТА ПРОГРЕССА
DROP VIEW IF EXISTS user_progress_calculated CASCADE;
CREATE VIEW user_progress_calculated AS
WITH user_stats AS (
    SELECT 
        e.id as user_id,
        e.name,
        e.login,
        
        -- ОБЩИЙ XP из логов активности
        COALESCE(SUM(al.xp_earned), 0) as total_xp,
        
        -- УРОВЕНЬ (каждые 100 XP = 1 уровень)
        FLOOR(COALESCE(SUM(al.xp_earned), 0) / 100.0) + 1 as level,
        
        -- КОЛИЧЕСТВО ДНЕЙ АКТИВНОСТИ
        COUNT(DISTINCT DATE(al.created_at)) as days_active,
        
        -- ПОСЛЕДНЯЯ АКТИВНОСТЬ
        MAX(al.created_at) as last_activity,
        
        -- СТРИК ЛОГИНОВ (подряд дни входа)
        CASE 
            WHEN COUNT(CASE WHEN al.action = 'login' THEN 1 END) > 0 THEN
                get_login_streak(e.id)
            ELSE 0
        END as login_streak,
        
        -- КОЛИЧЕСТВО ИСПОЛЬЗОВАННЫХ ЛЬГОТ
        COUNT(CASE WHEN al.action = 'benefit_used' THEN 1 END) as benefits_used,
        
        -- ПРОЦЕНТ ЗАПОЛНЕНИЯ ПРОФИЛЯ
        CASE 
            WHEN e.name IS NOT NULL AND e.phone IS NOT NULL AND e.position IS NOT NULL THEN 100
            WHEN (e.name IS NOT NULL AND e.phone IS NOT NULL) OR 
                 (e.name IS NOT NULL AND e.position IS NOT NULL) OR 
                 (e.phone IS NOT NULL AND e.position IS NOT NULL) THEN 75
            WHEN e.name IS NOT NULL OR e.phone IS NOT NULL OR e.position IS NOT NULL THEN 50
            ELSE 25
        END as profile_completion,
        
        -- ВРЕМЯ СОЗДАНИЯ ЗАПИСИ В ПРОГРЕССЕ
        COALESCE(up.created_at, NOW()) as created_at,
        NOW() as updated_at
        
    FROM enter e
    LEFT JOIN activity_log al ON e.id = al.user_id
    LEFT JOIN user_progress up ON e.id = up.user_id
    GROUP BY e.id, e.name, e.login, e.phone, e.position, up.created_at
)
SELECT 
    row_number() OVER (ORDER BY user_id) as id,
    user_id,
    total_xp as xp,
    level,
    login_streak,
    days_active,
    benefits_used,
    profile_completion,
    last_activity,
    created_at,
    updated_at
FROM user_stats;

-- ФУНКЦИЯ ОБНОВЛЕНИЯ РЕАЛЬНОЙ ТАБЛИЦЫ USER_PROGRESS
DROP FUNCTION IF EXISTS update_user_progress() CASCADE;
CREATE FUNCTION update_user_progress()
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    -- Удаляем старые записи и вставляем новые рассчитанные
    DELETE FROM user_progress;
    
    INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at)
    SELECT 
        user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity, created_at, updated_at
    FROM user_progress_calculated;
    
    RAISE NOTICE 'User progress updated successfully. Records updated: %', (SELECT COUNT(*) FROM user_progress);
END $$;

-- ТРИГГЕР ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ ПРИ ИЗМЕНЕНИИ ACTIVITY_LOG
DROP FUNCTION IF EXISTS trigger_update_user_progress() CASCADE;
CREATE FUNCTION trigger_update_user_progress()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
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

-- СОЗДАНИЕ ТРИГГЕРА
DROP TRIGGER IF EXISTS tr_update_user_progress ON activity_log;
CREATE TRIGGER tr_update_user_progress
    AFTER INSERT OR UPDATE OR DELETE ON activity_log
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_progress();

-- ========================================
-- ЧАСТЬ 3: ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ  
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_benefit_recommendations_user_id ON benefit_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_benefit_recommendations_benefit_id ON benefit_recommendations(benefit_id);

-- ========================================
-- ЧАСТЬ 4: ПОЛЕЗНЫЕ VIEW С СВЯЗАННЫМИ ДАННЫМИ
-- ========================================

-- VIEW: Достижения пользователей с деталями
DROP VIEW IF EXISTS user_achievements_detailed CASCADE;
CREATE VIEW user_achievements_detailed AS
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

-- VIEW: Активность с деталями типов
DROP VIEW IF EXISTS activity_log_detailed CASCADE;
CREATE VIEW activity_log_detailed AS
SELECT 
    al.id,
    al.user_id,
    e.name as user_name,
    al.action,
    at.name as action_name,
    at.description as action_description,
    at.icon as action_icon,
    al.xp_earned,
    al.description,
    al.created_at,
    at.category
FROM activity_log al
JOIN enter e ON al.user_id = e.id
LEFT JOIN activity_types at ON al.activity_type_id = at.id;

-- VIEW: Рекомендации льгот с деталями  
DROP VIEW IF EXISTS benefit_recommendations_detailed CASCADE;
CREATE VIEW benefit_recommendations_detailed AS
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

-- ========================================
-- ЧАСТЬ 5: ФУНКЦИИ ДИАГНОСТИКИ
-- ========================================

-- ФУНКЦИЯ ПРОВЕРКИ ЦЕЛОСТНОСТИ ДАННЫХ
DROP FUNCTION IF EXISTS check_data_integrity() CASCADE;
CREATE FUNCTION check_data_integrity() 
RETURNS TABLE(table_name TEXT, issue_count BIGINT, issue_description TEXT) 
LANGUAGE plpgsql AS $$
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

-- ========================================
-- ЧАСТЬ 6: ПЕРВОНАЧАЛЬНОЕ ЗАПОЛНЕНИЕ
-- ========================================

-- Обновляем прогресс всех пользователей
SELECT update_user_progress();

-- Проверяем результат
SELECT 
    'Foreign Keys Created' as status,
    COUNT(*) as count
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('user_achievements', 'user_progress', 'activity_log', 'benefit_recommendations')

UNION ALL

SELECT 
    'User Progress Records' as status,
    COUNT(*) as count
FROM user_progress

UNION ALL

SELECT 
    'Activity Log Records' as status,
    COUNT(*) as count  
FROM activity_log;

-- Запуск проверки целостности
SELECT * FROM check_data_integrity(); 