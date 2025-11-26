# 🔧 Восстановление Telegram-бота на сервере

## Быстрое восстановление

### Шаг 1: Подключитесь к серверу
```bash
ssh root@your_server_ip
# или
ssh your_user@your_server_ip
```

### Шаг 2: Перейдите в директорию проекта
```bash
cd /var/www/yoddle  # или путь к вашему проекту
# или если проект в другой папке:
cd ~/yoddle1
```

### Шаг 3: Проверьте статус PM2
```bash
pm2 status
```

### Шаг 4: Восстановите бота

#### Вариант А: Если процесс существует, но остановлен
```bash
pm2 restart yoddle-tg
```

#### Вариант Б: Если процесс полностью удалён
```bash
cd telegram-bot
pm2 start ecosystem.config.js
pm2 save
```

#### Вариант В: Используя скрипт (если загружен на сервер)
```bash
chmod +x restore_telegram_bot.sh
./restore_telegram_bot.sh
```

### Шаг 5: Проверьте работу
```bash
# Статус
pm2 status

# Логи в реальном времени
pm2 logs yoddle-tg

# Последние 50 строк логов
pm2 logs yoddle-tg --lines 50 --nostream
```

---

## 🔍 Диагностика проблем

### Бот не запускается

1. **Проверьте наличие .env файла:**
```bash
cd telegram-bot
ls -la .env
# или
ls -la ../.env
```

2. **Проверьте переменные окружения:**
```bash
cat .env | grep BOT_TOKEN
# Должна быть строка: BOT_TOKEN=your_token_here
```

3. **Проверьте логи ошибок:**
```bash
pm2 logs yoddle-tg --err
```

4. **Проверьте подключение к БД:**
```bash
# Убедитесь, что PostgreSQL запущен
systemctl status postgresql

# Проверьте подключение
psql -U yoddle_user -d yoddle_db -c "SELECT 1;"
```

### Бот падает сразу после запуска

1. **Проверьте ошибки:**
```bash
pm2 logs yoddle-tg --err --lines 100
```

2. **Запустите бота вручную для детальной диагностики:**
```bash
cd telegram-bot
node src/bot-simple.js
```

3. **Проверьте зависимости:**
```bash
cd telegram-bot
npm install
```

### Бот не отвечает на сообщения

1. **Проверьте токен бота:**
```bash
# Проверьте токен через curl
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe
```

2. **Проверьте, что бот работает:**
```bash
pm2 status yoddle-tg
# Должен быть статус "online"
```

3. **Перезапустите бота:**
```bash
pm2 restart yoddle-tg
```

---

## 📝 Ручной запуск (если PM2 не работает)

```bash
cd telegram-bot
node src/bot-simple.js
```

Для запуска в фоне без PM2:
```bash
cd telegram-bot
nohup node src/bot-simple.js > bot.log 2>&1 &
```

---

## 🔄 Полная переустановка процесса

Если ничего не помогает:

```bash
# 1. Остановите и удалите процесс
pm2 stop yoddle-tg
pm2 delete yoddle-tg

# 2. Перейдите в директорию бота
cd telegram-bot

# 3. Убедитесь, что зависимости установлены
npm install

# 4. Проверьте конфигурацию
cat ecosystem.config.js

# 5. Запустите заново
pm2 start ecosystem.config.js

# 6. Сохраните конфигурацию
pm2 save

# 7. Настройте автозапуск (если ещё не настроен)
pm2 startup
# Выполните команду, которую выведет pm2 startup

# 8. Проверьте логи
pm2 logs yoddle-tg
```

---

## 📋 Чек-лист

- [ ] Подключение к серверу установлено
- [ ] PM2 установлен (`npm list -g pm2` или `pm2 --version`)
- [ ] Проект находится в нужной директории
- [ ] .env файл существует и содержит BOT_TOKEN
- [ ] База данных PostgreSQL запущена и доступна
- [ ] Зависимости установлены (`npm install` в telegram-bot/)
- [ ] Процесс запущен (`pm2 status`)
- [ ] Логи не показывают ошибок (`pm2 logs yoddle-tg`)
- [ ] Бот отвечает в Telegram

---

## 🆘 Если ничего не помогло

1. **Свяжитесь с поддержкой** и предоставьте:
   - Вывод `pm2 logs yoddle-tg --err --lines 100`
   - Вывод `pm2 status`
   - Вывод `node --version` и `npm --version`

2. **Проверьте системные логи:**
```bash
journalctl -u pm2 -n 100
# или
dmesg | tail -50
```

3. **Проверьте ресурсы сервера:**
```bash
free -h
df -h
top
```

