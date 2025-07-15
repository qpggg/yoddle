# GitHub Pages + российский CDN - самый простой способ

## Схема:
- **Frontend** → GitHub Pages (бесплатно)
- **Backend/API** → Yandex Cloud Functions (бесплатно до 4000₽)
- **CDN** → Selectel CDN (российский)

## Настройка за 15 минут:

### Шаг 1: GitHub Pages для фронтенда
1. В настройках GitHub репозитория включите Pages
2. Выберите ветку `main` и папку `/docs`
3. Соберите приложение в папку docs:

```bash
# Изменение vite.config.ts
export default defineConfig({
  // ...
  base: '/yoddle1/',
  build: {
    outDir: 'docs'
  }
})
```

### Шаг 2: Yandex Cloud Functions для API
Создайте файл `yandex-functions.js`:
```javascript
// Адаптер для Yandex Cloud Functions
const { login } = require('./api/login.js');
const { activity } = require('./api/activity.js');
const { benefits } = require('./api/benefits.js');

module.exports.handler = async (event, context) => {
  const { httpMethod, path, body } = event;
  
  try {
    // Роутинг API
    if (path === '/api/login' && httpMethod === 'POST') {
      return await login(JSON.parse(body));
    }
    
    if (path === '/api/activity' && httpMethod === 'GET') {
      return await activity(event.queryStringParameters);
    }
    
    if (path === '/api/benefits' && httpMethod === 'GET') {
      return await benefits();
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Шаг 3: Настройка домена
В DNS (Sphint Host):
```
Тип    Имя    Значение
CNAME  @      your-username.github.io
CNAME  www    your-username.github.io
```

### Шаг 4: Российский CDN (опционально)
Если GitHub Pages тоже заблокируют, добавьте Selectel CDN:
```
CNAME  @      your-site.selectel-cdn.ru
```

## Преимущества:
✅ Полностью бесплатно
✅ Автодеплой при каждом коммите
✅ Можно добавить российский CDN
✅ GitHub пока не блокируется
✅ Простая настройка

## Недостатки:
⚠️ GitHub может попасть под санкции
⚠️ Нужно разделить фронтенд и бэкенд

## Стоимость:
- GitHub Pages: 0₽
- Yandex Cloud Functions: 0₽ (до 4000₽ лимита)
- Selectel CDN: от 100₽/месяц 