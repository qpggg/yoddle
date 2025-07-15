# Yandex Cloud - российская альтернатива Vercel

## Почему Yandex Cloud:
✅ Полностью российская компания
✅ Соответствует всем российским законам
✅ Бесплатный период 4000₽ (хватит на месяцы)
✅ Serverless функции как в Vercel
✅ Автодеплой из GitHub

## Настройка (похоже на Vercel):

### Шаг 1: Регистрация
1. Зайдите на cloud.yandex.ru
2. Войдите через Яндекс ID
3. Получите 4000₽ на счет (бесплатно)

### Шаг 2: Создание проекта
```bash
# Установка CLI
npm install -g @yandex-cloud/cli

# Инициализация проекта
yc config profile create yoddle-profile
yc config set cloud-id <your-cloud-id>
yc config set folder-id <your-folder-id>
```

### Шаг 3: Настройка для React + Node.js
Создайте файл `.yandex-cloud.yaml`:
```yaml
service: yoddle-app
runtime: nodejs18
memory: 128
source: ./

build:
  - npm install
  - npm run build

functions:
  - name: api
    source: ./api
    handler: index.handler
    
  - name: web
    source: ./dist
    handler: static
```

### Шаг 4: Деплой
```bash
# Деплой одной командой
yc serverless function deploy --name yoddle-app
```

## Преимущества:
✅ Российская юрисдикция
✅ Бесплатный период
✅ Serverless функции
✅ CDN в России
✅ Автодеплой
✅ Не блокируется операторами 