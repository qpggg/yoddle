import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// === ЗАГЛУШКИ API ДЛЯ ТЕСТИРОВАНИЯ ===

// Фейковые данные пользователей
const users = [
  { id: 1, login: 'test@gmail.com', password: 'test', name: 'Тестовый пользователь' },
  { id: 2, login: 'admin', password: 'admin', name: 'Администратор' },
  { id: 3, login: 'user', password: 'user', name: 'Пользователь' }
];

// Фейковые балансы
const balances = {
  1: { balance: 10450, total_earned: 10450, total_spent: 0 },
  2: { balance: 5000, total_earned: 8000, total_spent: 3000 },
  3: { balance: 1200, total_earned: 1200, total_spent: 0 }
};

// === API ЛОГИНА ===
app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  
  const user = users.find(u => u.login === login && u.password === password);
  
  if (user) {
    res.json({ 
      success: true, 
      user: { id: user.id, login: user.login, name: user.name } 
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// === API КОШЕЛЬКА ===
app.get('/api/balance', (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }
  
  const balance = balances[user_id] || { balance: 0, total_earned: 0, total_spent: 0 };
  res.json(balance);
});

app.get('/api/balance/transactions', (req, res) => {
  const { user_id } = req.query;
  
  const transactions = [
    { transaction_type: 'credit', amount: 100, description: 'Начисление за активность', created_at: '2025-08-06T10:00:00Z' },
    { transaction_type: 'debit', amount: -50, description: 'Покупка льготы', created_at: '2025-08-06T09:00:00Z' },
    { transaction_type: 'admin_add', amount: 1000, description: 'Бонус от админа', created_at: '2025-08-05T15:00:00Z' }
  ];
  
  res.json({ transactions });
});

app.post('/api/balance', (req, res) => {
  const { user_id, amount, description, action } = req.body;
  
  if (!balances[user_id]) {
    balances[user_id] = { balance: 0, total_earned: 0, total_spent: 0 };
  }
  
  if (action === 'deduct' || action === 'purchase') {
    balances[user_id].balance -= Math.abs(amount);
    balances[user_id].total_spent += Math.abs(amount);
  } else {
    balances[user_id].balance += Math.abs(amount);
    balances[user_id].total_earned += Math.abs(amount);
  }
  
  res.json({ 
    success: true, 
    balance: balances[user_id].balance, 
    message: `Операция выполнена` 
  });
});

// === ЗАГЛУШКИ ДРУГИХ API ===
app.get('/api/profile', (req, res) => {
  const { id } = req.query;
  const user = users.find(u => u.id == id);
  if (user) {
    res.json({ ...user, level: 5, xp: 1250 });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/activity', (req, res) => {
  res.json([
    { date: '2025-08-06', activity_count: 5, xp_earned: 50 },
    { date: '2025-08-05', activity_count: 3, xp_earned: 30 }
  ]);
});

app.get('/api/benefits', (req, res) => {
  res.json([
    { id: 1, name: 'Корпоративный фитнес', description: 'Абонемент в спортзал', cost: 100 },
    { id: 2, name: 'Страховка', description: 'Медицинская страховка', cost: 200 }
  ]);
});

app.get('/api/notifications', (req, res) => {
  res.json([
    { id: 1, title: 'Добро пожаловать!', message: 'Система кошелька готова к использованию', created_at: '2025-08-06T10:00:00Z' }
  ]);
});

// === РАЗДАЧА СТАТИКИ ===
app.use(express.static(join(__dirname, 'dist')));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
  console.log('💰 Wallet API ready with mock data');
  console.log('🔑 Login: test@gmail.com / test');
});