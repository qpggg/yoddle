-- Изменение типа данных и добавление внешних ключей для системы уведомлений

-- 1. Сначала удаляем RLS политики
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
DROP POLICY IF EXISTS notifications_insert_policy ON notifications;
DROP POLICY IF EXISTS notifications_update_policy ON notifications;
DROP POLICY IF EXISTS notifications_delete_policy ON notifications;

-- 2. Изменяем тип колонки user_id на INTEGER
ALTER TABLE notifications 
ALTER COLUMN user_id TYPE INTEGER USING (user_id::INTEGER);

-- 3. Добавляем внешний ключ для notifications.user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_notifications_user_id') THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT fk_notifications_user_id 
        FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Добавляем внешний ключ для notifications.type_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_notifications_type_id') THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT fk_notifications_type_id 
        FOREIGN KEY (type_id) REFERENCES notification_types(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type_id ON notifications(type_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 6. Создаем представление для удобного получения уведомлений с деталями
CREATE OR REPLACE VIEW notifications_detailed AS
SELECT 
    n.id,
    n.user_id,
    e.name as user_name,
    e.login as user_email,
    n.type_id,
    nt.name as type_name,
    nt.icon as type_icon,
    nt.color as type_color,
    n.title,
    n.message,
    n.is_read,
    n.is_global,
    n.priority,
    n.link_url,
    n.expires_at,
    n.created_at,
    n.read_at
FROM notifications n
LEFT JOIN enter e ON n.user_id = e.id
LEFT JOIN notification_types nt ON n.type_id = nt.id;

-- 7. Обновляем функцию создания уведомления для работы с INTEGER
CREATE OR REPLACE FUNCTION create_notification(
    p_type_name VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_user_id INTEGER DEFAULT NULL,
    p_is_global BOOLEAN DEFAULT FALSE,
    p_priority INTEGER DEFAULT 1,
    p_link_url VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- 8. Пересоздаем RLS политики
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Политика для SELECT: пользователи видят свои уведомления и глобальные
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (
        is_global = true OR 
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
    );

-- Политика для INSERT: пользователи могут создавать уведомления только для себя
CREATE POLICY notifications_insert_policy ON notifications
    FOR INSERT
    WITH CHECK (
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER OR
        (is_global = true AND current_setting('app.is_admin', true)::boolean)
    );

-- Политика для UPDATE: пользователи могут обновлять только свои уведомления
CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER OR
        (is_global = true AND current_setting('app.is_admin', true)::boolean)
    );

-- Политика для DELETE: пользователи могут удалять только свои уведомления
CREATE POLICY notifications_delete_policy ON notifications
    FOR DELETE
    USING (
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER OR
        (is_global = true AND current_setting('app.is_admin', true)::boolean)
    ); 