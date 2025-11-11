# ✅ Проверка и создание user_id = 1 для Telegram

## 🔍 Проверка есть ли запись с id = 1:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT id, login, name, position FROM enter WHERE id = 1;"
```

## 📋 Показать все записи в таблице enter:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT id, login, name, position FROM enter ORDER BY id;"
```

## 🔧 Если записи с id = 1 нет - создайте её:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
INSERT INTO enter (id, login, name, position, password) 
VALUES (1, 'telegram@yoddle.ru', 'Telegram Users', 'System', 'telegram')
ON CONFLICT (id) DO UPDATE SET name = 'Telegram Users'
RETURNING id, login, name, position;
"
```

**Важно:** Используем `ON CONFLICT (id)` чтобы не было ошибки если запись уже существует.

## 🔄 Альтернатива - если id это SERIAL и не позволяет вставить:

Если получите ошибку что id нельзя указать явно, используйте:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
-- Сначала проверяем минимальный id
SELECT MIN(id) as min_id FROM enter;

-- Если min_id > 1, создаем запись с id = 1
-- Но так как id SERIAL, нужно использовать SETVAL
SELECT setval('enter_id_seq', GREATEST((SELECT MAX(id) FROM enter), 1), false);

-- Теперь создаем запись (она получит id = 1 если последовательность была сброшена)
INSERT INTO enter (login, name, position, password) 
VALUES ('telegram@yoddle.ru', 'Telegram Users', 'System', 'telegram')
ON CONFLICT (login) DO NOTHING
RETURNING id, login, name;
"
```

## 🎯 Простое решение - создать запись и проверить её id:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
-- Создаем запись для Telegram пользователей
INSERT INTO enter (login, name, position, password) 
VALUES ('telegram@yoddle.ru', 'Telegram Users', 'System', 'telegram')
ON CONFLICT (login) DO UPDATE SET name = 'Telegram Users'
RETURNING id, login, name, position;

-- Проверяем что запись создана
SELECT id, login, name, position FROM enter WHERE login = 'telegram@yoddle.ru';
"
```

**После этого обновите код чтобы использовать этот id вместо фиксированного 1.**

## 🧪 Или используйте существующий минимальный id:

```bash
# Найти минимальный id в таблице
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
SELECT MIN(id) as min_id, COUNT(*) as total_users FROM enter;
"
```

**Если минимальный id = 1, значит запись уже есть!**

