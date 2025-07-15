# Бесплатное решение: Cloudflare + Vercel

## Принцип:
- Vercel остается основным хостингом (бесплатно)
- Cloudflare становится прокси (бесплатно)
- Пользователи получают доступ через IP Cloudflare

## Настройка (5 минут):

### Шаг 1: Регистрация в Cloudflare
1. Зайдите на cloudflare.com
2. Добавьте ваш домен
3. Измените DNS серверы на Cloudflare (в панели Sphint Host)

### Шаг 2: Настройка DNS в Cloudflare
```
Тип    Имя    Значение                    Прокси
CNAME  @      your-app.vercel.app        🟠 (включен)
CNAME  www    your-app.vercel.app        🟠 (включен)
```

### Шаг 3: Настройка в Vercel
В настройках проекта Vercel добавьте домен:
- `your-domain.com`
- `www.your-domain.com`

### Шаг 4: Настройка кэширования
В Cloudflare → Page Rules (бесплатно 3 правила):
```
Правило 1: your-domain.com/api/*
- Cache Level: Bypass

Правило 2: your-domain.com/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 hour
```

## Преимущества:
✅ Полностью бесплатно
✅ Cloudflare IP обычно не блокируются
✅ Улучшается скорость загрузки
✅ Дополнительная защита от DDoS
✅ Сохраняется вся функциональность Vercel

## Если Cloudflare тоже заблокирован:
- Попробуйте разные регионы в настройках
- Включите "Under Attack Mode" временно
- Используйте Cloudflare Workers для дополнительной обработки 