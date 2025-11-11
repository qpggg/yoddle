# ✅ ПРОВЕРКА: PostgreSQL автозапуск на сервере

## 🔍 Проверка статуса PostgreSQL:

```bash
# 1. Проверьте, запущен ли PostgreSQL
systemctl status postgresql

# 2. Проверьте, включен ли автозапуск
systemctl is-enabled postgresql

# Должно быть: "enabled"
```

## 🔧 Если автозапуск не включен:

```bash
# Включите автозапуск PostgreSQL
systemctl enable postgresql

# Запустите PostgreSQL (если не запущен)
systemctl start postgresql

# Проверьте статус
systemctl status postgresql
```

## ✅ Что это значит:

- **PostgreSQL будет запускаться автоматически** при перезагрузке сервера
- **База данных будет доступна всегда**, пока сервер работает
- **Данные сохраняются на диске** сервера (не потеряются при перезапуске)

## 📋 Проверка работы:

```bash
# Проверьте подключение к БД
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"

# Проверьте таблицы
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"
```

## ⚠️ Важно:

- **Резервное копирование**: Настройте регулярные бэкапы БД
- **Мониторинг**: Следите за дисковым пространством
- **Безопасность**: Храните пароли БД в безопасности

Выполните команды на сервере и проверьте статус PostgreSQL!




