# 🔧 Исправление ошибки 500 в ИИ API

## Проблема:
Бот получает ошибку `500 Internal Server Error` при обращении к `/api/ai/analyze-mood`

## Что исправлено:

1. **Исправлено подключение к БД в `api/ai.js`:**
   - Было: `process.env.DATABASE_URL`
   - Стало: `process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL`
   - Теперь использует ту же переменную, что и основной сайт

## Что проверить на сервере:

### 1. Проверьте логи основного сервера:

```bash
pm2 logs server --lines 50 | grep -i "error\|claude\|ai"
```

Ищите ошибки типа:
- `CLAUDE_API_KEY is not set`
- `Error connecting to Anthropic API`
- `Database connection error`

### 2. Проверьте переменные окружения:

```bash
cd /root/yoddle
cat .env | grep -E "CLAUDE_API_KEY|CLAUDE_BASE_URL|PG_CONNECTION_STRING"
```

Должно быть:
```env
CLAUDE_API_KEY=sk-ant-api03-...
CLAUDE_BASE_URL=https://anthropic-proxy.yoddle-proxy.workers.dev
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db
```

### 3. Проверьте работу Claude API напрямую:

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

### 4. Перезапустите сервер после обновления кода:

```bash
cd /root/yoddle
git pull origin stable
pm2 restart server
pm2 logs server --lines 30
```

## Возможные причины ошибки 500:

1. **CLAUDE_API_KEY не установлен или неверный**
   - Проверьте что ключ правильный в `.env`
   - Проверьте что сервер перезапущен после изменения `.env`

2. **CLAUDE_BASE_URL неверный или прокси не работает**
   - Проверьте что Cloudflare Worker прокси работает
   - Попробуйте убрать `CLAUDE_BASE_URL` временно (прямое подключение)

3. **Проблема с БД**
   - Проверьте что таблицы `ai_signals` и `ai_insights` существуют
   - Проверьте подключение к БД

4. **Ошибка в коде**
   - Проверьте логи сервера на детальную ошибку

## Быстрая проверка:

```bash
# 1. Проверить что сервер запущен
pm2 list

# 2. Проверить логи
pm2 logs server --lines 100

# 3. Проверить переменные (без показа паролей)
pm2 env server | grep -E "CLAUDE|PG_CONNECTION"
```

