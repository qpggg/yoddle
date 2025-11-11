# ✅ user_id = 1 существует! Тестируем API

## 🎉 Отлично! Запись с id = 1 уже есть:
- **id = 1**: admin@gmail.com (Михаил, CEO)

## 🔄 Шаг 1: Перезапустите сервер чтобы подхватить новый CLAUDE_API_KEY:

```bash
pm2 restart server
```

## ⏱️ Шаг 2: Подождите 2-3 секунды:

```bash
sleep 3
```

## 🧪 Шаг 3: Протестируйте API:

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "userId": 896466896}'
```

## 📊 Шаг 4: Проверьте логи:

```bash
pm2 logs server --lines 30 | grep -E "AI analyze-mood|Сохранение ai_signals|Telegram пользователь|Claude API|error"
```

**Ожидаемые логи:**
- `🔍 AI analyze-mood: originalUserId=896466896, final userId=1`
- `💾 Сохранение ai_signals: user_id=1, telegram_id=896466896`
- `ℹ️ Telegram пользователь 896466896 использует user_id = 1 для AI системы`

## ✅ Шаг 5: Проверьте что данные сохранились в БД:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
SELECT 
  id, 
  user_id, 
  type,
  data->>'telegram_id' as telegram_id,
  data->>'mood' as mood,
  timestamp 
FROM ai_signals 
ORDER BY timestamp DESC 
LIMIT 3;
"
```

## 🎯 Если все работает, вы увидите:

**В ответе API:**
```json
{
  "success": true,
  "analysis": "Анализ настроения от Claude...",
  "signalId": 123,
  "message": "Настроение проанализировано и сохранено"
}
```

**В логах:**
- Нет ошибок `invalid x-api-key`
- Нет ошибок `foreign key constraint`
- Видны логи о сохранении данных

## 🐛 Если все еще есть ошибки:

Проверьте что новый CLAUDE_API_KEY действительно загружен:

```bash
pm2 env 0 | grep CLAUDE_API_KEY
```

Если ключ не виден, перезапустите сервер еще раз или проверьте `.env` файл.

