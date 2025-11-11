# 🔧 Исправление ошибок подключения бота

## ❌ Проблемы в логах

### 1. Ошибка БД: `password authentication failed for user "postgres"`

**Причина:** Бот пытается подключиться как пользователь `postgres`, но должен использовать `yoddle_user`.

**Решение:** Убедитесь, что в `.env` на сервере есть `PG_CONNECTION_STRING`:

```env
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db
```

### 2. Ошибка API: `404 Not Found` на `http://localhost:3000/api/ai/analyze-mood`

**Причина:** Бот пытается обратиться к API на `localhost:3000`, но на сервере это не работает.

**Решение:** Установите правильный `API_BASE_URL` в `.env`:

```env
# Для продакшена (если API на том же сервере)
API_BASE_URL=http://localhost:3000

# ИЛИ если API на другом домене
API_BASE_URL=https://yoddle.ru
```

---

## ✅ Проверка конфигурации на сервере

### 1. Проверьте `.env` файл

```bash
cd /root/yoddle
cat .env | grep -E "PG_CONNECTION_STRING|API_BASE_URL|BOT_TOKEN"
```

Должно быть:
```env
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db
API_BASE_URL=http://localhost:3000
BOT_TOKEN=your_bot_token
```

### 2. Проверьте подключение к БД

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT 1;"
```

Если работает - БД настроена правильно.

### 3. Проверьте доступность API

```bash
curl http://localhost:3000/api/ai/analyze-mood
```

Если возвращает ошибку (но не 404) - API работает, просто нужен POST запрос.

### 4. Перезапустите бота

```bash
pm2 restart yoddle-tg
pm2 logs yoddle-tg --lines 50
```

После перезапуска вы должны увидеть:
```
✅ Telegram bot DB: Using PG_CONNECTION_STRING
✅ Database connection verified
```

---

## 🔍 Отладка

### Если все еще ошибка БД:

1. **Проверьте что переменная загружается:**
   ```bash
   cd /root/yoddle/telegram-bot
   node -e "require('dotenv').config({path: '../.env'}); console.log(process.env.PG_CONNECTION_STRING ? 'OK' : 'NOT SET');"
   ```

2. **Проверьте права пользователя:**
   ```sql
   \du yoddle_user
   ```

3. **Проверьте что таблица существует:**
   ```sql
   \dt leads
   ```

### Если все еще ошибка API:

1. **Проверьте что основной сервер запущен:**
   ```bash
   pm2 list
   curl http://localhost:3000/health
   ```

2. **Проверьте что endpoint существует:**
   ```bash
   curl -X POST http://localhost:3000/api/ai/analyze-mood \
     -H "Content-Type: application/json" \
     -d '{"mood": 5, "energy": 5, "stressLevel": 5, "userId": 123}'
   ```

---

## 📝 Пример правильного `.env` на сервере

```env
# Database (ОБЯЗАТЕЛЬНО!)
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db

# API (для продакшена)
API_BASE_URL=http://localhost:3000
# ИЛИ если API на другом домене:
# API_BASE_URL=https://yoddle.ru

# Telegram Bot
BOT_TOKEN=your_telegram_bot_token
ADMIN_CHAT_ID=your_admin_chat_id

# Web
YODDLE_WEB_URL=https://yoddle.ru
```

---

## ✅ После исправления

После настройки `.env` и перезапуска бота, логи должны показывать:

```
✅ .env файл загружен из: /root/yoddle/.env
✅ Telegram bot DB: Using PG_CONNECTION_STRING
✅ Database connection verified
✅ Бот запущен и готов к работе!
```

**БЕЗ ошибок:**
- ❌ `password authentication failed`
- ❌ `connect ECONNREFUSED`
- ❌ `404 Not Found`

