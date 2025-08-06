-- 🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ ТАБЛИЦЫ ENTER И БАЛАНСА
-- ===================================================

-- 1. Добавляем колонку баланса в таблицу enter
ALTER TABLE enter ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE enter ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE enter ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_enter_balance ON enter(balance);
CREATE INDEX IF NOT EXISTS idx_enter_company_id ON enter(company_id);

-- 3. Обновляем существующие записи с начальным балансом
UPDATE enter SET balance = 0.00 WHERE balance IS NULL;

-- 4. Простое представление для пользователей с балансом
CREATE OR REPLACE VIEW user_with_balance AS
SELECT 
    e.id,
    e.name,
    e.login as email,
    e.phone,
    e.position,
    e.avatar_url,
    e.balance,
    e.company_id,
    e.is_admin
FROM enter e;

-- 5. Функция для быстрого получения баланса
CREATE OR REPLACE FUNCTION get_user_balance_simple(p_user_id INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    user_balance DECIMAL(10,2);
BEGIN
    SELECT COALESCE(balance, 0.00) INTO user_balance 
    FROM enter 
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_balance, 0.00);
END;
$$ LANGUAGE plpgsql;

-- 6. Комментарии
COMMENT ON COLUMN enter.balance IS 'Текущий баланс Yoddle-коинов пользователя';
COMMENT ON COLUMN enter.company_id IS 'ID компании пользователя';
COMMENT ON COLUMN enter.is_admin IS 'Административные права пользователя';

SELECT 'Таблица enter успешно обновлена для интеграции с балансом!' as status;