# ✅ Проверка user_id = 1 в таблице enter

## 🔍 Команда для проверки и отображения таблицы enter:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT * FROM enter WHERE id = 1;"
```

## 📋 Команда для отображения всех записей в таблице enter:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT id, email, name, created_at FROM enter ORDER BY id LIMIT 10;"
```

## 🔧 Если user_id = 1 не существует, создайте его:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
INSERT INTO enter (id, email, name, created_at) 
VALUES (1, 'telegram@yoddle.ru', 'Telegram Users', NOW())
ON CONFLICT (id) DO NOTHING
RETURNING *;
"
```

## 🧪 После проверки - протестируйте API:

```bash
# Перезапустите сервер чтобы подхватить новый CLAUDE_API_KEY
pm2 restart server

# Подождите 2 секунды
sleep 2

# Протестируйте API
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "userId": 896466896}'
```

## 📊 Проверка логов после теста:

```bash
pm2 logs server --lines 30 | grep -E "AI analyze-mood|Сохранение ai_signals|Telegram пользователь|Claude API"
```

