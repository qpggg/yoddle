import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, login, password, phone, position } = req.body;
  
  if (!name || !login || !password) {
    return res.status(400).json({ error: 'Name, login and password required' });
  }

  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Проверяем, существует ли пользователь с таким логином
    const existingUser = await client.query(
      'SELECT id FROM enter WHERE login = $1',
      [login]
    );

    if (existingUser.rows.length > 0) {
      await client.end();
      return res.status(400).json({ error: 'User with this login already exists' });
    }

    // Хешируем пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем нового пользователя
    const result = await client.query(
      'INSERT INTO enter (name, login, password, phone, position) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, login AS email, phone, position, avatar_url AS avatar',
      [name, login, hashedPassword, phone || null, position || null]
    );

    await client.end();

    return res.status(201).json({ 
      success: true, 
      user: result.rows[0],
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
} 