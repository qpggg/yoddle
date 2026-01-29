#!/bin/bash
# Скрипт для применения SQL файлов через Docker с использованием PG_CONNECTION_STRING из .env

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка аргументов
if [ -z "$1" ]; then
    echo -e "${RED}❌ Ошибка: не указан SQL файл${NC}"
    echo ""
    echo "Использование: $0 <путь_к_sql_файлу>"
    echo ""
    echo "Примеры:"
    echo "  $0 scripts/sql/fix_productivity_functions.sql"
    echo "  $0 scripts/sql/add_onboarding_fields.sql"
    echo ""
    exit 1
fi

SQL_FILE="$1"

# Проверка существования файла
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Файл не найден: $SQL_FILE${NC}"
    exit 1
fi

# Загружаем переменные из .env файла
if [ -f .env ]; then
    # Безопасная загрузка переменных (игнорируем комментарии и пустые строки)
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    echo -e "${GREEN}✓ Загружен .env файл${NC}"
else
    echo -e "${YELLOW}⚠️  Файл .env не найден, используем переменные окружения${NC}"
fi

# Проверяем наличие PG_CONNECTION_STRING
if [ -z "$PG_CONNECTION_STRING" ]; then
    # Пробуем использовать данные из docker_migrate.sh как fallback
    if [ -n "$PGHOST" ] && [ -n "$PGUSER" ] && [ -n "$PGDATABASE" ]; then
        echo -e "${YELLOW}⚠️  PG_CONNECTION_STRING не найден, используем отдельные переменные${NC}"
        PG_CONNECTION_STRING="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE}"
    else
        echo -e "${RED}❌ Ошибка: PG_CONNECTION_STRING не найден в .env или переменных окружения${NC}"
        echo ""
        echo "Добавьте в .env файл:"
        echo "PG_CONNECTION_STRING=postgresql://user:password@host:port/database"
        echo ""
        echo "Или установите переменные:"
        echo "PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD"
        exit 1
    fi
fi

echo -e "${BLUE}🐳 Применение SQL через Docker...${NC}"
echo -e "${BLUE}📄 Файл: $SQL_FILE${NC}"
echo -e "${BLUE}📊 БД: ${PG_CONNECTION_STRING%%@*}@***${NC}"
echo ""

# Применение SQL через Docker
# Используем docker run с образом postgres:15 и передаем SQL файл через stdin
docker run --rm \
    -i \
    -v "$(pwd)/$SQL_FILE:/tmp/migration.sql:ro" \
    postgres:15 \
    psql "$PG_CONNECTION_STRING" \
    -f /tmp/migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ SQL скрипт успешно применен!${NC}"
else
    echo ""
    echo -e "${RED}❌ Ошибка при применении SQL скрипта${NC}"
    exit 1
fi
