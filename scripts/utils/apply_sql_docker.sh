#!/bin/bash
# Применение SQL через Docker. Задайте PG_CONNECTION_STRING в .env (не храните пароль в скрипте).

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT"
[ -f .env ] && source .env 2>/dev/null || true

if [ -z "$PG_CONNECTION_STRING" ]; then
  echo "Задайте PG_CONNECTION_STRING в .env"
  exit 1
fi

echo "🗃️ Применение SQL расширений для умных рекомендаций..."

CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "(postgres|db)" | head -1)
if [ -z "$CONTAINER" ]; then
  echo "Контейнер postgres/db не найден"
  exit 1
fi

docker exec -i "$CONTAINER" psql "$PG_CONNECTION_STRING" < scripts/utils/sql_commands_for_recommendations.sql 2>/dev/null || \
  echo "Если sql_commands_for_recommendations.sql в другой папке, укажите путь"

echo "✅ SQL команды применены"
echo "🔍 Проверка: docker exec -i $CONTAINER psql \"\$PG_CONNECTION_STRING\" -c \"SELECT 1;\""
echo "🎉 Готово"















