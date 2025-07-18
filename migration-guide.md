# Миграция с Vercel - решение проблемы блокировки российскими операторами

## Проблема
Российские мобильные операторы (МТС, Билайн, Мегафон) блокируют IP-адреса Vercel, что делает сайт недоступным для большинства пользователей в России.

## Решения

### 1. Российские хостинги (рекомендуется)
- **Timeweb** - поддерживает Node.js, React, автодеплой
- **Selectel** - российский хостинг с поддержкой современных технологий
- **Reg.ru** - хостинг и домены
- **Beget** - поддерживает Node.js проекты

### 2. Альтернативные международные хостинги
- **Netlify** - аналог Vercel
- **Railway** - простой деплой Node.js
- **Render** - бесплатный план есть
- **Heroku** - классический вариант

### 3. Собственный VPS
- **Timeweb VPS** - российский
- **Selectel VPS** - российский
- **DigitalOcean** - международный
- **Hetzner** - европейский

## Инструкции по миграции

### Для Timeweb:
1. Зарегистрируйтесь на timeweb.com
2. Создайте Node.js проект
3. Подключите Git репозиторий
4. Настройте автодеплой

### Для Netlify:
1. Подключите GitHub к Netlify
2. Выберите репозиторий
3. Настройте билд команды:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Для собственного VPS:
1. Установите Node.js, nginx, certbot
2. Настройте PM2 для автозапуска
3. Настройте SSL через Let's Encrypt

## Настройка DNS
Измените A-запись домена на IP нового хостинга:
```
@ IN A новый_IP_адрес
www IN A новый_IP_адрес
```

## Временное решение
Используйте CDN с российскими серверами:
- **Selectel CDN**
- **VK Cloud CDN**
- **Yandex Cloud CDN** 