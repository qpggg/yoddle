#!/bin/bash
# Скрипт для применения SQL миграций через Docker (запуск из корня проекта)

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# Параметры подключения из .env (задайте в .env: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)
[ -f .env ] && source .env 2>/dev/null || true
if [ -z "$PGHOST" ] || [ -z "$PGPASSWORD" ]; then
  echo "Задайте PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD в .env"
  exit 1
fi
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-yoddle_db}"
PGUSER="${PGUSER:-yoddle_user}"

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
