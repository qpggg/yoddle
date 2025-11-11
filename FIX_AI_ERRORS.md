# 🔧 Исправление ошибок AI API

## 📋 Проблемы из логов:

1. **Ошибка 401: `invalid x-api-key`** - неправильный ключ Claude API
2. **Foreign key constraint: `Key (user_id)=(896466896) is not present in table "enter"`** - код пытается использовать telegram_id как user_id

## ✅ Решение:

### Шаг 1: Проверьте и создайте user_id = 1

```bash
# Проверка
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT id FROM enter WHERE id = 1;"

# Если пусто - создайте
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
INSERT INTO enter (id, email, name, created_at) 
VALUES (1, 'telegram@yoddle.ru', 'Telegram Users', NOW())
ON CONFLICT (id) DO NOTHING;
"
```

### Шаг 2: Проверьте CLAUDE_API_KEY

```bash
# Проверка текущего значения
pm2 env 0 | grep CLAUDE_API_KEY

# Если пусто или неправильный - отредактируйте .env
nano .env

# Добавьте/исправьте:
CLAUDE_API_KEY=sk-ant-api03-...

# Перезапустите сервер
pm2 restart server
```

### Шаг 3: Проверьте что код исправлен

Я добавил дополнительное логирование в код. После перезапуска проверьте логи:

```bash
pm2 restart server
pm2 logs server --lines 20
```

Теперь в логах будет видно:
- `🔍 AI analyze-mood: originalUserId=..., final userId=...`
- `💾 Сохранение ai_signals: user_id=..., telegram_id=...`

### Шаг 4: Протестируйте

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "userId": 896466896}'
```

## 🔍 Диагностика:

Если ошибка все еще есть, проверьте логи:

```bash
pm2 logs server --lines 50 | grep -E "AI analyze-mood|Сохранение ai_signals|Telegram пользователь"
```

Вы должны увидеть:
- `🔍 AI analyze-mood: originalUserId=896466896, final userId=1`
- `💾 Сохранение ai_signals: user_id=1, telegram_id=896466896`

Если видите `user_id=896466896` вместо `user_id=1` - значит код не работает правильно.

