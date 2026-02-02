# ✅ Проверка подключения бота к БД

## 🔍 Как проверить, что бот использует ту же БД

### 1. Проверьте `.env` файл

Убедитесь, что в корневом `.env` есть `PG_CONNECTION_STRING`:

```env
PG_CONNECTION_STRING=postgresql://USER:PASSWORD@HOST:5432/yoddle_db
BOT_TOKEN=your_bot_token
```

### 2. Запустите бота и проверьте логи

При запуске бота вы должны увидеть:

```
✅ Telegram bot DB: Connected using PG_CONNECTION_STRING
✅ Database connection verified
```

Если видите ошибку подключения, проверьте:
- Правильность `PG_CONNECTION_STRING` в `.env`
- Доступность БД с сервера: `psql -h localhost -U yoddle_user -d yoddle_db`
- Права пользователя `yoddle_user`

### 3. Проверьте, что оба сервиса используют одну БД

**Основной сайт** (`server.js`):
```bash
# В логах должно быть:
🔍 DEBUG: .env loaded, PG_CONNECTION_STRING = postgresql://yoddle_user:****@localhost:5432/yoddle_db
```

**Telegram бот** (`bot-simple.js`):
```bash
# В логах должно быть:
✅ Telegram bot DB: Connected using PG_CONNECTION_STRING
```

### 4. Тестовая проверка

Создайте тестового лида через бота и проверьте в БД:

```sql
-- В psql
SELECT 
  telegram_id,
  telegram_username,
  source,
  created_at
FROM leads 
WHERE source = 'telegram' 
ORDER BY created_at DESC 
LIMIT 1;
```

Если видите запись - все работает! ✅

