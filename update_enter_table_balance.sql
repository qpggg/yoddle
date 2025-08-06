-- 💰 ОБНОВЛЕНИЕ ТАБЛИЦЫ ENTER ДЛЯ ИНТЕГРАЦИИ БАЛАНСА
-- =====================================================

-- Добавляем колонку баланса в таблицу enter
ALTER TABLE enter ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE enter ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE enter ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Создаем индекс для быстрого поиска по балансу
CREATE INDEX IF NOT EXISTS idx_enter_balance ON enter(balance);
CREATE INDEX IF NOT EXISTS idx_enter_company_id ON enter(company_id);

-- Обновляем существующие записи с начальным балансом
UPDATE enter SET balance = 0.00 WHERE balance IS NULL;

-- Создаем триггер для синхронизации баланса между enter и user_balance
CREATE OR REPLACE FUNCTION sync_balance_with_enter()
RETURNS TRIGGER AS $$
BEGIN
    -- При обновлении user_balance, обновляем enter
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        UPDATE enter 
        SET balance = NEW.balance 
        WHERE id = NEW.user_id;
        RETURN NEW;
    END IF;
    
    -- При удалении user_balance, обнуляем баланс в enter
    IF TG_OP = 'DELETE' THEN
        UPDATE enter 
        SET balance = 0.00 
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
DROP TRIGGER IF EXISTS trigger_sync_balance_enter ON user_balance;
CREATE TRIGGER trigger_sync_balance_enter
    AFTER INSERT OR UPDATE OR DELETE ON user_balance
    FOR EACH ROW
    EXECUTE FUNCTION sync_balance_with_enter();

-- Функция для быстрого получения баланса пользователя
CREATE OR REPLACE FUNCTION get_user_balance_quick(p_user_id INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    user_balance DECIMAL(10,2);
BEGIN
    SELECT balance INTO user_balance 
    FROM enter 
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_balance, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Обновляем представление для включения баланса
CREATE OR REPLACE VIEW user_info_with_balance AS
SELECT 
    e.id,
    e.name,
    e.login as email,
    e.phone,
    e.position,
    e.avatar_url,
    e.balance,
    e.company_id,
    e.is_admin,
    cp.company_name,
    cp.coins_per_employee
FROM enter e
LEFT JOIN company_plans cp ON e.company_id = cp.id;

-- Первоначальная синхронизация балансов (создаем таблицу user_balance если нет)
INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
SELECT 
    id, 
    COALESCE(balance, 0.00), 
    COALESCE(balance, 0.00), 
    0.00
FROM enter 
WHERE id NOT IN (SELECT COALESCE(user_id, 0) FROM user_balance)
ON CONFLICT (user_id) DO NOTHING;

-- Обновляем баланс в enter из user_balance для существующих записей
UPDATE enter 
SET balance = ub.balance
FROM user_balance ub 
WHERE enter.id = ub.user_id;

-- Комментарии
COMMENT ON COLUMN enter.balance IS 'Текущий баланс Yoddle-коинов пользователя';
COMMENT ON COLUMN enter.company_id IS 'ID компании пользователя';
COMMENT ON COLUMN enter.is_admin IS 'Административные права пользователя';

SELECT 'Таблица enter успешно обновлена для интеграции с балансом!' as status;