# Прогресс и достижения пользователя 4 (из БД через Docker)

Данные получены запросами к БД через Docker (`psql`).

---

## 1. user_progress (user_id = 4)

| Поле | Значение |
|------|----------|
| **id** | 15879 |
| **user_id** | 4 |
| **xp** | **360** |
| **level** | **4** (Эксперт по шкале 1–5) |
| **login_streak** | 2 |
| **days_active** | 14 |
| **benefits_used** | 0 |
| **profile_completion** | 100 |
| **last_activity** | 2026-01-29 21:23:29 |
| **productivity_score** | 7.67 |
| **weekly_productivity** | 0.00 |
| **monthly_productivity** | 0.00 |
| **onboarding_completed** | false |
| **tour_completed** | true |
| **productivity_level** | Новичок |
| **productivity_tier** | bronze |

---

## 2. user_achievements (разблокированные достижения)

**0 строк** — у пользователя 4 нет ни одного разблокированного достижения в `user_achievements`.

Поэтому на странице «Прогресс» все достижения отображаются как заблокированные.

---

## 3. Достижения (таблица achievements) и статус для user 4

В БД 15 активных достижений. Для user 4 везде **unlocked = false** (нет записей в `user_achievements`).

| code | name | requirement_type | requirement_value | requirement_action | xp_reward | tier | unlocked |
|------|------|------------------|-------------------|--------------------|-----------|------|----------|
| first_login | Добро пожаловать! | count | 1 | login | 25 | 1 | **f** |
| xp_100 | Новичок | total_xp | 100 | — | 25 | 1 | **f** |
| early_bird | Ранняя пташка | custom | 1 | early_login | 30 | 1 | **f** |
| night_owl | Сова | custom | 1 | late_login | 30 | 1 | **f** |
| login_streak_3 | Постоянство | streak | 3 | login | 50 | 1 | **f** |
| first_benefit | Первые шаги | count | 1 | benefit_added | 50 | 1 | **f** |
| profile_complete | Готов к работе! | custom | 100 | profile_completion | 75 | 1 | **f** |
| weekend_warrior | Воин выходных | custom | 1 | weekend_activity | 40 | 2 | **f** |
| xp_500 | Активист | total_xp | 500 | — | 75 | 2 | **f** |
| login_streak_7 | Привычка | streak | 7 | login | 100 | 2 | **f** |
| benefit_collector | Коллекционер | count | 5 | benefit_added | 150 | 2 | **f** |
| xp_1000 | Эксперт | total_xp | 1000 | — | 150 | 3 | **f** |
| xp_2500 | Чемпион | total_xp | 2500 | — | 300 | 3 | **f** |
| login_streak_30 | Преданность | streak | 30 | login | 300 | 3 | **f** |
| benefit_master | Мастер льгот | count | 10 | benefit_added | 300 | 3 | **f** |

---

## 4. activity_log — сводка по действиям (user 4)

| action | cnt | total_xp |
|--------|-----|----------|
| activity_logged | 8 | 160 |
| mood_logged | 9 | 90 |
| streak_milestone | 1 | 50 |
| first_login_today | 4 | 30 |
| login | 15 | 20 |
| page_view | 7 | 0 |

**Сумма XP по activity_log:** 350.

В `user_progress.xp` хранится 360 — разница 10 XP (возможны начисления из другого источника или обновление прогресса при логине/геймификации).

---

## 5. Последние 30 записей activity_log (user 4)

Действия: `login`, `first_login_today`, `streak_milestone`, `mood_logged`, `activity_logged`, `page_view`. Даты — с 19.01.2026 по 29.01.2026.

---

## Почему у user 4 все достижения заблокированы

1. **В `user_achievements` для user_id = 4 нет ни одной записи** — разблокировка достижений делается вставкой в эту таблицу (при вызове `POST /api/progress` с подходящим `action` или при первом `GET /api/progress` для нового пользователя без прогресса).

2. **У user 4 уже был создан `user_progress`** (скорее всего при первом логине через геймификацию в `server.js`). При первом открытии страницы «Прогресс» в таком случае блок «если прогресса нет — создаём и даём first_login» не выполняется, и достижение «Первые шаги» (first_login) не проставляется.

3. **Разблокировка достижений в коде происходит только при `POST /api/progress`** (в `server.js`): проверяются только действия `profile_complete`, `first_benefit` и условие `xp >= 300` для `streak_week`. Фронт при обновлении профиля и добавлении льготы вызывает `POST /api/activity` (логирование в `activity_log`), а не `POST /api/progress` с этими `action`, поэтому достижения не выставляются.

4. **Итог:** XP и уровень (360 XP, уровень 4) считаются и хранятся в `user_progress`, но ни одно достижение не разблокировалось, потому что для user 4 не создавались записи в `user_achievements` и не вызывается логика разблокировки при нужных действиях.

---

## Скрипт для повторного сбора данных

Запросы к БД выполняются через Docker (из корня проекта, с подгруженным `.env`):

```bash
# Одна проверка
(. ./.env 2>/dev/null; docker run --rm -e PGHOST -e PGPORT -e PGUSER -e PGPASSWORD -e PGDATABASE postgres:15 psql -h "$PGHOST" -p "${PGPORT:-5432}" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT * FROM user_progress WHERE user_id = 4;")

# Полный скрипт (все секции)
(. ./.env 2>/dev/null; docker run --rm -e PGHOST -e PGPORT -e PGUSER -e PGPASSWORD -e PGDATABASE postgres:15 psql -h "$PGHOST" -p "${PGPORT:-5432}" -U "$PGUSER" -d "$PGDATABASE" -f -) < scripts/sql/user4_progress_achievements.sql
```

Файл запросов: `scripts/sql/user4_progress_achievements.sql`.
