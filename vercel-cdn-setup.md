# Сохраняем Vercel + добавляем российский CDN

## Принцип работы:
- Vercel остается основным хостингом
- Российский CDN кэширует контент и отдает его пользователям
- Пользователи получают доступ через российские IP-адреса

## Настройка с Selectel CDN:

### Шаг 1: Регистрация в Selectel
1. Зайдите на selectel.ru
2. Создайте аккаунт
3. Перейдите в раздел "CDN"

### Шаг 2: Добавление источника
1. Указываете source: `your-app.vercel.app`
2. Получаете CDN домен: `your-app.selectel-cdn.ru`

### Шаг 3: Настройка DNS
В панели управления доменом (Sphint Host):
```
Тип    Имя    Значение
CNAME  @      your-app.selectel-cdn.ru
CNAME  www    your-app.selectel-cdn.ru
```

### Шаг 4: Настройка в Vercel
В `vercel.json` добавьте:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Альтернативные российские CDN:
- **VK Cloud CDN** (mycdn.me)
- **Yandex Cloud CDN** 
- **Timeweb CDN**

## Преимущества:
✅ Сохраняете всю функциональность Vercel
✅ Российские IP-адреса не блокируются
✅ Улучшается скорость загрузки в России
✅ Не нужно менять код или настройки деплоя 