# Тесты базовых действий за XP (пилот)

Достижения заморожены; начисляются только базовые XP за действия. По всем начислениям из интерфейса должны быть тесты.

---

## 1. Полный список начислений (по UI)

### Активность
| Действие | Ожидаемые XP | Ограничение | Как начисляется | Тест |
|----------|--------------|-------------|-----------------|------|
| Ежедневный вход | +10 | — | POST /api/gamification/login → action `login` | curl POST gamification/login |
| Первый вход за день | +15 | раз в день | Тот же запрос → action `first_login_today` | curl POST gamification/login (первый раз за день) |
| Просмотр прогресса | +5 | **раз в день** | POST /api/activity → action `progress_view` или `page_view`; повтор в тот же день → 0 XP | curl 2 раза: 1-й +5, 2-й 0 |

### Профиль
| Действие | Ожидаемые XP | Ограничение | Как начисляется | Тест |
|----------|--------------|-------------|-----------------|------|
| Обновление профиля | +25 | — | POST /api/activity → action `profile_update` | curl POST /api/activity profile_update 25 |
| Загрузка аватара | +30 | **раз в неделю** (обновлять можно сколько угодно, XP только раз в 7 дней) | POST /api/activity → action `avatar_upload`; повтор за неделю → 0 XP | curl 2 раза: 1-й +30, 2-й 0 |
| Тест предпочтений | +75 | — | POST /api/user-recommendations (сейчас **не** начисляет XP в server.js) | сохранить рекомендации → проверить activity_log |

### Льготы
| Действие | Ожидаемые XP | Как начисляется | Тест |
|----------|--------------|-----------------|------|
| Добавление льготы | +50 | POST /api/activity → action `benefit_added` | curl POST /api/activity benefit_added 50 |
| Использование льготы | +25 | POST /api/activity → action `benefit_used` | curl POST /api/activity benefit_used 25 |
| Получение рекомендаций | +20 | Система (AI/рекомендации) → action `recommendations_received` | проверить эндпоинт выдачи рекомендаций |

### Достижения (заморожены)
| Действие | Ожидаемые XP | Как начисляется | Тест |
|----------|--------------|-----------------|------|
| Повышение уровня | +100 | При переходе на новый уровень (api/progress.js при POST; в server.js POST /api/progress такого бонуса нет) | при достижении порога уровня |
| Серия входов (неделя) | +50 | POST /api/gamification/login → action `streak_milestone` (каждые 7 дней) | curl gamification при streak % 7 === 0 |
| Разблокировка достижения | Бонус | **Отключено** — не начисляем | user_achievements пусто |

---

## 2. Где начисляется XP на бэкенде

| Эндпоинт | Действия | Обновляет user_progress.xp? |
|----------|----------|-----------------------------|
| **POST /api/gamification/login** | login 10, first_login_today 15, streak_milestone 50 | ✅ Да |
| **POST /api/activity** | profile_update 25, benefit_added 50, benefit_used 25, progress_view 5, avatar_upload 30 и др. | ✅ Да |
| **POST /api/progress** | xp_to_add из тела; разблокировка достижений отключена | ✅ Да |
| **POST /api/user-recommendations** (server.js) | Сейчас **не** пишет в activity_log и не обновляет user_progress | ❌ Нет (в api/user-recommendations.js есть логика, но роут в server.js свой) |

---

## 3. Чек-лист тестов по каждому начислению

- [ ] **Ежедневный вход (+10)** — POST /api/gamification/login → activity_log: login, 10; user_progress.xp +10.
- [ ] **Первый вход за день (+15)** — Первый вызов gamification/login за день → activity_log: first_login_today, 15; user_progress.xp +15.
- [ ] **Просмотр прогресса (+5)** — POST /api/activity action=progress_view (или page_view), xp_earned=5 → activity_log и user_progress.xp +5.
- [ ] **Обновление профиля (+25)** — POST /api/activity action=profile_update, xp_earned=25 → activity_log и user_progress.xp +25.
- [ ] **Загрузка аватара (+30)** — POST /api/activity action=avatar_upload, xp_earned=30 → activity_log и user_progress.xp +30.
- [ ] **Тест предпочтений (+75)** — Сохранение рекомендаций: сейчас в server.js POST /api/user-recommendations XP не начисляется; при добавлении логики — activity_log preferences_test 75 и user_progress.xp +75.
- [ ] **Добавление льготы (+50)** — POST /api/activity action=benefit_added, xp_earned=50 → activity_log и user_progress.xp +50.
- [ ] **Использование льготы (+25)** — POST /api/activity action=benefit_used, xp_earned=25 → activity_log и user_progress.xp +25.
- [ ] **Получение рекомендаций (+20)** — Где вызывается recommendations_received: проверить начисление 20 XP в activity_log и user_progress.
- [ ] **Повышение уровня (+100)** — При переходе уровня (если реализовано в используемом роуте): activity_log level_up 100 и user_progress.xp +100.
- [ ] **Серия входов неделя (+50)** — gamification/login при login_streak % 7 === 0 → activity_log streak_milestone 50 и user_progress.xp +50.
- [ ] **Разблокировка достижения** — Не начисляется, user_achievements не создаются.

---

## 4. Команды для тестов через терминал (curl)

Базовый URL: `http://localhost:3001` (или ваш PORT). User_id: например `4`.

```bash
# 1. Ежедневный вход (+10) и при первом за день (+15), при streak 7 дней (+50)
curl -s -X POST http://localhost:3001/api/gamification/login -H "Content-Type: application/json" -d '{"user_id": 4}'

# 2. Просмотр прогресса +5
curl -s -X POST http://localhost:3001/api/activity -H "Content-Type: application/json" -d '{"user_id":4,"action":"progress_view","xp_earned":5,"description":"Просмотр прогресса"}'

# 3. Обновление профиля +25
curl -s -X POST http://localhost:3001/api/activity -H "Content-Type: application/json" -d '{"user_id":4,"action":"profile_update","xp_earned":25,"description":"Обновление профиля"}'

# 4. Загрузка аватара +30
curl -s -X POST http://localhost:3001/api/activity -H "Content-Type: application/json" -d '{"user_id":4,"action":"avatar_upload","xp_earned":30,"description":"Загрузка аватара"}'

# 5. Добавление льготы +50
curl -s -X POST http://localhost:3001/api/activity -H "Content-Type: application/json" -d '{"user_id":4,"action":"benefit_added","xp_earned":50,"description":"Добавление льготы"}'

# 6. Использование льготы +25
curl -s -X POST http://localhost:3001/api/activity -H "Content-Type: application/json" -d '{"user_id":4,"action":"benefit_used","xp_earned":25,"description":"Использование льготы"}'
```

---

## 5. Проверка в БД после тестов

```sql
-- Текущий XP и уровень
SELECT xp, level, login_streak FROM user_progress WHERE user_id = 4;

-- Последние записи activity_log (сверка action и xp_earned)
SELECT action, xp_earned, description, created_at
FROM activity_log
WHERE user_id = 4
ORDER BY created_at DESC
LIMIT 25;

-- Сумма XP по действиям за период
SELECT action, COUNT(*) AS cnt, SUM(xp_earned) AS total_xp
FROM activity_log
WHERE user_id = 4 AND created_at >= CURRENT_DATE
GROUP BY action
ORDER BY total_xp DESC;

-- Достижения не создаются
SELECT COUNT(*) FROM user_achievements WHERE user_id = 4;
```

---

## 6. Ожидаемые суммы по категориям (для сверки)

| Категория | Действие | XP |
|-----------|----------|-----|
| Активность | Ежедневный вход | 10 |
| Активность | Первый вход за день | 15 |
| Активность | Просмотр прогресса | 5 |
| Профиль | Обновление профиля | 25 |
| Профиль | Загрузка аватара | 30 |
| Профиль | Тест предпочтений | 75 |
| Льготы | Добавление льготы | 50 |
| Льготы | Использование льготы | 25 |
| Льготы | Получение рекомендаций | 20 |
| Достижения | Повышение уровня | 100 |
| Достижения | Серия входов (неделя) | 50 |
| Достижения | Разблокировка достижения | не начисляется |

После прохода всех пунктов чек-листа начисления по всем действиям из UI покрыты тестами.
