import { Client } from 'pg';

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  if (req.method === 'GET') {
    try {
      await client.connect();
      const result = await client.query('SELECT id, name, description, category FROM benefits ORDER BY category, name');
      await client.end();
      return res.status(200).json({ benefits: result.rows });
    } catch (error) {
      console.error('Database error:', error);
      await client.end();
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 