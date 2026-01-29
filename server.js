import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import newsRouter from './api/news.js';
import aiRouter from './api/ai.js';
import aiPreferencesHandler from './api/ai-preferences.js';
import recommendationsFeedbackHandler from './api/recommendations-feedback.js';
import productivityRouter from './api/productivity.js';
import clientsRouter from './api/clients.js';
import cronRouter from './api/cron.js';
import { validateLogin, validateUser, validateProgress, validateActivityParams, validateClient, rateLimit } from './middleware/validation.js';
import { createDbClient, getDbClient } from './db.js';
import { purchaseHandler, refundHandler, transactionsHandler, purchasesHandler, policyHandler, refreshHandler } from './api/wallet/handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Сохраняем PORT из PM2/env до загрузки .env (если установлен)
const pm2Port = process.env.PORT;

// Load .env without overriding container-provided env (so compose env wins in Docker)
dotenv.config({ override: false });

// Если PORT был установлен из PM2/env, используем его (приоритет над .env)
if (pm2Port) {
  process.env.PORT = pm2Port;
}

// 🔍 ОТЛАДКА: Проверяем загрузку .env (маскируем пароль)
if (process.env.PG_CONNECTION_STRING) {
  try {
    const url = new URL(process.env.PG_CONNECTION_STRING);
    if (url.password) url.password = '****';
    console.log('🔍 DEBUG: .env loaded, PG_CONNECTION_STRING =', url.toString());
  } catch {
    console.log('🔍 DEBUG: .env loaded, PG_CONNECTION_STRING present');
  }
} else {
  console.warn('⚠️ PG_CONNECTION_STRING is not set');
}

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : (process.env.PORT || 3001);

// 🔍 ОТЛАДКА: Показываем какой порт используется
console.log(`🔍 DEBUG: Using PORT=${PORT} (NODE_ENV=${process.env.NODE_ENV}, process.env.PORT=${process.env.PORT})`);

// Middleware
// Настройка CORS в зависимости от окружения
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware для логирования всех запросов
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Ранний реестр Wallet API (перекрывает старые дубликаты ниже)
app.post('/api/wallet/purchase', purchaseHandler);
app.post('/api/wallet/refund', refundHandler);
app.get('/api/wallet/transactions', transactionsHandler);
app.get('/api/wallet/purchases', purchasesHandler);
app.get('/api/wallet/policy', policyHandler);
app.post('/api/wallet/refresh', refreshHandler);

// === Раздача статики фронта ===
// ВАЖНО: Статика раздается ПОСЛЕ всех API роутов (см. ниже, перед SPA fallback)
import path from 'path';

// Обеспечиваем схему кошелька в БД (для локальной разработки и новых окружений)
async function ensureWalletSchema() {
  const client = createDbClient();
  try {
    await client.query(`ALTER TABLE IF EXISTS benefits ADD COLUMN IF NOT EXISTS price_coins numeric NOT NULL DEFAULT 0`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_balance (
        user_id integer PRIMARY KEY,
        balance numeric NOT NULL DEFAULT 0,
        total_earned numeric NOT NULL DEFAULT 0,
        total_spent numeric NOT NULL DEFAULT 0,
        updated_at timestamp DEFAULT NOW()
      )`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS coin_transactions (
        id serial PRIMARY KEY,
        user_id integer NOT NULL,
        transaction_type varchar(50) NOT NULL,
        amount numeric NOT NULL,
        balance_before numeric,
        balance_after numeric,
        description text,
        reference_id text,
        processed_by integer,
        created_at timestamp DEFAULT NOW()
      )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at)`);
    // Relax amount constraint and remove uniqueness that blocks repeated purchases
    await client.query(`ALTER TABLE IF EXISTS coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_amount_positive`);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'coin_transactions_amount_non_negative'
        ) THEN
          ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_amount_non_negative CHECK (amount >= 0);
        END IF;
      END $$;`);
    // Drop both constraint and index variants of the unique rule
    await client.query(`ALTER TABLE IF EXISTS coin_transactions DROP CONSTRAINT IF EXISTS uq_tx_user_type_ref`);
    await client.query(`DROP INDEX IF EXISTS uq_tx_user_type_ref`);
    // Убираем триггер: баланс обновляет только код (триггер дублировал — total_spent считался 2x)
    await client.query(`DROP TRIGGER IF EXISTS trigger_update_user_balance ON coin_transactions`);
  } catch (e) {
    console.error('ensureWalletSchema error:', e.message);
  }
}

// 🚀 КЭШ ПОЛЬЗОВАТЕЛЕЙ ДЛЯ БЫСТРОГО ВХОДА
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

function getUserFromCache(login) {
  const cached = userCache.get(login);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  return null;
}

function setUserInCache(login, user) {
  userCache.set(login, {
    user: { ...user },
    timestamp: Date.now()
  });
}

function setUserWithPasswordInCache(login, user) {
  userCache.set(login, {
    user: { ...user },
    timestamp: Date.now()
  });
}

// Удалено дублирующееся объявление createDbClient

// POST /api/login - безопасная аутентификация
app.post('/api/login', rateLimit, validateLogin, async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  let client;
  try {
    // 🚀 Проверяем кэш сначала
    let user = getUserFromCache(login);
    
    if (!user) {
      // Создаем новое подключение и подключаемся
      client = await createDbClient();
      await client.connect();
      // Если нет в кэше, запрашиваем из БД
      const userResult = await client.query(
        'SELECT id, name, login AS email, phone, position, avatar_url AS avatar, password FROM enter WHERE login = $1',
        [login]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid login or password' });
      }

      user = userResult.rows[0];
      // Сохраняем в кэш с паролем для быстрой проверки
      setUserWithPasswordInCache(login, user);
    }
    
    // Проверяем пароль (поддержка как хешированных, так и открытых паролей для миграции)
    let passwordValid = false;
    
    if (user.password && user.password.startsWith('$2')) {
      // Пароль хеширован с bcrypt
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Пароль в открытом виде (временно для совместимости)
      passwordValid = password === user.password;
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }

    // Удаляем пароль из ответа
    delete user.password;
    
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection error' });
  } finally {
    // Закрываем соединение в блоке finally
    if (client) {
      await client.end();
    }
  }
});

// Удалён старый inline /api/wallet/refund; используется модульный refundHandler, зарегистрированный выше

// GET /api/wallet/purchases - последние покупки пользователя (опционально по benefit_id)
app.get('/api/wallet/purchases', async (req, res) => {
  const { user_id, benefit_id, limit = 50 } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  const userIdStr = String(user_id);
  const benefitIdStr = benefit_id !== undefined ? String(benefit_id) : undefined;
  const limitNum = parseInt(String(limit), 10) || 50;

  const client = createDbClient();
  try {
    await client.connect();
    const rows = await client.query(
      `SELECT ct.* , b.name AS benefit_name
         FROM coin_transactions ct
         LEFT JOIN benefits b ON (ct.transaction_type = 'benefit_purchase' AND ct.reference_id = b.id::text)
        WHERE ct.user_id::text = $1 AND ct.transaction_type = 'benefit_purchase'
          ${benefitIdStr ? 'AND ct.reference_id = $3' : ''}
        ORDER BY ct.created_at DESC, ct.id DESC
        LIMIT $2`,
      benefitIdStr ? [userIdStr, limitNum, benefitIdStr] : [userIdStr, limitNum]
    );
    await client.end();
    return res.status(200).json({ success: true, data: rows.rows });
  } catch (error) {
    await client.end();
    console.error('Purchases fetch error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/wallet/refund-windows — оставшееся время возврата по БД (один запрос, источник правды для таймера)
app.get('/api/wallet/refund-windows', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();
    const rows = await client.query(
      `SELECT ub.benefit_id,
         GREATEST(0, LEAST(48*3600, FLOOR(48*3600 - EXTRACT(EPOCH FROM (NOW() - ct.created_at)))))::int AS seconds_left
        FROM user_benefits ub
        INNER JOIN LATERAL (
          SELECT created_at FROM coin_transactions
          WHERE user_id::text = ub.user_id::text AND transaction_type = 'benefit_purchase' AND reference_id = ub.benefit_id::text
          ORDER BY created_at DESC LIMIT 1
        ) ct ON true
        WHERE ub.user_id = $1`,
      [user_id]
    );
    const windows = {};
    for (const row of rows.rows) {
      windows[String(row.benefit_id)] = Number(row.seconds_left ?? 0);
    }
    await client.end();
    return res.status(200).json({ success: true, windows });
  } catch (error) {
    await client.end();
    console.error('Refund-windows error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/gamification/login - оптимизированная геймификация входа
app.post('/api/gamification/login', async (req, res) => {
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    // 🎯 ПРОВЕРЯЕМ УЖЕ ПОЛУЧЕННЫЕ ДОСТИЖЕНИЯ
    const existingAchievements = await client.query(
      'SELECT action FROM activity_log WHERE user_id = $1 AND action IN ($2, $3, $4) AND DATE(created_at) = CURRENT_DATE',
      [user_id, 'login', 'first_login_today', 'streak_milestone']
    );
    
    const existingActions = existingAchievements.rows.map(row => row.action);
    
    // Создаем действия согласно таблице
    const actions = [];
    
    // 🔒 Вход в систему (10 XP) - всегда
    actions.push({
      action: 'login',
      xp_earned: 10,
      description: 'Вход в систему'
    });
    
         // 🌈 Первый вход за день (15 XP) - только если еще не получено сегодня
     const todayLogin = existingAchievements.rows.find(row => row.action === 'first_login_today');
     if (!todayLogin) {
       actions.push({
         action: 'first_login_today',
         xp_earned: 15,
         description: 'Первый вход за день'
       });
     }
    
    // 🔥 Серия входов (50 XP) - проверяем streak
    const progressResult = await client.query(
      'SELECT login_streak FROM user_progress WHERE user_id = $1',
      [user_id]
    );
    
    const currentStreak = progressResult.rows[0]?.login_streak || 0;
    const newStreak = currentStreak + 1;
    
         // Даем достижение за streak каждые 7 дней
     const streakMilestone = existingAchievements.rows.find(row => row.action === 'streak_milestone');
     if (newStreak % 7 === 0 && !streakMilestone) {
       actions.push({
         action: 'streak_milestone',
         xp_earned: 50,
         description: `Серия входов: ${newStreak} дней подряд`
       });
     }
    
    // 🚀 ВЫПОЛНЯЕМ ВСЕ ПАРАЛЛЕЛЬНО
    const promises = actions.map(action =>
      client.query(
        'INSERT INTO activity_log (user_id, action, xp_earned, description) VALUES ($1, $2, $3, $4)',
        [user_id, action.action, action.xp_earned, action.description]
      )
    );
    
    // Ждем завершения всех операций
    await Promise.all(promises);
    
    // Подсчитываем общий XP
    const totalXP = actions.reduce((sum, action) => sum + action.xp_earned, 0);
    
    // Обновляем или создаем запись в user_progress
    await client.query(
      `INSERT INTO user_progress (user_id, login_streak, last_activity, xp) 
       VALUES ($1, 1, CURRENT_TIMESTAMP, $2) 
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         login_streak = user_progress.login_streak + 1, 
         last_activity = CURRENT_TIMESTAMP,
         xp = user_progress.xp + $2`,
      [user_id, totalXP]
    );
    
    return res.status(200).json({ 
      success: true, 
      totalXP,
      actions: actions.length,
      bonuses: actions.filter(a => a.action !== 'login').length,
      newStreak,
      achievements: actions.map(a => a.action)
    });
    
  } catch (error) {
    console.error('Gamification error:', error);
    return res.status(500).json({ error: 'Gamification error' });
  }
});

// GET /api/activity - оптимизированный endpoint
app.get('/api/activity', rateLimit, validateActivityParams, async (req, res) => {
  const { user_id, year, month } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    
    // Определяем текущий месяц и год, если не переданы
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    console.log('Activity API: user_id =', user_id, 'year =', targetYear, 'month =', targetMonth);

    // Получаем количество дней в месяце
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    // Создаем массив для всех дней месяца
    const dailyActivity = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      actions: 0
    }));

    // Получаем данные активности прямым запросом (совместимо везде)
    const result = await client.query(
      `SELECT EXTRACT(DAY FROM created_at) as day, COUNT(*) as total_actions
       FROM activity_log
       WHERE user_id = $1
         AND EXTRACT(YEAR FROM created_at) = $2
         AND EXTRACT(MONTH FROM created_at) = $3
       GROUP BY EXTRACT(DAY FROM created_at)
       ORDER BY day`,
      [user_id, targetYear, targetMonth]
    );

    console.log('Activity API: Результат запроса:', result.rows);

    // Заполняем данные активности
    result.rows.forEach(row => {
      const dayIndex = parseInt(row.day) - 1;
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        dailyActivity[dayIndex].actions = parseInt(row.total_actions);
      }
    });

    // Получаем название месяца
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    res.status(200).json({
      success: true,
      data: dailyActivity,
      month: monthNames[targetMonth - 1],
      year: targetYear,
      totalActions: dailyActivity.reduce((sum, day) => sum + day.actions, 0)
    });

  } catch (error) {
    console.error('Ошибка получения данных активности:', error);
    await client.end();
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/benefits - точно как в api/benefits.js
app.get('/api/benefits', async (req, res) => {
  const client = createDbClient();

  try {
    await client.connect();
    const result = await client.query('SELECT id, name, description, category, COALESCE(price_coins, 0) AS price_coins FROM benefits ORDER BY category, name');
    await client.end();
    return res.status(200).json({ benefits: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    await client.end();
    return res.status(500).json({ error: 'Database error' });
  }
});

// === Wallet API (delegated to api/wallet/handlers.js) ===
// app.post('/api/wallet/purchase', purchaseHandler); // This line is now handled by the early registration
// app.post('/api/wallet/refund', refundHandler); // This line is now handled by the early registration
// app.get('/api/wallet/transactions', transactionsHandler); // This line is now handled by the early registration
// app.get('/api/wallet/purchases', purchasesHandler); // This line is now handled by the early registration
// app.get('/api/wallet/policy', policyHandler); // This line is now handled by the early registration
// app.post('/api/wallet/refresh', refreshHandler); // This line is now handled by the early registration

// GET /api/wallet - текущий баланс и итоги
app.get('/api/wallet', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();
    const result = await client.query(
      'SELECT balance, total_earned, total_spent FROM user_balance WHERE user_id = $1',
      [user_id]
    );
    let row = result.rows[0];

    // Если строки нет — создаем нулевую для консистентности интерфейса
    if (!row) {
      await client.query(
        'INSERT INTO user_balance (user_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0) ON CONFLICT DO NOTHING',
        [user_id]
      );
      row = { balance: 0, total_earned: 0, total_spent: 0 };
    }

    await client.end();
    return res.status(200).json({
      success: true,
      balance: Number(row.balance || 0),
      total_earned: Number(row.total_earned || 0),
      total_spent: Number(row.total_spent || 0)
    });
  } catch (error) {
    await client.end();
    console.error('Wallet GET error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/wallet/refresh — пересчитать user_balance из транзакций (идемпотентно)
app.post('/api/wallet/refresh', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();
    const agg = await client.query(
      `SELECT 
          COALESCE(SUM(CASE WHEN transaction_type IN ('monthly_allowance','credit','admin_add') THEN amount ELSE 0 END),0) AS earned,
          COALESCE(SUM(CASE WHEN transaction_type IN ('benefit_purchase','debit','admin_remove') THEN amount ELSE 0 END),0) 
          - COALESCE(SUM(CASE WHEN transaction_type = 'refund' THEN ABS(amount) ELSE 0 END),0) AS spent
       FROM coin_transactions WHERE user_id = $1`,
      [user_id]
    );
    const earned = Number(agg.rows[0]?.earned || 0);
    const spentRaw = Number(agg.rows[0]?.spent || 0);
    const spent = Math.max(0, spentRaw);
    const balance = earned - spent;

    await client.query(
      `INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance, total_earned = EXCLUDED.total_earned, total_spent = EXCLUDED.total_spent, updated_at = NOW()`,
      [user_id, balance, earned, spent]
    );

    await client.end();
    return res.status(200).json({ success: true, balance, total_earned: earned, total_spent: spent });
  } catch (error) {
    await client.end();
    console.error('Wallet refresh error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/wallet/purchase — покупка льготы (списание монет и запись транзакции)
app.post('/api/wallet/purchase', async (req, res) => {
  const { user_id, benefit_id } = req.body;
  if (!user_id || !benefit_id) {
    return res.status(400).json({ error: 'user_id and benefit_id are required' });
  }
  const userIdStr = String(user_id);
  const benefitIdNum = parseInt(String(benefit_id), 10);

  // Используем один коннект из пула для транзакции
  const client = await getDbClient();
  try {
    await ensureWalletSchema();
    await client.query('BEGIN');

    // Убедимся, что есть строка user_balance, и заблокируем её для корректного расчёта
    const ubRes = await client.query(
      `SELECT user_id, balance, total_earned, total_spent
         FROM user_balance
        WHERE user_id::text = $1
        FOR UPDATE`,
      [userIdStr]
    );

    if (ubRes.rows.length === 0) {
      // Создаём начальную запись с нулями и сразу блокируем (повторный SELECT FOR UPDATE)
      await client.query(
        `INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
         VALUES ($1, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userIdStr]
      );
    }

    const ubLocked = await client.query(
      `SELECT user_id, balance, total_earned, total_spent
         FROM user_balance
        WHERE user_id::text = $1
        FOR UPDATE`,
      [userIdStr]
    );

    const currentBalance = Number(ubLocked.rows[0]?.balance || 0);

    // Загружаем льготу и цену
    const benefitRes = await client.query(
      'SELECT id, name, COALESCE(price_coins, 0) AS price_coins FROM benefits WHERE id = $1',
      [benefitIdNum]
    );
    if (benefitRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'benefit not found' });
    }
    const benefit = benefitRes.rows[0];
    const price = Number(benefit.price_coins || 0);

    if (price > 0 && currentBalance < price) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'insufficient_funds', required: price, balance: currentBalance });
    }

    const balanceBefore = currentBalance;
    const balanceAfter = price > 0 ? balanceBefore - price : balanceBefore;

    // Анти-дубль: если совсем свежая покупка этой льготы (<= 5 секунд) — не дублируем
    const recentPurchase = await client.query(
      `SELECT id FROM coin_transactions 
         WHERE user_id::text = $1 AND transaction_type = 'benefit_purchase'
           AND reference_id = $2 AND created_at >= NOW() - INTERVAL '5 seconds'
         ORDER BY created_at DESC, id DESC LIMIT 1`,
      [userIdStr, String(benefitIdNum)]
    );
    if (recentPurchase.rows.length > 0) {
      await client.query('COMMIT');
      return res.status(200).json({ success: true, duplicate: true, balance: currentBalance, spent: 0 });
    }

    // Записываем транзакцию покупки
    console.log('INSERTING PURCHASE:', { user_id: userIdStr, price, benefit_id: String(benefit.id) });
    await client.query(
      `INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
       VALUES ($1,'benefit_purchase',$2,$3,$4,$5,$6,NULL,NOW())`,
      [userIdStr, price, balanceBefore, balanceAfter, `Покупка льготы: ${benefit.name}`, String(benefit.id)]
    );

    // Обновляем баланс пользователя
    if (price > 0) {
      await client.query(
        `UPDATE user_balance
            SET balance = $2,
                total_spent = total_spent + $3,
                updated_at = NOW()
          WHERE user_id::text = $1`,
        [userIdStr, balanceAfter, price]
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({ success: true, balance: balanceAfter, spent: price });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Wallet purchase error:', error);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

// GET /api/wallet/transactions - история транзакций с пагинацией
app.get('/api/wallet/transactions', async (req, res) => {
  const { user_id, limit = 20, offset = 0, type = 'all' } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();
    // Фильтр по типу
    let whereType = '';
    if (type === 'topup') {
      whereType = `AND ct.transaction_type IN ('monthly_allowance','credit','admin_add','refund')`;
    } else if (type === 'purchase') {
      whereType = `AND ct.transaction_type IN ('benefit_purchase')`;
    } else if (type === 'debit') {
      whereType = `AND ct.transaction_type IN ('debit','admin_remove')`;
    }
    // Упрощенный запрос без сложных JOIN'ов для начала
    const sqlWallet = `SELECT ct.id, ct.transaction_type, ct.amount, ct.description, ct.reference_id, ct.created_at
                         FROM coin_transactions ct
                        WHERE ct.user_id::text = $1 ${whereType}
                        ORDER BY ct.created_at DESC, ct.id DESC`;

    const limitNum = parseInt(String(limit), 10) || 20;
    const offsetNum = parseInt(String(offset), 10) || 0;

    console.log('QUERYING TRANSACTIONS for user_id:', String(user_id));
    const walletRows = await client.query(sqlWallet, [String(user_id)]);
    console.log('FOUND TRANSACTIONS:', walletRows.rows.length);
    
    // Получаем названия льгот отдельно для benefit_purchase
    const transactions = walletRows.rows.map(row => {
      if (row.transaction_type === 'benefit_purchase' && row.reference_id) {
        // Добавим название льготы потом отдельным запросом, пока возвращаем как есть
        return { ...row, benefit_name: null };
      }
      return { ...row, benefit_name: null };
    });
    
    const page = transactions.slice(offsetNum, offsetNum + limitNum);
    await client.end();
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    await client.end();
    console.error('Wallet transactions error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/wallet/policy - политика начислений и дата следующего начисления
app.get('/api/wallet/policy', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();
    const result = await client.query(
      `SELECT cp.allowance_day, cp.carryover_policy, cp.max_balance, COALESCE(cp.timezone, 'Europe/Moscow') as timezone
         FROM enter e
         LEFT JOIN company_plans cp ON cp.id = e.company_id
        WHERE e.id = $1`,
      [user_id]
    );
    const row = result.rows[0] || {};
    const allowanceDay = row.allowance_day || 1;
    const tz = row.timezone || 'Europe/Moscow';
    const carryover = row.carryover_policy || 'none';

    // Рассчитываем следующую дату начисления в часовом поясе компании
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const currentDay = now.getUTCDate();
    const targetMonth = currentDay < allowanceDay ? month : month + 1;
    const targetDate = new Date(Date.UTC(year, targetMonth, Math.min(allowanceDay, 28), 0, 0, 0));

    const hint = `Следующее начисление: ${targetDate.toLocaleDateString('ru-RU')} • Политика переноса: ${carryover === 'none' ? 'без переноса' : carryover === 'full' ? 'полный перенос' : 'частичный перенос'}`;
    await client.end();
    return res.status(200).json({ success: true, allowance_day: allowanceDay, carryover_policy: carryover, timezone: tz, next_allowance_at: targetDate, hint });
  } catch (error) {
    await client.end();
    console.error('Wallet policy error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// DEV: seed wallet data for a user (local only)
app.post('/api/dev/wallet/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden in production' });
  }

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();
    // Ensure user_balance exists
    const ub = await client.query('SELECT balance, total_earned, total_spent FROM user_balance WHERE user_id = $1', [user_id]);
    let balance = Number(ub.rows[0]?.balance || 0);
    let totalEarned = Number(ub.rows[0]?.total_earned || 0);
    let totalSpent = Number(ub.rows[0]?.total_spent || 0);

    // Seed allowance + purchases
    const allowance = 10000;
    const createdAt = new Date();

    // monthly_allowance
    const before1 = balance;
    const after1 = before1 + allowance;
    await client.query(
      `INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
       VALUES ($1,'monthly_allowance',$2,$3,$4,$5,NULL,NULL,NOW())`,
      [user_id, allowance, before1, after1, 'Тестовое начисление за месяц']
    );
    balance = after1; totalEarned += allowance;

    // Fetch some benefits to reference
    const benefits = await client.query('SELECT id, name FROM benefits ORDER BY id LIMIT 3');
    const demo = [
      { amount: 1500, benefit: benefits.rows[0] },
      { amount: 2000, benefit: benefits.rows[1] },
      { amount: 700,  benefit: benefits.rows[2] },
    ].filter(d => d.benefit);

    for (const d of demo) {
      const before = balance;
      const after = before - d.amount;
      await client.query(
        `INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
         VALUES ($1,'benefit_purchase',$2,$3,$4,$5,$6,NULL,NOW())`,
        [user_id, d.amount, before, after, `Покупка льготы: ${d.benefit.name}`, d.benefit.id]
      );
      balance = after; totalSpent += d.amount;
    }

    // Симулируем списание неиспользованного остатка в конце месяца
    const expireAmount = Math.min(300, Math.max(0, balance - 5000));
    if (expireAmount > 0) {
      const before = balance;
      const after = before - expireAmount;
      await client.query(
        `INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
         VALUES ($1,'debit',$2,$3,$4,$5,NULL,NULL,NOW())`,
        [user_id, expireAmount, before, after, 'Сгорание неиспользованного остатка']
      );
      balance = after; totalSpent += expireAmount;
    }

    // Upsert user_balance
    await client.query(
      `INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance, total_earned = EXCLUDED.total_earned, total_spent = EXCLUDED.total_spent, updated_at = NOW()`,
      [user_id, balance, totalEarned, totalSpent]
    );

    await client.end();
    return res.status(200).json({ success: true, balance, total_earned: totalEarned, total_spent: totalSpent });
  } catch (error) {
    await client.end();
    console.error('Seed wallet error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// DEV: SQL script helper — отдаёт готовый SQL для наполнения тестовыми данными
app.get('/api/dev/wallet/sql-script', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden in production' });
  }

  const sql = `-- TEST WALLET SEED
-- Замените :USER_ID на реальный id пользователя из таблицы enter
-- Начисление за месяц
INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
VALUES (:USER_ID,'monthly_allowance',10000,COALESCE((SELECT balance FROM user_balance WHERE user_id=:USER_ID),0),
        COALESCE((SELECT balance FROM user_balance WHERE user_id=:USER_ID),0)+10000,'Тестовое начисление за месяц',NULL,NULL,NOW());

-- Покупка льготы (привяжите к существующему benefit_id)
INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
VALUES (:USER_ID,'benefit_purchase',1500,
        (SELECT balance FROM user_balance WHERE user_id=:USER_ID),
        (SELECT balance FROM user_balance WHERE user_id=:USER_ID)-1500,
        'Покупка льготы: Корпоративный фитнес',
        (SELECT id FROM benefits ORDER BY id LIMIT 1),NULL,NOW());

-- Ещё одна покупка
INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
VALUES (:USER_ID,'benefit_purchase',700,
        (SELECT balance FROM user_balance WHERE user_id=:USER_ID)-1500,
        (SELECT balance FROM user_balance WHERE user_id=:USER_ID)-1500-700,
        'Покупка льготы: Онлайн-курсы',
        (SELECT id FROM benefits ORDER BY id OFFSET 1 LIMIT 1),NULL,NOW());

-- Списание остатка (сгорание)
INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
VALUES (:USER_ID,'debit',300,
        (SELECT balance FROM user_balance WHERE user_id=:USER_ID)-2200,
        (SELECT balance FROM user_balance WHERE user_id=:USER_ID)-2500,
        'Сгорание неиспользованного остатка',NULL,NULL,NOW());

-- Обновить user_balance (пересчёт)
WITH agg AS (
  SELECT 
    SUM(CASE WHEN transaction_type IN ('monthly_allowance','credit','admin_add') THEN amount ELSE 0 END) AS earned,
    SUM(CASE WHEN transaction_type IN ('benefit_purchase','debit','admin_remove') THEN amount ELSE 0 END) AS spent
  FROM coin_transactions WHERE user_id = :USER_ID
)
INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
SELECT :USER_ID, (earned - spent), earned, spent FROM agg
ON CONFLICT (user_id) DO UPDATE
SET balance = EXCLUDED.balance,
    total_earned = EXCLUDED.total_earned,
    total_spent = EXCLUDED.total_spent,
    updated_at = NOW();`;

  res.type('text/plain').send(sql);
});

// GET/POST/PATCH /api/progress - оптимизированные endpoints
app.get('/api/progress', rateLimit, validateUser, async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    
    // Получаем прогресс пользователя
    const progressResult = await client.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [user_id]
    );
    
    // Получаем достижения пользователя через оптимизированную функцию
    const achievementsResult = await client.query(
      'SELECT * FROM get_user_achievements($1)',
      [user_id]
    );
    
    // Если прогресса нет, создаем базовый
    let progress = progressResult.rows[0];
    if (!progress) {
      await client.query(
        'INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, onboarding_completed, tour_completed) VALUES ($1, 25, 1, 1, 1, 0, 50, false, false)',
        [user_id]
      );
      
      // Добавляем достижение "Первые шаги"
      await client.query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user_id, 'first_login']
      );
      
      // Перезапрашиваем данные из БД, чтобы получить все поля включая onboarding_completed и tour_completed
      const newProgressResult = await client.query(
        'SELECT * FROM user_progress WHERE user_id = $1',
        [user_id]
      );
      progress = newProgressResult.rows[0];
    }
    
    // Гарантируем что boolean поля всегда имеют правильные значения (не NULL)
    if (progress) {
      progress.onboarding_completed = progress.onboarding_completed === true || progress.onboarding_completed === 'true' || progress.onboarding_completed === 1 || progress.onboarding_completed === 't' || progress.onboarding_completed === 'T';
      progress.tour_completed = progress.tour_completed === true || progress.tour_completed === 'true' || progress.tour_completed === 1 || progress.tour_completed === 't' || progress.tour_completed === 'T';
    }
    
    await client.end();
    
    return res.status(200).json({ 
      progress,
      achievements: achievementsResult.rows,
      unlockedAchievements: achievementsResult.rows.filter(a => a.unlocked).map(a => a.id)
    });
    
  } catch (error) {
    console.error('Database error:', error);
    await client.end();
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/progress', rateLimit, validateProgress, async (req, res) => {
  const { user_id, xp_to_add, action } = req.body;
  
  if (!user_id || !xp_to_add) {
    return res.status(400).json({ error: 'user_id and xp_to_add required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    
    // Получаем текущий прогресс
    const currentProgressResult = await client.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [user_id]
    );
    
    let currentProgress = currentProgressResult.rows[0];
    
    if (!currentProgress) {
      // Создаем начальный прогресс
      await client.query(
        'INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion) VALUES ($1, $2, 1, 1, 1, 0, 50)',
        [user_id, xp_to_add]
      );
      currentProgress = { xp: xp_to_add, level: 1 };
    } else {
      // Обновляем опыт
      const newXP = currentProgress.xp + xp_to_add;
      
      // Рассчитываем новый уровень
      let newLevel = 1;
      if (newXP >= 1001) newLevel = 5;
      else if (newXP >= 501) newLevel = 4;
      else if (newXP >= 301) newLevel = 3;
      else if (newXP >= 101) newLevel = 2;
      
      await client.query(
        'UPDATE user_progress SET xp = $2, level = $3, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1',
        [user_id, newXP, newLevel]
      );
      
      currentProgress = { ...currentProgress, xp: newXP, level: newLevel };
    }
    
    // Проверяем и разблокируем достижения
    const achievementsToUnlock = [];
    
    // Логика достижений
    if (action === 'profile_complete' && !achievementsToUnlock.includes('profile_complete')) {
      achievementsToUnlock.push('profile_complete');
    }
    
    if (action === 'first_benefit' && !achievementsToUnlock.includes('first_benefit')) {
      achievementsToUnlock.push('first_benefit');
    }
    
    if (currentProgress.xp >= 300 && !achievementsToUnlock.includes('streak_week')) {
      achievementsToUnlock.push('streak_week');
    }
    
    // Разблокируем достижения
    for (const achievementId of achievementsToUnlock) {
      await client.query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user_id, achievementId]
      );
    }
    
    await client.end();
    
    return res.status(200).json({ 
      success: true, 
      newXP: currentProgress.xp,
      newLevel: currentProgress.level,
      unlockedAchievements: achievementsToUnlock
    });
    
  } catch (error) {
    console.error('Database error:', error);
    await client.end();
    return res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/progress', async (req, res) => {
  const { user_id, field, value } = req.body;
  
  if (!user_id || !field) {
    return res.status(400).json({ error: 'user_id and field required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    
    const allowedFields = ['login_streak', 'days_active', 'benefits_used', 'profile_completion', 'onboarding_completed', 'tour_completed'];
    if (!allowedFields.includes(field)) {
      await client.end();
      return res.status(400).json({ error: 'Invalid field' });
    }
    
    // Проверяем существует ли запись user_progress для этого пользователя
    const checkProgressResult = await client.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [user_id]
    );
    
    // Если записи нет, создаем базовую запись
    if (checkProgressResult.rows.length === 0) {
      await client.query(
        'INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, onboarding_completed, tour_completed) VALUES ($1, 25, 1, 1, 1, 0, 50, false, false)',
        [user_id]
      );
      console.log(`📝 Created user_progress record for user ${user_id}`);
    }
    
    // Приводим значение к правильному типу для boolean полей
    let finalValue = value;
    if (field === 'onboarding_completed' || field === 'tour_completed') {
      // Явно приводим к boolean
      finalValue = value === true || value === 'true' || value === 1 || value === '1';
    }
    
    // Для boolean полей используем явное приведение типа в PostgreSQL
    let updateQuery;
    if (field === 'onboarding_completed' || field === 'tour_completed') {
      // Явно приводим к boolean типу в PostgreSQL
      updateQuery = `UPDATE user_progress SET ${field} = $2::boolean, last_activity = CURRENT_TIMESTAMP`;
    } else {
      updateQuery = `UPDATE user_progress SET ${field} = $2, last_activity = CURRENT_TIMESTAMP`;
    }
    const queryParams = [user_id, finalValue];
    
    if (field === 'onboarding_completed' && finalValue === true) {
      updateQuery += ', onboarding_completed_at = CURRENT_TIMESTAMP';
    }
    if (field === 'tour_completed' && finalValue === true) {
      updateQuery += ', tour_completed_at = CURRENT_TIMESTAMP';
    }
    
    // 🚀 Поддержка increment для числовых полей (кроме boolean)
    if (value === 'increment' && field !== 'onboarding_completed' && field !== 'tour_completed') {
      updateQuery = `UPDATE user_progress SET ${field} = ${field} + 1, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1`;
      await client.query(updateQuery, [user_id]);
    } else {
      updateQuery += ' WHERE user_id = $1';
      console.log(`🔄 Executing query: ${updateQuery} with params: [${user_id}, ${finalValue} (${typeof finalValue})]`);
      const result = await client.query(updateQuery, queryParams);
      
      // Проверяем что обновление прошло успешно
      if (result.rowCount === 0) {
        await client.end();
        return res.status(500).json({ error: 'Failed to update user progress' });
      }
      
      console.log(`✅ Updated ${field} to ${finalValue} for user ${user_id}`);
    }
    
    // Проверяем что значение действительно обновилось - получаем полную запись
    const checkResult = await client.query(
      `SELECT * FROM user_progress WHERE user_id = $1`,
      [user_id]
    );
    const updatedProgress = checkResult.rows[0];
    const actualValue = updatedProgress?.[field];
    
    console.log(`✅ Verified update for user ${user_id}:`);
    console.log(`   ${field} = ${actualValue} (type: ${typeof actualValue})`);
    
    await client.end();
    
    return res.status(200).json({ 
      success: true, 
      updated_value: actualValue,
      progress: updatedProgress
    });
    
  } catch (error) {
    console.error('❌ Database error in PATCH /api/progress:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      user_id,
      field,
      value
    });
    await client.end();
    return res.status(500).json({ 
      error: 'Database error',
      message: error.message
    });
  }
});

// GET/POST /api/user-benefits - точно как в api/user-benefits.js
app.get('/api/user-benefits', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  
  const client = createDbClient();
  
  try {
    await client.connect();
    const result = await client.query(
      `SELECT b.id, b.name FROM user_benefits ub
       JOIN benefits b ON ub.benefit_id = b.id
       WHERE ub.user_id = $1`,
      [user_id]
    );
    return res.status(200).json({ benefits: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/user-benefits', async (req, res) => {
  const { user_id, benefit_id } = req.body;
  if (!user_id || !benefit_id) return res.status(400).json({ error: 'user_id and benefit_id required' });
  
  const client = createDbClient();
  
  try {
    await client.connect();
    await client.query(
      'INSERT INTO user_benefits (user_id, benefit_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, benefit_id]
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/user-benefits - убрать льготу у пользователя
app.delete('/api/user-benefits', async (req, res) => {
  const { user_id, benefit_id } = req.body;
  if (!user_id || !benefit_id) return res.status(400).json({ error: 'user_id and benefit_id required' });

  const client = createDbClient();
  try {
    await client.connect();
    await client.query('DELETE FROM user_benefits WHERE user_id = $1 AND benefit_id = $2', [user_id, benefit_id]);
    await client.end();
    return res.status(200).json({ success: true });
  } catch (error) {
    await client.end();
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/clients - удален дублирующий код, теперь используется api/clients.js с Resend

// GET/PATCH /api/profile - точно как в api/profile.js
app.get('/api/profile', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });
  
  const client = createDbClient();
  
  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, name, login AS email, phone, position, avatar_url AS avatar FROM enter WHERE id = $1',
      [id]
    );
    await client.end();
    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    await client.end();
    console.error('Profile GET error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/profile', async (req, res) => {
  const { id, name, email, phone, position, avatar } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  
  const client = createDbClient();
  
  try {
    await client.connect();
    await client.query(
      'UPDATE enter SET name = $2, login = $3, phone = $4, position = $5, avatar_url = $6 WHERE id = $1',
      [id, name, email, phone, position, avatar]
    );
    const result = await client.query(
      'SELECT id, name, login AS email, phone, position, avatar_url AS avatar FROM enter WHERE id = $1',
      [id]
    );
    await client.end();
    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    await client.end();
    console.error('Profile PATCH error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/notifications - система уведомлений
app.get('/api/notifications', async (req, res) => {
  const { action, user_id, limit } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }
  
  const client = createDbClient();
  
  try {
    await client.connect();
    
    if (action === 'count') {
      const result = await client.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE (user_id = $1 OR is_global = true) AND is_read = false`,
        [user_id]
      );
      await client.end();
      return res.status(200).json({
        success: true,
        count: parseInt(result.rows[0].count)
      });
    }
    
    if (action === 'unread') {
      const result = await client.query(
        `SELECT * FROM notifications 
         WHERE (user_id = $1 OR is_global = true) AND is_read = false
         ORDER BY created_at DESC`,
        [user_id]
      );
      await client.end();
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    }
    
    // recent notifications
    const limitValue = parseInt(limit) || 10;
    const result = await client.query(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR is_global = true)
       ORDER BY created_at DESC
       LIMIT $2`,
      [user_id, limitValue]
    );
    await client.end();
    return res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    await client.end();
    console.error('Notifications error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET/POST/DELETE /api/user-recommendations
app.get('/api/user-recommendations', async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  const client = createDbClient();
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT br.benefit_id, br.priority, b.name, b.description, b.category
      FROM benefit_recommendations br
      JOIN benefits b ON br.benefit_id = b.id
      WHERE br.user_id = $1
      ORDER BY br.priority ASC
    `, [user_id]);
    
    await client.end();
    
    console.log('Loaded recommendations for user', user_id, ':', result.rows);
    
    res.status(200).json({ 
      recommendations: result.rows,
      hasRecommendations: result.rows.length > 0 
    });
  } catch (error) {
    await client.end();
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.post('/api/user-recommendations', async (req, res) => {
  const { user_id, benefit_ids, answers } = req.body;
  
  if (!user_id || !benefit_ids || !Array.isArray(benefit_ids)) {
    return res.status(400).json({ error: 'Invalid data format. Expected user_id and benefit_ids array.' });
  }
  
  const client = createDbClient();
  
  try {
    await client.connect();
    
    // Удаляем старые рекомендации пользователя
    await client.query(
      'DELETE FROM benefit_recommendations WHERE user_id = $1',
      [user_id]
    );
    
    // Сохраняем новые рекомендации
    console.log('Saving benefit recommendations for user:', user_id);
    console.log('Benefit IDs array:', benefit_ids);
    
    for (let i = 0; i < benefit_ids.length; i++) {
      const benefitId = benefit_ids[i];
      
      console.log(`Saving recommendation ${i + 1}: benefit_id=${benefitId}, priority=${i + 1}`);
      
      await client.query(
        'INSERT INTO benefit_recommendations (user_id, benefit_id, priority, answers) VALUES ($1, $2, $3, $4)',
        [user_id, benefitId, i + 1, JSON.stringify(answers)]
      );
    }
    
    await client.end();
    console.log('All benefit recommendations saved successfully');
    
    res.status(200).json({ success: true });
  } catch (error) {
    await client.end();
    console.error('Error saving benefit recommendations:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.delete('/api/user-recommendations', async (req, res) => {
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  const client = createDbClient();
  
  try {
    await client.connect();
    await client.query(
      'DELETE FROM benefit_recommendations WHERE user_id = $1',
      [user_id]
    );
    await client.end();
    
    res.status(200).json({ success: true });
  } catch (error) {
    await client.end();
    console.error('Error deleting benefit recommendations:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// GET /api/check-password-hash - проверка статуса хеширования паролей
app.get('/api/check-password-hash', async (req, res) => {
  const { login } = req.query;
  
  if (!login) {
    return res.status(400).json({ error: 'login parameter required' });
  }

  const client = createDbClient();

  try {
    const result = await client.query(
      'SELECT password FROM enter WHERE login = $1',
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const password = result.rows[0].password;
    const isHashed = password && password.startsWith('$2');
    
    return res.status(200).json({ 
      isHashed,
      passwordLength: password ? password.length : 0,
      hashType: isHashed ? 'bcrypt' : 'plaintext'
    });
    
  } catch (error) {
    console.error('Password hash check error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// API отзывов
app.get('/api/feedback', async (req, res) => {
  const { action, user_id, page = 1, limit = 10 } = req.query;
  const client = createDbClient();

  try {
    await client.connect();

    if (action === 'check-user') {
      if (!user_id) {
        return res.status(400).json({ success: false, error: 'user_id is required' });
      }

      const result = await client.query(`
        SELECT id, rating, comment, created_at 
        FROM feedback 
        WHERE user_id = $1::text
      `, [String(user_id)]);

      return res.json({
        success: true,
        hasSubmitted: result.rows.length > 0,
        feedback: result.rows[0] || null
      });
    }

    if (action === 'recent') {
      const result = await client.query(`
        SELECT f.id, f.user_id, f.rating, f.comment, f.created_at,
               e.name as user_name, e.position, e.avatar_url as avatar
        FROM feedback f
        LEFT JOIN enter e ON e.id::text = f.user_id
        ORDER BY f.created_at DESC
        LIMIT 5
      `);

      return res.json({
        success: true,
        data: result.rows
      });
    }

    // Получение всех отзывов с пагинацией
    const offset = (page - 1) * limit;
    const result = await client.query(`
      SELECT f.id, f.user_id, f.rating, f.comment, f.created_at,
             e.name as user_name, e.position, e.avatar_url as avatar
      FROM feedback f
      LEFT JOIN enter e ON e.id::text = f.user_id
      ORDER BY f.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    const countResult = await client.query('SELECT COUNT(*) as total FROM feedback');
    const total = parseInt(countResult.rows[0].total);

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database error'
    });
  } finally {
    await client.end();
  }
});

app.post('/api/feedback', async (req, res) => {
  const { user_id, rating, comment } = req.body;

  if (!user_id || !rating || !comment) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id, rating и comment обязательны' 
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ 
      success: false, 
      error: 'Рейтинг должен быть от 1 до 5' 
    });
  }

  const client = createDbClient();
  try {
    await client.connect();
    
    // Проверяем, есть ли уже отзыв
    const existingCheck = await client.query(`
      SELECT id FROM feedback WHERE user_id = $1
    `, [user_id]);

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Вы уже оставили отзыв'
      });
    }

    // Создаем новый отзыв
    const result = await client.query(`
      INSERT INTO feedback (user_id, rating, comment, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, created_at
    `, [user_id, rating, comment]);

    return res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        user_id,
        rating,
        comment,
        created_at: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database error'
    });
  } finally {
    await client.end();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Подключаем AI API
app.use('/api/ai', aiRouter);

// Подключаем отдельные AI endpoints
app.use('/api/ai-preferences', aiPreferencesHandler);
app.use('/api/recommendations-feedback', recommendationsFeedbackHandler);

// Подключаем API продуктивности
app.use('/api/productivity', productivityRouter);

// Подключаем cron задачи
app.use('/api/cron', cronRouter);

// Подключаем API новостей
app.use('/api/news', newsRouter);

// Подключаем API клиентов
app.use('/api/clients', clientsRouter);

// === Раздача статики фронта (ПОСЛЕ всех API роутов, ПЕРЕД SPA fallback) ===
// Статические файлы (CSS, JS, изображения и т.д.) раздаются из папки dist
app.use(express.static(path.join(__dirname, 'dist'), {
  // fallthrough: true по умолчанию - если файл не найден, передаем управление дальше
  index: false // Не используем index.html автоматически для директорий
}));

// Раздача файлов из public (для доступа к backup_full1.sql и другим файлам)
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    // Устанавливаем правильный MIME тип для SQL файлов
    if (filePath.endsWith('.sql')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline');
    }
    // Для PDF файлов
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
  },
  dotfiles: 'allow', // Разрешаем доступ к файлам, начинающимся с точки
  extensions: ['html', 'htm', 'json', 'xml', 'txt', 'sql', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'css', 'js']
}));

// Раздача логотипов из public/logos
app.use('/logos', express.static(path.join(__dirname, 'public/logos'), {
  maxAge: '1y', // Кэширование на год
  etag: true
}));

// === SPA fallback: отдавать index.html для всех не-API маршрутов ===
// ВАЖНО: Этот middleware должен быть ПОСЛЕДНИМ, после всех API роутов и статики
app.use((req, res, next) => {
  // Пропускаем только API запросы - они уже обработаны выше
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Пропускаем статические файлы (с расширениями) - они обрабатываются express.static выше
  // Если express.static не нашел файл, он передаст управление сюда
  if (req.path.includes('.') && !req.path.endsWith('/')) {
    // Это статический файл, но он не найден - возвращаем 404
    return res.status(404).send('File not found');
  }
  
  // Для всех остальных запросов (включая /preferences, /dashboard и т.д.) отдаем index.html
  const indexPath = join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log(`📄 SPA fallback: отдаем index.html для ${req.path}`);
    return res.sendFile(indexPath);
  }
  
  console.error(`❌ SPA fallback: index.html не найден по пути ${indexPath}`);
  return res.status(404).send('Build not found. Run the frontend build to serve the SPA.');
});

// Запуск сервера
const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Local backend server running on http://localhost:${PORT}`);
  
  // 🔍 Показываем правильную информацию о подключении к БД
  const connectionString = process.env.PG_CONNECTION_STRING || '';
  try {
    const url = new URL(connectionString);
    console.log(`📊 Database: Host=${url.hostname} Port=${url.port || '5432'} DB=${url.pathname.replace('/', '')}`);
  } catch {
    console.log('📊 Database: DSN present');
  }
  
  console.log(`🤖 AI API: Available at /api/ai`);
  console.log(`📰 News API: Available at /api/news`);
  console.log(`👤 Profile API: Available at /api/profile`);
  console.log(`📢 Notifications API: Available at /api/notifications`);
  console.log(`🎯 Recommendations API: Available at /api/user-recommendations`);
  
  // Уведомляем PM2, что приложение готово (для wait_ready)
  if (process.send) {
    process.send('ready');
  }
});

// Обработка ошибок сервера
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('💡 Решение:');
    console.error('   1. Проверьте процессы PM2: pm2 list');
    console.error('   2. Остановите все: pm2 stop all && pm2 delete all');
    console.error(`   3. Или найдите процесс на порту ${PORT}: lsof -i :${PORT} или netstat -tulpn | grep ${PORT}`);
    console.error('   4. Убейте процесс: kill -9 <PID>');
    // Завершаем процесс с кодом ошибки, чтобы PM2 не перезапускал бесконечно
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    // Для других ошибок не завершаем процесс, пусть PM2 решает
  }
});

// Предотвращаем преждевременное завершение процесса
// PM2 сам управляет жизненным циклом, не нужно обрабатывать сигналы
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Не завершаем процесс, пусть PM2 решает
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Не завершаем процесс, пусть PM2 решает
}); 