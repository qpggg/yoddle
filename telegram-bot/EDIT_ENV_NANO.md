# Команда для редактирования .env через nano:

nano /root/yoddle/.env

# Или если вы в директории проекта:
cd /root/yoddle
nano .env

# ============================================
# ЧТО ДОБАВИТЬ/ПРОВЕРИТЬ В .env:
# ============================================

# 1. ДОБАВИТЬ PG_CONNECTION_STRING (для бота)
# Раскомментируйте эту строку или добавьте её:
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db

# 2. ДОБАВИТЬ API_BASE_URL (для бота)
API_BASE_URL=http://localhost:3000

# 3. ПРОВЕРИТЬ что CLAUDE_API_KEY заполнен (для ИИ на сайте)
CLAUDE_API_KEY=sk-ant-api03-wHysdMlw2kaNkw0BDf_Vq4Fd1idY8Wy09nJfY-Fx7uScBVCRybuDpiFAQBcVpyFh430urk60BJ35LFOJCVISQA-nZ7RcAAA

# 4. ПРОВЕРИТЬ CLAUDE_BASE_URL (для ИИ на сайте)
CLAUDE_BASE_URL=https://anthropic-proxy.yoddle-proxy.workers.dev

# ============================================
# ПОЛНЫЙ ПРИМЕР .env (все важные переменные):
# ============================================

# Database - для основного сайта (можно оставить как есть)
PGHOST=localhost
PGPORT=5432
PGDATABASE=yoddle_db
PGUSER=yoddle_user
PGPASSWORD=1WIzL7aP_F

# Database - для бота (ДОБАВИТЬ!)
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db

# Server
PORT=3000
NODE_ENV=production

# API для бота (ДОБАВИТЬ!)
API_BASE_URL=http://localhost:3000

# Claude AI (ПРОВЕРИТЬ что заполнено!)
CLAUDE_API_KEY=sk-ant-api03-wHysdMlw2kaNkw0BDf_Vq4Fd1idY8Wy09nJfY-Fx7uScBVCRybuDpiFAQBcVpyFh430urk60BJ35LFOJCVISQA-nZ7RcAAA
CLAUDE_BASE_URL=https://anthropic-proxy.yoddle-proxy.workers.dev

# Telegram Bot
BOT_TOKEN=8287973233:AAFWussCdMTQvptTnhA_a4eUgLV8iTZhoL8

# JWT
JWT_SECRET=your_jwt_secret_here

# RESEND
RESEND_API_KEY=re_Z2mEJNKv_7JiHL4GjqV68kmPCxGGStape

# ============================================
# ПОСЛЕ РЕДАКТИРОВАНИЯ:
# ============================================

# Сохранить в nano: Ctrl+O, Enter
# Выйти из nano: Ctrl+X

# Перезапустить бота:
pm2 restart yoddle-tg

# Перезапустить основной сервер (если нужно):
pm2 restart server

# Проверить логи:
pm2 logs yoddle-tg --lines 30
pm2 logs server --lines 30

# ============================================
# ПРОВЕРКА РАБОТЫ ИИ НА САЙТЕ:
# ============================================

# Проверить что API доступен:
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 5, "energy": 5, "stressLevel": 5, "userId": 123}'

# Если ошибка - проверить логи сервера:
pm2 logs server --lines 50 | grep -i "claude\|ai\|error"

