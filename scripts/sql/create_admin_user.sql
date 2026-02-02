-- =====================================================================
-- Роли и вход: используются таблицы enter и user_roles.
-- enter — пользователи (логин, пароль, имя, должность и т.д.).
-- user_roles — роли (user_id → enter.id, role: admin | manager | user).
-- Вход в админку: POST /api/admin/auth проверяет enter по login/password
-- и право админа по user_roles.role = 'admin' или env ADMIN_LOGINS.
-- =====================================================================
-- Создаёт пользователя HR-админа: логин hr_admin, пароль admin123
-- =====================================================================

-- Таблица ролей (если ещё нет)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id integer NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
    PRIMARY KEY (user_id, role)
);

-- Обновить существующего по логину
UPDATE enter
SET name = 'HR Admin', password = 'admin123', position = 'HR'
WHERE login = 'hr_admin';

-- Вставить, если такого логина ещё нет
INSERT INTO enter (name, login, password, position)
SELECT 'HR Admin', 'hr_admin', 'admin123', 'HR'
WHERE NOT EXISTS (SELECT 1 FROM enter WHERE login = 'hr_admin');

-- Назначить роль admin (по user_id из enter)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM enter WHERE login = 'hr_admin'
ON CONFLICT (user_id, role) DO NOTHING;
