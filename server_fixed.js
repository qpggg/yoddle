import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import newsRouter from './api/news.js';
import { validateLogin, validateUser, validateProgress, validateActivityParams, validateClient, rateLimit } from './middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// === ФИКСИРОВАННОЕ ПОДКЛЮЧЕНИЕ К БД ===
const DB_CONNECTION = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';

const dbPool = new Pool({
  connectionString: DB_CONNECTION,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

console.log('🔍 DB Connection:', DB_CONNECTION.replace(/:[^:]*@/, ':***@'));

// === ПРОСТЫЕ API КОШЕЛЬКА ===

// Получение баланса
app.get('/api/balance', async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  try {
    const client = await dbPool.connect();
    
    // Проверяем баланс
    let result = await client.query('SELECT balance, total_earned, total_spent FROM user_balance WHERE user_id = $1', [user_id]);
    
    if (result.rows.length === 0) {
      // Создаем начальный баланс
      await client.query('INSERT INTO user_balance (user_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0)', [user_id]);
      result = await client.query('SELECT balance, total_earned, total_spent FROM user_balance WHERE user_id = $1', [user_id]);
    }
    
    client.release();
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Balance error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// История транзакций
app.get('/api/balance/transactions', async (req, res) => {
  const { user_id, limit = 10 } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  try {
    const client = await dbPool.connect();
    const result = await client.query(
      'SELECT transaction_type, amount, description, created_at FROM coin_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [user_id, limit]
    );
    client.release();
    res.json({ transactions: result.rows });
    
  } catch (error) {
    console.error('Transactions error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Добавление/списание коинов
app.post('/api/balance', async (req, res) => {
  const { user_id, amount, description, action } = req.body;
  
  if (!user_id || !amount) {
    return res.status(400).json({ error: 'user_id and amount required' });
  }

  try {
    const client = await dbPool.connect();
    
    // Получаем текущий баланс
    let balanceResult = await client.query('SELECT balance FROM user_balance WHERE user_id = $1', [user_id]);
    
    if (balanceResult.rows.length === 0) {
      await client.query('INSERT INTO user_balance (user_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0)', [user_id]);
      balanceResult = await client.query('SELECT balance FROM user_balance WHERE user_id = $1', [user_id]);
    }
    
    const currentBalance = parseFloat(balanceResult.rows[0].balance) || 0;
    const changeAmount = Math.abs(amount);
    
    if (action === 'deduct' || action === 'purchase') {
      // Списание
      if (currentBalance < changeAmount) {
        client.release();
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      
      const newBalance = currentBalance - changeAmount;
      await client.query('UPDATE user_balance SET balance = $1, total_spent = total_spent + $2 WHERE user_id = $3', [newBalance, changeAmount, user_id]);
      await client.query('INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description) VALUES ($1, $2, $3, $4, $5, $6)', [user_id, 'debit', -changeAmount, currentBalance, newBalance, description || 'Покупка']);
      
      client.release();
      res.json({ success: true, balance: newBalance, message: `Списано ${changeAmount} коинов` });
    } else {
      // Пополнение
      const newBalance = currentBalance + changeAmount;
      await client.query('UPDATE user_balance SET balance = $1, total_earned = total_earned + $2 WHERE user_id = $3', [newBalance, changeAmount, user_id]);
      await client.query('INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description) VALUES ($1, $2, $3, $4, $5, $6)', [user_id, 'credit', changeAmount, currentBalance, newBalance, description || 'Пополнение']);
      
      client.release();
      res.json({ success: true, balance: newBalance, message: `Добавлено ${changeAmount} коинов` });
    }
    
  } catch (error) {
    console.error('Balance update error:', error.message);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// Админ добавление коинов
app.post('/api/admin-coins/add', async (req, res) => {
  const { user_id, amount, description } = req.body;
  
  if (!user_id || !amount) {
    return res.status(400).json({ error: 'user_id and amount required' });
  }

  try {
    const client = await dbPool.connect();
    
    let balanceResult = await client.query('SELECT balance FROM user_balance WHERE user_id = $1', [user_id]);
    
    if (balanceResult.rows.length === 0) {
      await client.query('INSERT INTO user_balance (user_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0)', [user_id]);
      balanceResult = await client.query('SELECT balance FROM user_balance WHERE user_id = $1', [user_id]);
    }
    
    const currentBalance = parseFloat(balanceResult.rows[0].balance) || 0;
    const newBalance = currentBalance + amount;
    
    await client.query('UPDATE user_balance SET balance = $1, total_earned = total_earned + $2 WHERE user_id = $3', [newBalance, amount, user_id]);
    await client.query('INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, processed_by) VALUES ($1, $2, $3, $4, $5, $6, $7)', [user_id, 'admin_add', amount, currentBalance, newBalance, description || 'Admin добавил коины', 'admin']);
    
    client.release();
    res.json({ success: true, new_balance: newBalance, message: `Добавлено ${amount} коинов` });
    
  } catch (error) {
    console.error('Admin add error:', error.message);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// Админ статистика
app.get('/api/admin-coins', async (req, res) => {
  try {
    const client = await dbPool.connect();
    const stats = await client.query('SELECT COUNT(*) as total_users, SUM(balance) as total_balance, AVG(balance) as avg_balance FROM user_balance');
    client.release();
    res.json({ success: true, statistics: stats.rows[0] });
    
  } catch (error) {
    console.error('Admin stats error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// === ЛОГИН ===
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  try {
    const client = await dbPool.connect();
    const result = await client.query('SELECT * FROM enter WHERE login = $1', [login]);
    
    if (result.rows.length === 0) {
      client.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const isValid = password === user.password || await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      client.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    client.release();
    res.json({ success: true, user: { id: user.id, login: user.login, name: user.name } });
    
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// === API ЗАЯВОК ===
app.post('/api/clients', async (req, res) => {
  const { name, email, company, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Имя, email и сообщение обязательны' });
  }

  try {
    // Простая заглушка для отправки заявки
    console.log('📨 Новая заявка:', { name, email, company, message });
    
    res.json({ 
      success: true, 
      message: 'Заявка отправлена успешно!' 
    });
    
  } catch (error) {
    console.error('Ошибка отправки заявки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// === РАЗДАЧА СТАТИКИ ===
app.use(express.static(join(__dirname, 'dist')));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('💰 Wallet API: /api/balance, /api/admin-coins');
  console.log('🔑 Login API: /api/login');
});