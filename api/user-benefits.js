import { Pool } from 'pg';

export default async function handler(req, res) {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: process.env.PG_CONNECTION_STRING?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  if (req.method === 'GET') {
    // Получить льготы пользователя
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    try {
      const client = await pool.connect();
      const result = await client.query(
        `SELECT b.id, b.name FROM user_benefits ub
         JOIN benefits b ON ub.benefit_id = b.id
         WHERE ub.user_id = $1`,
        [user_id]
      );
      client.release();
      return res.status(200).json({ benefits: result.rows });
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'POST') {
    // Добавить льготу пользователю
    const { user_id, benefit_id } = req.body;
    if (!user_id || !benefit_id) return res.status(400).json({ error: 'user_id and benefit_id required' });
    try {
      const client = await pool.connect();
      
      // 1. Добавляем льготу
      await client.query(
        'INSERT INTO user_benefits (user_id, benefit_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user_id, benefit_id]
      );
      
      // 2. Получаем XP из activity_types для benefit_added
      const xpResult = await client.query(
        'SELECT xp_earned FROM activity_types WHERE action = $1',
        ['benefit_added']
      );
      
      const xpEarned = xpResult.rows.length > 0 ? xpResult.rows[0].xp_earned : 50;
      
      // 3. Логируем активность
      await client.query(
        'INSERT INTO activity_log (user_id, action, xp_earned, description) VALUES ($1, $2, $3, $4)',
        [user_id, 'benefit_added', xpEarned, 'Добавление льготы']
      );
      
      // 4. Обновляем XP в user_progress
      await client.query(
        `INSERT INTO user_progress (user_id, xp) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id) 
         DO UPDATE SET xp = user_progress.xp + $2`,
        [user_id, xpEarned]
      );
      
      client.release();
      return res.status(200).json({ success: true, xpEarned });
    } catch (error) {
      console.error('Error adding benefit:', error);
      return res.status(500).json({ error: 'Database error' });
    } finally {
      await pool.end();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 