# 🚀 ИМПОРТ БД НА СЕРВЕР И ПРОВЕРКА

## 📤 Шаг 1: Получение файла на сервере

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Перейдите в папку проекта
cd /root/yoddle

# Обновите код из репозитория (файл backup_full1.sql будет в public/)
git checkout stable
git pull origin stable

# Проверьте наличие файла
ls -lh public/backup_full1.sql

# ИЛИ если файл уже загружен вручную, можно использовать его напрямую
```

---

## 📥 Шаг 2: Импорт БД на сервере

### Вариант A: Если БД уже создана

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Перейдите в папку проекта
cd /root/yoddle

# Убедитесь, что файл есть (после git pull)
ls -lh public/backup_full1.sql

# Импортируйте БД из папки public
sudo -u postgres psql yoddle_db < public/backup_full1.sql

# ИЛИ через пользователя yoddle_user:
psql -U yoddle_user -d yoddle_db -h localhost -f public/backup_full1.sql
```

### Вариант B: Если БД еще не создана

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Перейдите в папку проекта
cd /root/yoddle

# Убедитесь, что файл есть (после git pull)
ls -lh public/backup_full1.sql

# Создайте БД и пользователя (если еще не созданы)
sudo -u postgres psql << EOF
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\q
EOF

# Импортируйте БД из папки public
sudo -u postgres psql yoddle_db < public/backup_full1.sql

# Дайте права пользователю yoddle_user
sudo -u postgres psql yoddle_db << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
EOF
```

---

## ✅ Шаг 3: Проверка работоспособности после импорта

### Быстрая проверка

```bash
# На сервере
cd /root/yoddle
git pull origin stable  # Получить скрипт проверки

# Быстрая проверка количества записей
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM enter;"
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM benefits;"
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM telegram_leads;"
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM user_progress;"
```

### Полная проверка через скрипт

```bash
# Запустите скрипт проверки
psql -U yoddle_user -d yoddle_db -h localhost -f check_database_health.sql

# ИЛИ быстрый скрипт
psql -U yoddle_user -d yoddle_db -h localhost -f check_db_quick.sql
```

### Проверка подключения приложения

```bash
# Проверьте, что приложение подключается к БД
pm2 logs yoddle-api --lines 20

# Проверьте логи бота
pm2 logs yoddle-tg --lines 20

# Проверьте статус процессов
pm2 status
```

---

## 🔄 Шаг 4: Обновление .env файла (если нужно)

```bash
# Убедитесь, что .env файл настроен правильно
cd /root/yoddle
nano .env

# Проверьте параметры БД:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=yoddle_db
# DB_USER=yoddle_user
# DB_PASSWORD=ваш_пароль

# Сохраните файл (Ctrl+O, Enter, Ctrl+X)

# Перезапустите приложения
pm2 restart yoddle-api
pm2 restart yoddle-tg
```

---

## 📊 Сравнение данных (до и после)

### Проверка, что данные совпадают:

```bash
# На вашем компьютере (Docker):
$env:PGPASSWORD="Nei3wmOK"; psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full -c "SELECT COUNT(*) FROM enter;" > local_count.txt

# На сервере (после импорта):
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM enter;" > server_count.txt

# Сравните файлы (должны совпадать)
```

---

## 🎯 Чеклист после импорта:

- [ ] Код обновлен через `git pull origin stable` на сервере
- [ ] Файл `public/backup_full1.sql` присутствует в проекте
- [ ] БД `yoddle_db` создана на сервере
- [ ] Пользователь `yoddle_user` создан с правами
- [ ] БД импортирована из `public/backup_full1.sql` без ошибок
- [ ] Проверка количества записей выполнена
- [ ] Приложение `yoddle-api` подключается к БД
- [ ] Telegram бот `yoddle-tg` подключается к БД
- [ ] Логи показывают успешное подключение

---

## 🆘 Если возникли ошибки при импорте:

```bash
# Перейдите в папку проекта
cd /root/yoddle

# Проверьте ошибки импорта
sudo -u postgres psql yoddle_db < public/backup_full1.sql 2>&1 | tee import_errors.log

# Проверьте, какие таблицы создались
psql -U yoddle_user -d yoddle_db -h localhost -c "\dt"

# Если импорт упал на середине, удалите БД и создайте заново:
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS yoddle_db;
CREATE DATABASE yoddle_db;
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\q
EOF

# Попробуйте импорт снова
sudo -u postgres psql yoddle_db < public/backup_full1.sql
```

