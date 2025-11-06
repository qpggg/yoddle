# ✅ ПРОВЕРКА СОЗДАНИЯ БД И ИМПОРТ БЭКАПА

## 📋 Ваши параметры БД:

- **Имя БД**: `yoddle_db`
- **Пользователь**: `yoddle_user`
- **Пароль**: `1WIzL7aP_F`
- **Хост**: `localhost`
- **Порт**: `5432`

---

## ✅ ШАГ 1: Проверьте создание БД

```bash
# Проверьте подключение к новой БД
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"

# Проверьте список баз данных
sudo -u postgres psql -c "\l" | grep yoddle_db

# Проверьте список таблиц (пока пусто, но БД должна быть доступна)
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"
```

---

## 📤 ШАГ 2: Получите файл бэкапа на сервере

```bash
# Перейдите в папку проекта
cd /root/yoddle

# Обновите код из репозитория (файл backup_full1.sql будет в public/)
git checkout stable
git pull origin stable

# Проверьте наличие файла
ls -lh public/backup_full1.sql
```

---

## 📥 ШАГ 3: Импортируйте бэкап в БД

```bash
# Импортируйте бэкап с вашими параметрами
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -f public/backup_full1.sql

# ИЛИ с выводом ошибок в файл (рекомендуется):
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

**Примечание**: Импорт может занять некоторое время в зависимости от размера БД.

---

## ✅ ШАГ 4: Проверьте импорт

```bash
# Проверьте список таблиц (должны появиться таблицы из бэкапа)
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"

# Проверьте количество записей в основных таблицах
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM enter;"
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM benefits;"
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM telegram_leads;"
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM user_progress;"
```

---

## 🔧 ШАГ 5: Обновите .env файл на сервере

```bash
# На сервере
cd /root/yoddle
nano .env
```

Добавьте или обновите параметры БД:

```env
# Параметры БД (локальная БД на сервере)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yoddle_db
DB_USER=yoddle_user
DB_PASSWORD=1WIzL7aP_F

# Для db.js (альтернативный вариант)
PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db

# ИЛИ отдельные переменные для db.js
PGHOST=localhost
PGPORT=5432
PGDATABASE=yoddle_db
PGUSER=yoddle_user
PGPASSWORD=1WIzL7aP_F
```

Сохраните файл (Ctrl+O, Enter, Ctrl+X)

---

## 🔄 ШАГ 6: Перезапустите приложения

```bash
# Перезапустите приложения с новыми параметрами БД
pm2 restart yoddle-api
pm2 restart yoddle-tg

# Проверьте логи
pm2 logs yoddle-api --lines 20
pm2 logs yoddle-tg --lines 20

# Проверьте статус процессов
pm2 status
```

---

## 🎯 Чеклист:

- [x] БД `yoddle_db` создана
- [x] Пользователь `yoddle_user` создан с паролем
- [ ] Проверено подключение к БД
- [ ] Файл `public/backup_full1.sql` присутствует на сервере
- [ ] Бэкап импортирован в БД
- [ ] Проверено количество записей в таблицах
- [ ] Обновлен `.env` файл с параметрами БД
- [ ] Приложения перезапущены и подключаются к БД
- [ ] Логи показывают успешное подключение

---

## 🆘 Если возникли проблемы при импорте:

### Ошибка "permission denied"
- Убедитесь, что пользователь `yoddle_user` имеет права на создание таблиц
- Проверьте правильность пароля

### Ошибки при импорте
- Проверьте логи импорта: `cat import_log_*.log | grep -i error`
- Некоторые ошибки (например, "relation already exists") можно игнорировать, если таблицы уже созданы

### Файл backup_full1.sql не найден
- Убедитесь, что выполнили `git pull origin stable`
- Проверьте путь: `ls -lh public/backup_full1.sql`

