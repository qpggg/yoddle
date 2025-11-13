# 🔧 Диагностика проблем с AI после миграции с Docker на сервер

## 🎯 Основные причины проблем

### 1. **Переменные окружения не загружаются**

В Docker переменные окружения могли быть заданы через:
- `docker-compose.yml` (секция `environment`)
- `.env` файл в корне проекта
- Переменные окружения хоста

На продакшн сервере нужно убедиться, что переменные установлены в:
- PM2 ecosystem.config.js
- Системные переменные окружения
- `.env` файл (если используется dotenv)

### 2. **Проверка переменных окружения для AI**

#### Для основного API (`api/ai.js`):
```bash
# Проверьте наличие переменных:
echo $CLAUDE_API_KEY
echo $CLAUDE_BASE_URL
echo $DATABASE_URL
echo $PG_CONNECTION_STRING
```

#### Для Telegram бота (`telegram-bot/src/config.js`):
```bash
# Бот ищет переменные в:
# 1. Корневой .env файл: yoddle1/.env
# 2. Локальный .env: telegram-bot/.env
# 3. Системные переменные окружения

echo $CLAUDE_API_KEY
echo $OPENROUTER_API_KEY
```

### 3. **Настройка переменных в PM2**

Если используете PM2, добавьте переменные в `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'yoddle-api',
      script: './server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // AI переменные
        CLAUDE_API_KEY: 'ваш_ключ_claude',
        CLAUDE_BASE_URL: 'https://api.anthropic.com', // или ваш прокси
        OPENROUTER_API_KEY: 'ваш_ключ_openrouter', // опционально
        // Database
        DATABASE_URL: 'postgresql://...',
        PG_CONNECTION_STRING: 'postgresql://...',
      }
    },
    {
      name: 'telegram-bot',
      script: './telegram-bot/src/bot-simple.js',
      env: {
        NODE_ENV: 'production',
        // AI переменные (должны совпадать с API)
        CLAUDE_API_KEY: 'ваш_ключ_claude',
        OPENROUTER_API_KEY: 'ваш_ключ_openrouter',
        // Telegram
        BOT_TOKEN: 'ваш_токен_бота',
        ADMIN_CHAT_ID: 'ваш_telegram_id',
        // Database
        PG_CONNECTION_STRING: 'postgresql://...',
      }
    }
  ]
};
```

### 4. **Проверка загрузки переменных в коде**

Добавьте логирование в начале файлов для диагностики:

#### В `api/ai.js` (после строки 12):
```javascript
console.log('🔍 AI Config Check:');
console.log('  CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  CLAUDE_BASE_URL:', process.env.CLAUDE_BASE_URL || 'default');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
```

#### В `telegram-bot/src/config.js` (после строки 61):
```javascript
console.log('🔍 Telegram Bot AI Config Check:');
console.log('  CLAUDE_API_KEY:', config.claudeApiKey ? '✅ Set' : '❌ Missing');
console.log('  OPENROUTER_API_KEY:', config.openRouterApiKey ? '✅ Set' : '❌ Missing');
```

### 5. **Проверка работы AI API**

#### Тест основного API:
```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 7,
    "activities": ["test"],
    "notes": "test",
    "stressLevel": 3,
    "userId": 1
  }'
```

#### Проверка логов:
```bash
# PM2 логи
pm2 logs yoddle-api --lines 50

# Ищите ошибки:
# - "CLAUDE_API_KEY: ❌ Missing"
# - "401 Unauthorized" (неверный API ключ)
# - "Network error" (проблемы с сетью)
```

### 6. **Частые проблемы и решения**

#### Проблема: "CLAUDE_API_KEY is undefined"
**Решение:**
1. Проверьте наличие переменной в PM2: `pm2 show yoddle-api`
2. Добавьте в ecosystem.config.js
3. Перезапустите PM2: `pm2 restart all`

#### Проблема: "401 Unauthorized" от Claude API
**Решение:**
1. Проверьте правильность API ключа
2. Убедитесь, что ключ не истек
3. Проверьте формат ключа (должен начинаться с `sk-ant-`)

#### Проблема: "Network error" или "getaddrinfo EAI_AGAIN"
**Решение:**
1. Проверьте интернет-соединение сервера
2. Проверьте firewall правила
3. Если используете прокси (CLAUDE_BASE_URL), проверьте его доступность

#### Проблема: AI работает в Docker, но не на сервере
**Решение:**
1. Docker мог использовать переменные из docker-compose.yml
2. На сервере нужно явно установить переменные в PM2 или .env
3. Проверьте, что .env файл существует и загружается

### 7. **Быстрая диагностика**

Создайте тестовый скрипт `test-ai-config.js`:

```javascript
require('dotenv').config();

console.log('=== AI Configuration Check ===\n');

const checks = [
  { name: 'CLAUDE_API_KEY', value: process.env.CLAUDE_API_KEY },
  { name: 'OPENROUTER_API_KEY', value: process.env.OPENROUTER_API_KEY },
  { name: 'DATABASE_URL', value: process.env.DATABASE_URL },
  { name: 'PG_CONNECTION_STRING', value: process.env.PG_CONNECTION_STRING },
];

checks.forEach(check => {
  const status = check.value ? '✅' : '❌';
  const display = check.value 
    ? `${check.value.substring(0, 10)}...` 
    : 'NOT SET';
  console.log(`${status} ${check.name}: ${display}`);
});

console.log('\n=== Test Claude API ===');
if (process.env.CLAUDE_API_KEY) {
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
  });
  
  anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'test' }]
  })
    .then(() => console.log('✅ Claude API работает!'))
    .catch(err => console.error('❌ Claude API ошибка:', err.message));
} else {
  console.log('❌ CLAUDE_API_KEY не установлен');
}
```

Запустите:
```bash
node test-ai-config.js
```

### 8. **Проверка после исправления**

1. Перезапустите все процессы:
```bash
pm2 restart all
pm2 logs --lines 100
```

2. Проверьте, что переменные загружены:
```bash
pm2 show yoddle-api | grep env
pm2 show telegram-bot | grep env
```

3. Протестируйте AI функционал через веб-интерфейс

## 📝 Чеклист миграции

- [ ] Переменные окружения установлены в PM2 ecosystem.config.js
- [ ] .env файл существует и содержит все необходимые переменные
- [ ] API ключи Claude и OpenRouter валидны
- [ ] DATABASE_URL или PG_CONNECTION_STRING настроены правильно
- [ ] Логи показывают успешную загрузку переменных
- [ ] Тестовый запрос к AI API работает
- [ ] Telegram бот может использовать AI функции

