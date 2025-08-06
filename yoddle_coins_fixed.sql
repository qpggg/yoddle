-- 💰 СИСТЕМА YODDLE-КОИНОВ ДЛЯ БУХГАЛТЕРСКОГО УЧЕТА (ИСПРАВЛЕННАЯ)
-- =================================================================

-- 1. ТАБЛИЦА БАЛАНСА ПОЛЬЗОВАТЕЛЕЙ
CREATE TABLE IF NOT EXISTS user_balance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 2. ТАБЛИЦА ТРАНЗАКЦИЙ КОИНОВ
CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'admin_add', 'admin_remove', 'benefit_purchase', 'monthly_allowance')),
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id INTEGER, -- Для связи с конкретным действием/льготой
    processed_by INTEGER REFERENCES enter(id), -- Кто обработал (для админ операций)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ТАБЛИЦА ТАРИФНЫХ ПЛАНОВ КОМПАНИЙ
CREATE TABLE IF NOT EXISTS company_plans (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    employee_count INTEGER NOT NULL,
    monthly_rate DECIMAL(10,2) NOT NULL, -- 150-450р в месяц
    coins_per_employee DECIMAL(10,2) NOT NULL, -- Коины на сотрудника
    plan_start_date DATE NOT NULL,
    plan_end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. СВЯЗЬ ПОЛЬЗОВАТЕЛЕЙ С КОМПАНИЯМИ
ALTER TABLE enter ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES company_plans(id);
ALTER TABLE enter ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 5. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
CREATE INDEX IF NOT EXISTS idx_user_balance_user_id ON user_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_company_plans_active ON company_plans(is_active);

-- 6. ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ БАЛАНСА
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Создаем запись баланса если её нет
    INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
    VALUES (NEW.user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Обновляем баланс в зависимости от типа транзакции
    IF NEW.transaction_type IN ('credit', 'admin_add', 'monthly_allowance') THEN
        UPDATE user_balance 
        SET 
            balance = balance + NEW.amount,
            total_earned = total_earned + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id;
    ELSE
        UPDATE user_balance 
        SET 
            balance = balance - NEW.amount,
            total_spent = total_spent + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_balance
    AFTER INSERT ON coin_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_balance();

-- 7. ФУНКЦИИ ДЛЯ РАБОТЫ С КОИНАМИ

-- Функция добавления коинов
CREATE OR REPLACE FUNCTION add_coins(
    p_user_id INTEGER,
    p_amount DECIMAL(10,2),
    p_description TEXT DEFAULT 'Пополнение баланса',
    p_type VARCHAR(20) DEFAULT 'credit',
    p_processed_by INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL(10,2);
BEGIN
    -- Получаем текущий баланс
    SELECT COALESCE(balance, 0) INTO current_balance 
    FROM user_balance 
    WHERE user_id = p_user_id;
    
    -- Если пользователя нет в таблице баланса, создаем
    IF current_balance IS NULL THEN
        INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
        VALUES (p_user_id, 0, 0, 0);
        current_balance := 0;
    END IF;
    
    -- Создаем транзакцию
    INSERT INTO coin_transactions (
        user_id, transaction_type, amount, balance_before, balance_after, 
        description, processed_by
    ) VALUES (
        p_user_id, p_type, p_amount, current_balance, current_balance + p_amount,
        p_description, p_processed_by
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Функция списания коинов
CREATE OR REPLACE FUNCTION spend_coins(
    p_user_id INTEGER,
    p_amount DECIMAL(10,2),
    p_description TEXT DEFAULT 'Покупка льготы',
    p_reference_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL(10,2);
BEGIN
    -- Получаем текущий баланс
    SELECT COALESCE(balance, 0) INTO current_balance 
    FROM user_balance 
    WHERE user_id = p_user_id;
    
    -- Если пользователя нет в таблице баланса
    IF current_balance IS NULL THEN
        current_balance := 0;
    END IF;
    
    -- Проверяем достаточность средств
    IF current_balance < p_amount THEN
        RAISE EXCEPTION 'Недостаточно средств на балансе';
    END IF;
    
    -- Создаем транзакцию
    INSERT INTO coin_transactions (
        user_id, transaction_type, amount, balance_before, balance_after,
        description, reference_id
    ) VALUES (
        p_user_id, 'debit', p_amount, current_balance, current_balance - p_amount,
        p_description, p_reference_id
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 8. ФУНКЦИЯ ДЛЯ ЕЖЕМЕСЯЧНОГО НАЧИСЛЕНИЯ КОИНОВ
CREATE OR REPLACE FUNCTION monthly_coins_allocation()
RETURNS INTEGER AS $$
DECLARE
    company_rec RECORD;
    user_rec RECORD;
    coins_per_user DECIMAL(10,2);
    total_allocated INTEGER := 0;
BEGIN
    -- Проходим по всем активным компаниям
    FOR company_rec IN 
        SELECT * FROM company_plans WHERE is_active = true
    LOOP
        coins_per_user := company_rec.coins_per_employee;
        
        -- Начисляем коины всем пользователям компании
        FOR user_rec IN 
            SELECT id FROM enter WHERE company_id = company_rec.id
        LOOP
            PERFORM add_coins(
                user_rec.id,
                coins_per_user,
                'Ежемесячное начисление коинов от ' || company_rec.company_name,
                'monthly_allowance'
            );
            total_allocated := total_allocated + 1;
        END LOOP;
    END LOOP;
    
    RETURN total_allocated;
END;
$$ LANGUAGE plpgsql;

-- 9. ПРЕДСТАВЛЕНИЯ ДЛЯ БУХГАЛТЕРСКИХ ОТЧЕТОВ

-- Баланс по пользователям
CREATE VIEW balance_report AS
SELECT 
    u.id,
    u.name,
    u.login as email,
    cp.company_name,
    ub.balance,
    ub.total_earned,
    ub.total_spent,
    ub.updated_at as last_balance_update
FROM enter u
LEFT JOIN user_balance ub ON u.id = ub.user_id
LEFT JOIN company_plans cp ON u.company_id = cp.id
ORDER BY u.name;

-- Транзакции за период
CREATE VIEW transactions_report AS
SELECT 
    ct.id,
    u.name as user_name,
    u.login as email,
    cp.company_name,
    ct.transaction_type,
    ct.amount,
    ct.description,
    ct.created_at,
    admin_user.name as processed_by_name
FROM coin_transactions ct
JOIN enter u ON ct.user_id = u.id
LEFT JOIN company_plans cp ON u.company_id = cp.id
LEFT JOIN enter admin_user ON ct.processed_by = admin_user.id
ORDER BY ct.created_at DESC;

-- Статистика по компаниям
CREATE VIEW company_statistics AS
SELECT 
    cp.id,
    cp.company_name,
    cp.employee_count,
    cp.monthly_rate,
    cp.coins_per_employee,
    COUNT(u.id) as actual_employees,
    SUM(ub.balance) as total_balance,
    SUM(ub.total_earned) as total_coins_issued,
    SUM(ub.total_spent) as total_coins_spent
FROM company_plans cp
LEFT JOIN enter u ON u.company_id = cp.id
LEFT JOIN user_balance ub ON u.id = ub.user_id
WHERE cp.is_active = true
GROUP BY cp.id, cp.company_name, cp.employee_count, cp.monthly_rate, cp.coins_per_employee;

-- 10. ОБНОВЛЕНИЕ ТАБЛИЦЫ ENTER
ALTER TABLE enter ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

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

-- 11. ПЕРВОНАЧАЛЬНАЯ СИНХРОНИЗАЦИЯ
-- Создаем записи в user_balance для всех пользователей из enter
INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
SELECT 
    id, 
    COALESCE(balance, 0.00), 
    COALESCE(balance, 0.00), 
    0.00
FROM enter 
ON CONFLICT (user_id) DO NOTHING;

-- Синхронизируем баланс в enter из user_balance
UPDATE enter 
SET balance = COALESCE(ub.balance, 0.00)
FROM user_balance ub 
WHERE enter.id = ub.user_id;

-- 12. КОММЕНТАРИИ К ТАБЛИЦАМ
COMMENT ON TABLE user_balance IS 'Баланс Yoddle-коинов пользователей';
COMMENT ON TABLE coin_transactions IS 'История всех операций с коинами';
COMMENT ON TABLE company_plans IS 'Тарифные планы компаний';

COMMENT ON COLUMN coin_transactions.transaction_type IS 'Тип операции: credit/debit/admin_add/admin_remove/benefit_purchase/monthly_allowance';
COMMENT ON COLUMN company_plans.monthly_rate IS 'Ежемесячная плата 150-450р';
COMMENT ON COLUMN company_plans.coins_per_employee IS 'Количество коинов на сотрудника в месяц';
COMMENT ON COLUMN enter.balance IS 'Текущий баланс Yoddle-коинов пользователя';

-- Выводим статус установки
SELECT 'Система Yoddle-коинов успешно установлена с исправлениями!' as status;