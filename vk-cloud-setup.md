# VK Cloud - российская альтернатива Vercel

## Почему VK Cloud:
✅ Российская компания (Mail.ru Group)
✅ Соответствует российским законам
✅ Бесплатный период 3000₽
✅ Простой деплой Node.js приложений
✅ CDN в России

## Настройка:

### Шаг 1: Регистрация
1. Зайдите на mcs.mail.ru
2. Регистрируйтесь через VK или email
3. Получите 3000₽ бесплатно

### Шаг 2: Создание приложения
1. Выберите "Облачные вычисления"
2. Создайте виртуальную машину Ubuntu
3. Минимальная конфигурация: 1 CPU, 1GB RAM (хватит)

### Шаг 3: Автоматическая настройка
Создайте скрипт `deploy-vk.sh`:
```bash
#!/bin/bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Клонирование проекта
git clone https://github.com/your-username/yoddle1.git
cd yoddle1

# Установка зависимостей
npm install

# Сборка
npm run build

# Настройка Nginx
sudo tee /etc/nginx/sites-available/yoddle << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/yoddle /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Запуск приложения
npm install -g pm2
pm2 start server.js --name yoddle
pm2 startup
pm2 save
```

### Шаг 4: Автодеплой через GitHub Actions
Создайте `.github/workflows/deploy-vk.yml`:
```yaml
name: Deploy to VK Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VK Cloud
        run: |
          ssh -o StrictHostKeyChecking=no ${{ secrets.VK_USER }}@${{ secrets.VK_HOST }} '
            cd yoddle1 &&
            git pull origin main &&
            npm install &&
            npm run build &&
            pm2 restart yoddle
          '
```

## Преимущества:
✅ Российская юрисдикция
✅ Бесплатный период
✅ Полный контроль над сервером
✅ Можно настроить автодеплой
✅ CDN в России 