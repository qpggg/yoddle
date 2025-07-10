-- Добавление колонки company в таблицу clients
ALTER TABLE clients ADD COLUMN company VARCHAR(255);

-- Проверка структуры таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Проверка данных
SELECT 'Колонка company успешно добавлена!' AS result; 