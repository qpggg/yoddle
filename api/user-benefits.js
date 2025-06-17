import { Client } from 'pg';

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  if (req.method === 'GET') {
    // Получить льготы пользователя
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    try {
      await client.connect();
      const result = await client.query(
        `SELECT b.id, b.name FROM user_benefits ub
         JOIN benefits b ON ub.benefit_id = b.id
         WHERE ub.user_id = $1`,
        [user_id]
      );
      await client.end();
      return res.status(200).json({ benefits: result.rows });
    } catch (error) {
      await client.end();
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'POST') {
    // Добавить льготу пользователю
    const { user_id, benefit_id } = req.body;
    if (!user_id || !benefit_id) return res.status(400).json({ error: 'user_id and benefit_id required' });
    try {
      await client.connect();
      await client.query(
        'INSERT INTO user_benefits (user_id, benefit_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user_id, benefit_id]
      );
      await client.end();
      return res.status(200).json({ success: true });
    } catch (error) {
      await client.end();
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 