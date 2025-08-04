-- =====================================================
-- ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ БД YODDLE
-- =====================================================

-- Критически важные индексы для производительности

-- Индексы для activity_log (самые частые запросы)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_action ON activity_log(user_id, action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Индексы для user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id, achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Индексы для user_benefits
CREATE INDEX IF NOT EXISTS idx_user_benefits_user_category ON user_benefits(user_id, benefit_id);

-- Индексы для notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority DESC, created_at DESC);

-- Индексы для news
CREATE INDEX IF NOT EXISTS idx_news_status_date ON news(status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured_date ON news(is_featured, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_category_date ON news(category_id, publish_date DESC);

-- Индексы для user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(level DESC);

-- Индексы для benefit_recommendations
CREATE INDEX IF NOT EXISTS idx_benefit_recommendations_user_priority ON benefit_recommendations(user_id, priority DESC);

-- Составные индексы для сложных запросов
CREATE INDEX IF NOT EXISTS idx_activity_log_user_year_month ON activity_log(user_id, EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at));

-- Индексы для поиска
CREATE INDEX IF NOT EXISTS idx_enter_login ON enter(login);
CREATE INDEX IF NOT EXISTS idx_benefits_category ON benefits(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active, tier, xp_reward);

-- =====================================================
-- ОПТИМИЗАЦИЯ ЗАПРОСОВ
-- =====================================================

-- Функция для получения активности пользователя (оптимизированная)
CREATE OR REPLACE FUNCTION get_user_activity(
    p_user_id INTEGER,
    p_year INTEGER,
    p_month INTEGER
) RETURNS TABLE (
    day INTEGER,
    actions BIGINT
) AS $$
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
$$ LANGUAGE plpgsql;

-- Функция для получения достижений пользователя (оптимизированная)
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id INTEGER)
RETURNS TABLE (
    id VARCHAR,
    title VARCHAR,
    description TEXT,
    icon VARCHAR,
    points INTEGER,
    tier INTEGER,
    requirement_type VARCHAR,
    requirement_value INTEGER,
    requirement_action VARCHAR,
    unlocked BOOLEAN,
    unlocked_at TIMESTAMP
) AS $$
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
$$ LANGUAGE plpgsql;

-- Функция для получения непрочитанных уведомлений (оптимизированная)
CREATE OR REPLACE FUNCTION get_unread_notifications(p_user_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    type_name VARCHAR,
    type_icon VARCHAR,
    type_color VARCHAR,
    title VARCHAR,
    message TEXT,
    priority INTEGER,
    link_url VARCHAR,
    created_at TIMESTAMP
) AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- СТАТИСТИКА И МОНИТОРИНГ
-- =====================================================

-- Представление для статистики активности
CREATE OR REPLACE VIEW activity_stats AS
SELECT 
    user_id,
    COUNT(*) as total_actions,
    COUNT(DISTINCT DATE(created_at)) as active_days,
    MAX(created_at) as last_activity,
    AVG(xp_earned) as avg_xp_per_action
FROM activity_log
GROUP BY user_id;

-- Представление для статистики достижений
CREATE OR REPLACE VIEW achievement_stats AS
SELECT 
    user_id,
    COUNT(*) as total_achievements,
    COUNT(CASE WHEN unlocked_at IS NOT NULL THEN 1 END) as unlocked_achievements,
    SUM(CASE WHEN unlocked_at IS NOT NULL THEN xp_reward ELSE 0 END) as total_xp_from_achievements
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.code
GROUP BY user_id;

-- Представление для статистики льгот
CREATE OR REPLACE VIEW benefit_stats AS
SELECT 
    ub.user_id,
    COUNT(*) as total_benefits,
    COUNT(DISTINCT b.category) as benefit_categories
FROM user_benefits ub
JOIN benefits b ON ub.benefit_id = b.id
GROUP BY ub.user_id; 