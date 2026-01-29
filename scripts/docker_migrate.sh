#!/bin/bash
# Скрипт для применения SQL миграций через Docker

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Параметры подключения (можно переопределить через переменные окружения)
PGHOST="${PGHOST:-185.185.69.254}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-yoddle_db}"
PGUSER="${PGUSER:-yoddle_user}"
PGPASSWORD="${PGPASSWORD:-1WIzL7aP_F}"

# Проверка аргументов
if [ -z "$1" ]; then
    echo "Использование: $0 <путь_к_sql_файлу>"
    echo ""
    echo "Примеры:"
    echo "  $0 scripts/sql/add_onboarding_fields.sql"
    echo "  $0 scripts/sql/init.sql"
    echo ""
    exit 1
fi

SQL_FILE="$1"

# Проверка существования файла
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Файл не найден: $SQL_FILE"
    exit 1
fi

echo -e "${BLUE}🐳 Применение миграции через Docker...${NC}"
echo -e "${BLUE}📄 Файл: $SQL_FILE${NC}"
echo -e "${BLUE}📊 БД: $PGDATABASE на $PGHOST:$PGPORT${NC}"
echo ""

# Применение миграции через Docker
docker run --rm \
    -v "$(pwd)/scripts/sql:/migrations" \
    -e PGPASSWORD="$PGPASSWORD" \
    postgres:15 \
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
    -f "/migrations/$(basename "$SQL_FILE")"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Миграция успешно применена!${NC}"
else
    echo ""
    echo "❌ Ошибка при применении миграции"
    exit 1
fi
