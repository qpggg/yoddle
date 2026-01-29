-- Назначить льготам условную стоимость и начислить пользователю 4 баланс 10 000 для тестов
-- Одна льгота дорогая (5000), остальные по разным ценам

-- 1. Цены льгот (одна 5000, остальные 100–2000)
UPDATE benefits SET price_coins = 5000 WHERE id = 1;   -- Профилактика выгорания — дорогая
UPDATE benefits SET price_coins = 100  WHERE id = 2;
UPDATE benefits SET price_coins = 200  WHERE id = 3;
UPDATE benefits SET price_coins = 300  WHERE id = 4;
UPDATE benefits SET price_coins = 500  WHERE id = 5;
UPDATE benefits SET price_coins = 500  WHERE id = 6;
UPDATE benefits SET price_coins = 750  WHERE id = 7;
UPDATE benefits SET price_coins = 1000 WHERE id = 8;
UPDATE benefits SET price_coins = 1000 WHERE id = 9;
UPDATE benefits SET price_coins = 1500 WHERE id = 10;
UPDATE benefits SET price_coins = 2000 WHERE id = 21;
UPDATE benefits SET price_coins = 2500 WHERE id = 22;

-- 2. Создать/обновить баланс пользователя 4 = 10 000
INSERT INTO user_balance (user_id, balance, total_earned, total_spent, updated_at)
VALUES (4, 10000, 10000, 0, NOW())
ON CONFLICT (user_id) DO UPDATE SET
  balance = 10000,
  total_earned = GREATEST(user_balance.total_earned, 10000),
  total_spent = COALESCE(user_balance.total_spent, 0),
  updated_at = NOW();

-- 3. Записать начисление в историю (admin_add)
INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
VALUES (4, 'admin_add', 10000, 0, 10000, 'Тестовый баланс 10 000 для пользователя 4', NULL, NULL, NOW());

-- Если таблица без UNIQUE по (user_id, ...), вставка всегда выполнится. Проверка результата:
SELECT 'benefits' AS tbl, id, name, price_coins FROM benefits ORDER BY id;
SELECT 'user_balance' AS tbl, user_id, balance, total_earned, total_spent FROM user_balance WHERE user_id = 4;
