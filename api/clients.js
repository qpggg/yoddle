import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(
      'INSERT INTO clients (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );
    await client.end();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка базы данных:', error);
    return res.status(500).json({ error: 'Ошибка базы данных' });
  }
} 