# План внедрения полного бэкенда рекомендаций (hybrid_v1)

## Цели
- Гибридные рекомендации льгот (тест + ИИ + свободные предпочтения + поведенческие сигналы)
- Объяснимость (explanations), уверенность (confidence), разложение скоринга (score_breakdown)
- Сбор фидбека по карточкам для последующего обучения

## Эндпоинты (API)
1. POST `/api/ai/preferences` — сохранить свободные предпочтения (уже добавлен)
2. POST `/api/ai/recommendations/generate?variant=hybrid_v1` — сгенерировать гибридные рекомендации (уже добавлен)
3. GET `/api/ai/recommendations?user_id=...` — отдать рекомендации с объяснениями (реализован в `api/user-recommendations.js` либо интегрировать в `/api/ai`) 
4. POST `/api/ai/recommendations/feedback` — собирать фидбек (уже добавлен)

## Источники данных
- `ai_signals`: события `mood`, `activity`, `preferences_free`
- `benefits`: справочник льгот (id, name, category)
- `benefit_recommendations`: хранилище результата расчёта

## Расширение БД (SQL — применять вручную)
```sql
-- Фидбек по карточкам
CREATE TABLE IF NOT EXISTS ai_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  benefit_id BIGINT,
  label TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ai_feedback_user_idx ON ai_feedback(user_id);

-- Объяснимость и метрики в рекомендациях
ALTER TABLE benefit_recommendations
  ADD COLUMN IF NOT EXISTS explanations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS algorithm_variant TEXT DEFAULT 'static',
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}'::jsonb;
```

## Логика гибридного скоринга (hybrid_v1)
1. `test_score` — веса из последних тестовых рекомендаций (1.0/0.66/0.33)
2. `ai_score` — ответ Claude по строгому JSON с кандидатами и причинами
   - Буст за совпадение с `tags`, формат/бюджет/время; штраф за `avoid`
3. Итоговый `score = 0.6 * test_score + 0.4 * ai_score` (если нет теста — берём `ai_score`)
4. Фильтр `avoid`; сортировка и Top‑3
5. Сохранение в `benefit_recommendations` с `explanations`, `confidence`, `algorithm_variant='hybrid_v1'`, `score_breakdown`

## Claude (Anthropic)
- Модель: `claude-3-5-sonnet-20241022`
- Формат ответа — STRICT JSON:
```json
{
  "variant": "hybrid_v1",
  "candidates": [
    {
      "category": "Психология",
      "benefit_name": "Психологическая поддержка",
      "reason_short": ["стресс ↑", "онлайн"],
      "ai_score": 0.90,
      "confidence": 0.74
    }
  ]
}
```

## Фронтенд
- Страница рекомендаций:
  - Начальный экран: CTA пройти тест + совет чаще заполнять свободную форму и логировать активности
  - Результаты: карточки с `explanations[]` (чипы), `confidence` (полоса), примеры льгот, кнопки фидбека

## Наблюдаемость и защита
- Рейтлимит генерации: не чаще 1 раза в 12 часов
- Логирование промпта/ответа с версией алгоритма
- Валидация JSON от Claude, фолбэк при сбое (локальные причины из теста/предпочтений)

## Этапы внедрения
1) Принять SQL расширений (вручную)
2) Подключить POST `/api/ai/recommendations/generate` из фронта после теста
3) Использовать GET `/api/ai/recommendations` для показа результатов
4) Прислать фидбек по карточкам в `/api/ai/recommendations/feedback`
5) Включить рейтлимит и кэширование результатов на 12–24 ч


