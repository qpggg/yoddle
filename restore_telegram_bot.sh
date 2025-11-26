#!/bin/bash
# Скрипт для восстановления Telegram-бота через PM2

echo "🔍 Проверяю статус PM2 процессов..."
pm2 status

echo ""
echo "🔍 Проверяю логи телеграм-бота..."
pm2 logs yoddle-tg --lines 50 --nostream

echo ""
echo "📂 Перехожу в директорию телеграм-бота..."
cd telegram-bot || { echo "❌ Ошибка: папка telegram-bot не найдена!"; exit 1; }

echo ""
echo "🔍 Проверяю наличие .env файла..."
if [ ! -f .env ]; then
    echo "⚠️ Внимание: .env файл не найден в telegram-bot/"
    echo "Проверяю наличие .env в корне проекта..."
    if [ ! -f ../.env ]; then
        echo "❌ Ошибка: .env файл не найден ни в telegram-bot/, ни в корне проекта!"
        echo "Создайте .env файл с необходимыми переменными окружения."
        exit 1
    else
        echo "✅ .env найден в корне проекта"
    fi
fi

echo ""
echo "🛑 Останавливаю существующий процесс (если запущен)..."
pm2 stop yoddle-tg 2>/dev/null || true
pm2 delete yoddle-tg 2>/dev/null || true

echo ""
echo "🚀 Запускаю телеграм-бота через PM2..."
pm2 start ecosystem.config.js

echo ""
echo "⏳ Жду 3 секунды для запуска..."
sleep 3

echo ""
echo "📊 Проверяю статус процесса..."
pm2 status yoddle-tg

echo ""
echo "📝 Последние логи:"
pm2 logs yoddle-tg --lines 20 --nostream

echo ""
echo "💾 Сохраняю конфигурацию PM2 для автозапуска..."
pm2 save

echo ""
echo "✅ Готово! Проверьте статус:"
echo "   pm2 status"
echo "   pm2 logs yoddle-tg"
echo ""
echo "Если бот не работает, проверьте:"
echo "   1. Наличие BOT_TOKEN в .env файле"
echo "   2. Логи: pm2 logs yoddle-tg --err"
echo "   3. Подключение к базе данных"

