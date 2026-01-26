# 🐳 Локальная разработка через Docker

## 📋 Обзор

Этот способ позволяет запустить весь проект (фронтенд + бэкенд) в Docker контейнерах с подключением к удаленной БД на сервере.

## ⚙️ Требования

- Docker и Docker Compose установлены
- Файл `.env` с актуальными данными с сервера (PG_CONNECTION_STRING, API ключи и т.д.)

## 🚀 Быстрый старт

### 1. Убедитесь что `.env` файл настроен

Файл `.env` должен содержать:
```env
# Подключение к удаленной БД
PG_CONNECTION_STRING=postgresql://username:password@host:port/database

# API ключи
CLAUDE_API_KEY=your_key
RESEND_API_KEY=your_key
JWT_SECRET=your_secret

# Остальные переменные...
```

### 2. Запустите проект

```bash
# Запуск всех сервисов (фронтенд + бэкенд)
docker-compose up

# Или в фоновом режиме
docker-compose up -d
```

### 3. Проверьте работу

- **Фронтенд:** http://localhost:5173
- **Бэкенд:** http://localhost:3001

## 📝 Полезные команды

### Запуск и остановка

```bash
# Запуск всех сервисов
docker-compose up

# Запуск в фоновом режиме
docker-compose up -d

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

### Логи

```bash
# Логи всех сервисов
docker-compose logs

# Логи бэкенда
docker-compose logs backend

# Логи фронтенда
docker-compose logs frontend

# Логи в реальном времени
docker-compose logs -f

# Последние 100 строк логов бэкенда
docker-compose logs --tail=100 backend
```

### Перезапуск

```bash
# Перезапуск всех сервисов
docker-compose restart

# Перезапуск только бэкенда
docker-compose restart backend

# Перезапуск только фронтенда
docker-compose restart frontend
```

### Выполнение команд в контейнере

```bash
# Зайти в контейнер бэкенда
docker-compose exec backend sh

# Выполнить команду в контейнере бэкенда
docker-compose exec backend npm run check-db-connection

# Зайти в контейнер фронтенда
docker-compose exec frontend sh
```

### Пересборка контейнеров

```bash
# Пересобрать контейнеры после изменений в Dockerfile
docker-compose build

# Пересобрать и перезапустить
docker-compose up --build

# Пересобрать без кэша
docker-compose build --no-cache
```

## 🔧 Настройка

### Изменение портов

Если порты 3001 или 5173 заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "3002:3001"  # Внешний:Внутренний
```

### Добавление переменных окружения

Добавьте в секцию `environment` нужного сервиса:

```yaml
backend:
  environment:
    - CUSTOM_VAR=value
```

Или используйте `.env` файл (рекомендуется).

## 🐛 Решение проблем

### Проблема: Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs backend

# Проверьте статус контейнеров
docker-compose ps

# Пересоберите контейнеры
docker-compose build --no-cache
docker-compose up
```

### Проблема: БД недоступна из контейнера

Убедитесь что:
1. `.env` файл содержит правильный `PG_CONNECTION_STRING`
2. БД доступна с вашего IP (для удаленной БД)
3. Для Supabase добавлен `?sslmode=require`

### Проблема: Изменения в коде не применяются

Volumes настроены автоматически, изменения должны применяться сразу. Если нет:

```bash
# Перезапустите контейнер
docker-compose restart backend
```

### Проблема: Порты заняты

```bash
# Найдите процесс на порту
lsof -i :3001
lsof -i :5173

# Или
netstat -tulpn | grep 3001
netstat -tulpn | grep 5173
```

Измените порты в `docker-compose.yml` или остановите процесс.

## 📊 Мониторинг

```bash
# Статус всех контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# Информация о сети
docker network inspect yoddle_yoddle-network
```

## 🔄 Обновление зависимостей

```bash
# Остановите контейнеры
docker-compose down

# Удалите volumes с node_modules
docker-compose down -v

# Пересоберите и запустите
docker-compose up --build
```

## 💡 Преимущества Docker разработки

1. **Изолированная среда** - не влияет на систему
2. **Единообразие** - одинаково работает у всех разработчиков
3. **Простота** - одна команда для запуска всего
4. **Чистота** - легко удалить и пересоздать
5. **Реальные данные** - подключение к удаленной БД

## 📚 Дополнительно

- [Официальная документация Docker Compose](https://docs.docker.com/compose/)
- [Настройка локальной разработки без Docker](НАСТРОЙКА_ЛОКАЛЬНОЙ_РАЗРАБОТКИ.md)
