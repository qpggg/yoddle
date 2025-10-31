#!/bin/bash

# Скрипт для применения SQL через Docker с вашей строкой подключения
# postgresql://f1111323_yoddle:Nei3wmOK@host.docker.internal:6543/supa_full?sslmode=disable

echo "🗃️ Применение SQL расширений для умных рекомендаций..."

# Применяем SQL файл через docker exec с psql
docker exec -i $(docker ps --format "table {{.Names}}" | grep -E "(postgres|db)" | head -1) \
  psql "postgresql://f1111323_yoddle:Nei3wmOK@host.docker.internal:6543/supa_full?sslmode=disable" \
  < sql_commands_for_recommendations.sql

echo "✅ SQL команды применены"

# Проверяем результат
echo "🔍 Проверка созданных таблиц и столбцов..."

docker exec -i $(docker ps --format "table {{.Names}}" | grep -E "(postgres|db)" | head -1) \
  psql "postgresql://f1111323_yoddle:Nei3wmOK@host.docker.internal:6543/supa_full?sslmode=disable" \
  -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ai_feedback';"

docker exec -i $(docker ps --format "table {{.Names}}" | grep -E "(postgres|db)" | head -1) \
  psql "postgresql://f1111323_yoddle:Nei3wmOK@host.docker.internal:6543/supa_full?sslmode=disable" \
  -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'benefit_recommendations' AND column_name IN ('explanations', 'confidence', 'algorithm_variant', 'score_breakdown');"

echo "🎉 Готово! Теперь можно запускать тест: node test_recommendations_pipeline.js"















