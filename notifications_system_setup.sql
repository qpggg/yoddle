-- СИСТЕМА УВЕДОМЛЕНИЙ YODDLE
-- ================================================

-- Удаляем таблицы если существуют
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_types CASCADE;

-- Типы уведомлений
CREATE TABLE notification_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Основная таблица уведомлений
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type_id INTEGER REFERENCES notification_types(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    user_id VARCHAR(255), -- NULL = для всех пользователей
    is_read BOOLEAN DEFAULT FALSE,
    is_global BOOLEAN DEFAULT FALSE, -- глобальные уведомления для всех
    link_url VARCHAR(500), -- ссылка при клике
    priority INTEGER DEFAULT 1, -- 1=низкий, 2=средний, 3=высокий
    expires_at TIMESTAMP, -- когда истекает (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- ================================================
-- ЗАПОЛНЕНИЕ ТИПОВ УВЕДОМЛЕНИЙ
-- ================================================

INSERT INTO notification_types (name, icon, color, description) VALUES
('news', 'Newspaper', '#750000', 'Новости и обновления'),
('benefit', 'Gift', '#2563eb', 'Новые льготы и программы'),
('achievement', 'Trophy', '#f59e0b', 'Достижения и награды'),
('system', 'Settings', '#6b7280', 'Системные уведомления'),
('reminder', 'Clock', '#8b5cf6', 'Напоминания и дедлайны'),
('update', 'Download', '#10b981', 'Обновления платформы');

-- ================================================
-- ТЕСТОВЫЕ УВЕДОМЛЕНИЯ
-- ================================================

INSERT INTO notifications (type_id, title, message, is_global, priority, link_url) VALUES
-- Новости (type_id = 1)
(1, 'Новая статья о wellness', 'Опубликована статья "5 способов борьбы с выгоранием на работе"', true, 2, '/news'),
(1, 'Анонс новых функций', 'В следующем обновлении появится система достижений', true, 1, '/news'),

-- Льготы (type_id = 2) 
(2, 'Новая льгота: Массаж', 'Добавлена программа массажа для снятия стресса', true, 2, '/my-benefits'),
(2, 'Обновление льгот', 'Расширена программа психологической поддержки', true, 1, '/my-benefits'),

-- Достижения (type_id = 3)
(3, 'Поздравляем!', 'Вы достигли уровня "Активный пользователь"', false, 3, '/progress'),
(3, 'Новое достижение', 'Разблокировано: "Первые шаги в wellness"', false, 2, '/progress'),

-- Системные (type_id = 4)
(4, 'Плановое обслуживание', 'Техническое обслуживание сегодня в 23:00-01:00', true, 1, NULL),

-- Напоминания (type_id = 5)
(5, 'Пройдите тест предпочтений', 'Обновите свои предпочтения для лучших рекомендаций', false, 2, '/preferences'),

-- Обновления (type_id = 6)
(6, 'Обновление платформы', 'Доступна новая версия с улучшенным интерфейсом', true, 1, NULL);

-- ================================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С УВЕДОМЛЕНИЯМИ
-- ================================================

-- Функция для получения непрочитанных уведомлений
CREATE OR REPLACE FUNCTION get_unread_notifications(p_user_id VARCHAR DEFAULT NULL)
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
    JOIN notification_types nt ON n.type_id = nt.id
    WHERE 
        (n.is_global = true OR n.user_id = p_user_id)
        AND n.is_read = false
        AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
    ORDER BY n.priority DESC, n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Функция для подсчета непрочитанных
CREATE OR REPLACE FUNCTION count_unread_notifications(p_user_id VARCHAR DEFAULT NULL)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Функция для отметки как прочитанное
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id INTEGER, p_user_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = p_notification_id 
    AND (is_global = true OR user_id = p_user_id);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Функция для создания нового уведомления
CREATE OR REPLACE FUNCTION create_notification(
    p_type_name VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_user_id VARCHAR DEFAULT NULL,
    p_is_global BOOLEAN DEFAULT FALSE,
    p_priority INTEGER DEFAULT 1,
    p_link_url VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- ================================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ АНАЛИТИКИ
-- ================================================

-- Статистика уведомлений по типам
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    nt.name as type_name,
    nt.icon,
    nt.color,
    COUNT(n.id) as total_notifications,
    COUNT(CASE WHEN n.is_read = false THEN 1 END) as unread_count,
    COUNT(CASE WHEN n.priority = 3 THEN 1 END) as high_priority_count
FROM notification_types nt
LEFT JOIN notifications n ON nt.id = n.type_id
GROUP BY nt.id, nt.name, nt.icon, nt.color
ORDER BY total_notifications DESC;

-- Последние уведомления для дашборда
CREATE OR REPLACE VIEW recent_notifications AS
SELECT 
    n.id,
    nt.name as type_name,
    nt.icon as type_icon,
    nt.color as type_color,
    n.title,
    n.message,
    n.priority,
    n.is_read,
    n.created_at,
    CASE 
        WHEN n.created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'just_now'
        WHEN n.created_at > CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'today'
        WHEN n.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'this_week'
        ELSE 'older'
    END as time_category
FROM notifications n
JOIN notification_types nt ON n.type_id = nt.id
WHERE n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP
ORDER BY n.created_at DESC
LIMIT 50;

-- ================================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS)
-- ================================================

-- Включаем RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Политика для чтения (пользователи видят только свои и глобальные)
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (
        is_global = true 
        OR user_id = current_setting('app.current_user_id', true)
        OR current_setting('app.current_user_id', true) IS NULL
    );

-- Политика для обновления (только свои)
CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (
        is_global = true 
        OR user_id = current_setting('app.current_user_id', true)
    );

COMMIT;

-- ================================================
-- ИНФОРМАЦИЯ О СИСТЕМЕ
-- ================================================

-- Выводим статистику
SELECT 'Notifications system setup completed!' as status;
SELECT COUNT(*) as notification_types_count FROM notification_types;
SELECT COUNT(*) as test_notifications_count FROM notifications;
SELECT * FROM notification_stats; 