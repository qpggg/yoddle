# 🚀 ПРОСТОЙ ВАРИАНТ: Создать новую БД и загрузить бэкап

## ✅ Преимущества этого подхода:

- ✅ Не нужно искать параметры подключения к существующей БД
- ✅ Чистая БД с данными из Docker
- ✅ Полный контроль над процессом
- ✅ Можно использовать `localhost` если БД на том же сервере

---

## 📋 ШАГ 1: Создайте новую БД через GUI провайдера

### 1.1 Войдите в панель управления провайдера

### 1.2 Найдите раздел "Базы данных" / "Databases"

### 1.3 Создайте новую БД PostgreSQL

**Параметры для создания:**
- **Имя БД**: `yoddle_db` (или любое другое имя)
- **Тип**: PostgreSQL (версия 14 или выше)
- **Пароль**: придумайте надежный пароль (запомните его!)

**После создания** GUI покажет параметры подключения:
- Host (хост)
- Port (порт, обычно 5432)
- Database name (имя БД)
- Username (имя пользователя)
- Password (пароль)

### 1.4 Сохраните параметры подключения

Вам понадобятся:
- **DB_HOST** - хост (может быть `localhost` или внешний адрес)
- **DB_PORT** - порт (обычно `5432`)
- **DB_NAME** - имя БД (которое вы указали)
- **DB_USER** - имя пользователя
- **DB_PASSWORD** - пароль

---

## 📤 ШАГ 2: Получите файл бэкапа на сервере

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Перейдите в папку проекта
cd /root/yoddle  # или /root/yoddle1

# Обновите код из репозитория (файл backup_full1.sql будет в public/)
git checkout stable
git pull origin stable

# Проверьте наличие файла
ls -lh public/backup_full1.sql
```

---

## 📥 ШАГ 3: Импортируйте бэкап в новую БД

### Вариант A: Если БД на том же сервере (localhost)

```bash
# Установите PostgreSQL клиент (если еще не установлен)
apt update
apt install -y postgresql-client-15

# Импортируйте бэкап
# Замените YOUR_DB_NAME, YOUR_DB_USER, YOUR_DB_PASSWORD на реальные значения
PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U YOUR_DB_USER -d YOUR_DB_NAME -f public/backup_full1.sql

# С выводом ошибок в файл (рекомендуется):
PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U YOUR_DB_USER -d YOUR_DB_NAME -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

**Пример:**
```bash
# Если БД: yoddle_db, пользователь: yoddle_user, пароль: mypassword123
PGPASSWORD=mypassword123 psql -h localhost -U yoddle_user -d yoddle_db -f public/backup_full1.sql
```

### Вариант B: Если БД на удаленном сервере (внешний хост)

```bash
# Установите PostgreSQL клиент (если еще не установлен)
apt update
apt install -y postgresql-client-15

# Импорт БЕЗ SSL (попробуйте сначала):
PGPASSWORD=YOUR_DB_PASSWORD psql -h YOUR_DB_HOST -p 5432 -U YOUR_DB_USER -d YOUR_DB_NAME -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log

# Импорт С SSL (если без SSL не работает):
PGPASSWORD=YOUR_DB_PASSWORD psql "postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:5432/YOUR_DB_NAME?sslmode=require" -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

**Пример:**
```bash
# Если хост: db.example.com, БД: yoddle_db, пользователь: yoddle_user, пароль: mypassword123
PGPASSWORD=mypassword123 psql -h db.example.com -p 5432 -U yoddle_user -d yoddle_db -f public/backup_full1.sql
```

---

## ✅ ШАГ 4: Проверьте импорт

```bash
# Проверьте количество таблиц
PGPASSWORD=YOUR_DB_PASSWORD psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -c "\dt"

# Проверьте количество записей в основных таблицах
PGPASSWORD=YOUR_DB_PASSWORD psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -c "SELECT COUNT(*) FROM enter;"
PGPASSWORD=YOUR_DB_PASSWORD psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -c "SELECT COUNT(*) FROM benefits;"
PGPASSWORD=YOUR_DB_PASSWORD psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -c "SELECT COUNT(*) FROM telegram_leads;"
```

---

## 🔧 ШАГ 5: Обновите .env файл на сервере

```bash
# На сервере
cd /root/yoddle
nano .env
```

Добавьте параметры новой БД:

```env
# Параметры новой БД
DB_HOST=YOUR_DB_HOST  # localhost или внешний адрес из GUI
DB_PORT=5432
DB_NAME=YOUR_DB_NAME  # Имя БД, которое вы создали
DB_USER=YOUR_DB_USER  # Имя пользователя из GUI
DB_PASSWORD=YOUR_DB_PASSWORD  # Пароль, который вы указали

# Для db.js (альтернативный вариант)
PG_CONNECTION_STRING=postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:5432/YOUR_DB_NAME

# ИЛИ отдельные переменные для db.js
PGHOST=YOUR_DB_HOST
PGPORT=5432
PGDATABASE=YOUR_DB_NAME
PGUSER=YOUR_DB_USER
PGPASSWORD=YOUR_DB_PASSWORD
```

**Если БД на удаленном сервере и требуется SSL:**
```env
PG_CONNECTION_STRING=postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:5432/YOUR_DB_NAME?sslmode=require
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
```

---

## 🎯 Чеклист:

- [ ] Создана новая БД через GUI провайдера
- [ ] Сохранены параметры подключения (Host, Port, Database, User, Password)
- [ ] Файл `public/backup_full1.sql` присутствует на сервере
- [ ] Установлен PostgreSQL клиент (`postgresql-client-15`)
- [ ] Бэкап импортирован в новую БД без критических ошибок
- [ ] Проверено количество записей в таблицах
- [ ] Обновлен `.env` файл с параметрами новой БД
- [ ] Приложения перезапущены и подключаются к новой БД
- [ ] Логи показывают успешное подключение

---

## 🆘 Если возникли проблемы:

### Ошибка "Connection refused"
- Проверьте правильность хоста (может быть не `localhost`)
- Попробуйте подключение с SSL

### Ошибка "permission denied"
- Убедитесь, что пользователь БД имеет права на создание таблиц
- Проверьте правильность пароля

### Ошибки при импорте
- Проверьте логи импорта: `cat import_log_*.log | grep -i error`
- Некоторые ошибки (например, "relation already exists") можно игнорировать, если таблицы уже созданы

---

## 💡 Преимущества этого подхода:

1. **Простота** - не нужно искать параметры существующей БД
2. **Чистота** - новая БД без старых данных
3. **Контроль** - вы знаете все параметры подключения
4. **Гибкость** - можете выбрать имя БД и пароль сами




