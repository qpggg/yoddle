// Простой прокси-сервер для российского хостинга
// Перенаправляет все запросы на Vercel
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Ваш домен на Vercel
const VERCEL_URL = 'https://your-app.vercel.app';

// Middleware
app.use(cors());

// Настройка прокси
const proxyOptions = {
  target: VERCEL_URL,
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  headers: {
    'X-Forwarded-Host': 'your-domain.com',
    'X-Forwarded-Proto': 'https'
  },
  onError: (err, req, res) => {
    console.log('Proxy error:', err);
    res.status(500).send('Proxy error');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Убираем заголовки, которые могут мешать
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // Добавляем заголовки для кэширования
    proxyRes.headers['Cache-Control'] = 'public, max-age=300';
  }
};

// Прокси для всех путей
app.use('/', createProxyMiddleware(proxyOptions));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    proxy_target: VERCEL_URL,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📡 Proxying requests to: ${VERCEL_URL}`);
});

module.exports = app; 