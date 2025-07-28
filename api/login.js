import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Сначала получаем пользователя по логину
    const userResult = await client.query(
      'SELECT id, name, login AS email, phone, position, avatar_url AS avatar, password FROM enter WHERE login = $1',
      [login]
    );
    
    await client.end();

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }
    
    // Проверяем пароль (если он хеширован) или сравниваем напрямую (временно)
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
  }
} 