# 🧪 Инструкция по тестированию API подключения

## 📋 Быстрая проверка API

### 1. Проверка доступности API сервера

```bash
# Проверка health endpoint
curl http://localhost:3000/health

# Или через внешний URL
curl https://yoddle.ru/health
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-11T19:47:39.459Z",
  "uptime": 12345.67
}
```

### 2. Тестирование ИИ API (analyze-mood)

#### Для обычного пользователя сайта:

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 8,
    "energy": 7,
    "stressLevel": 3,
    "notes": "Хороший день",
    "activities": ["работа", "спорт"],
    "userId": 1
  }'
```

#### Для Telegram пользователя:

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 10,
    "energy": 10,
    "stressLevel": 2,
    "notes": "",
    "activities": [],
    "userId": 896466896
  }'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "analysis": "Ваше настроение отличное...",
  "signalId": 123,
  "message": "Настроение проанализировано и сохранено"
}
```

### 3. Проверка ошибок

#### Если API недоступен (502/503):
```bash
# Проверьте что сервер запущен
pm2 list

# Проверьте логи
pm2 logs server --lines 50
```

#### Если ошибка 500:
```bash
# Проверьте логи сервера на детальную ошибку
pm2 logs server --lines 100 | grep -i "error\|claude\|ai"
```

#### Если ошибка 404:
```bash
# Проверьте что endpoint существует
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 5, "userId": 1}'
```

### 4. Проверка переменных окружения

```bash
# Проверьте что переменные загружены (на сервере)
cd /root/yoddle
pm2 env server | grep -E "CLAUDE|PG_CONNECTION"
```

Или через Node.js:
```bash
node -e "require('dotenv').config(); console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'OK' : 'NOT SET'); console.log('CLAUDE_BASE_URL:', process.env.CLAUDE_BASE_URL || 'NOT SET');"
```

### 5. Проверка подключения к БД

```bash
# Проверьте подключение к PostgreSQL
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT 1;"

# Проверьте что таблицы существуют
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt ai_*"

# Проверьте что user_id = 1 существует в enter
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT id, name, login FROM enter WHERE id = 1;"
```

### 6. Проверка работы Claude API

#### Прямое подключение (без прокси):

```bash
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

#### Через прокси (если настроен):

```bash
curl -X POST https://anthropic-proxy.yoddle-proxy.workers.dev/v1/messages \
  -H "x-api-key: YOUR_CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 7. Полный тест через скрипт

Создайте файл `test_api.sh`:

```bash
#!/bin/bash

echo "🔍 Тест 1: Health check"
curl -s http://localhost:3000/health | jq .

echo ""
echo "🔍 Тест 2: ИИ API для Telegram пользователя"
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 8,
    "energy": 7,
    "stressLevel": 3,
    "notes": "Тест",
    "activities": [],
    "userId": 896466896
  }' | jq .

echo ""
echo "🔍 Тест 3: Проверка сохранения в БД"
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

Сделайте исполняемым и запустите:
```bash
chmod +x test_api.sh
./test_api.sh
```

### 8. Проверка через PM2

```bash
# Проверка статуса
pm2 list

# Проверка логов в реальном времени
pm2 logs server --lines 50

# Перезапуск после изменений
pm2 restart server

# Проверка использования памяти/CPU
pm2 monit
```

### 9. Проверка работы Telegram бота с API

```bash
# Логи бота
pm2 logs yoddle-tg --lines 50

# Проверка что бот видит API
pm2 logs yoddle-tg | grep -i "api\|error"
```

### 10. Отладка проблем

#### Если API возвращает 500:

1. **Проверьте логи сервера:**
   ```bash
   pm2 logs server --lines 100 | grep -A 10 "error\|Error\|ERROR"
   ```

2. **Проверьте переменные окружения:**
   ```bash
   pm2 env server | grep CLAUDE
   ```

3. **Проверьте подключение к БД:**
   ```bash
   pm2 logs server | grep -i "database\|postgres\|connection"
   ```

#### Если Claude API не работает:

1. **Проверьте ключ API:**
   ```bash
   # В .env должен быть установлен
   grep CLAUDE_API_KEY /root/yoddle/.env
   ```

2. **Проверьте прокси (если используется):**
   ```bash
   curl -I https://anthropic-proxy.yoddle-proxy.workers.dev/v1/messages
   ```

3. **Проверьте прямую доступность API:**
   ```bash
   curl -X POST https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "Content-Type: application/json" \
     -d '{"model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'
   ```

## ✅ Чеклист успешного теста

- [ ] Health endpoint возвращает `{"status": "ok"}`
- [ ] ИИ API возвращает `{"success": true, "analysis": "..."}`
- [ ] Данные сохраняются в `ai_signals` с правильным `telegram_id` в поле `data`
- [ ] Лимит работает (после 3 запросов возвращается 429)
- [ ] Логи сервера не показывают ошибок
- [ ] Claude API отвечает (проверка через прямые запросы)

## 🔧 Быстрые команды для копирования

```bash
# Полный тест ИИ API
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "notes": "Тест", "activities": [], "userId": 896466896}' | jq .

# Проверка последних записей в БД
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT id, user_id, data->>'telegram_id' as tg_id, data->>'mood' as mood, timestamp FROM ai_signals ORDER BY timestamp DESC LIMIT 5;"

# Проверка логов
pm2 logs server --lines 30 | tail -20
```

