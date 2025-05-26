import { Client } from 'pg';

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  if (req.method === 'PATCH') {
    // Обновление профиля
    // Для form-data используем req.body (если Vercel поддерживает), иначе req.body как объект
    const isFormData = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data');
    let id, name, email, phone, position, avatar;
    if (isFormData) {
      // Vercel не парсит form-data автоматически, нужен сторонний парсер (например, formidable)
      // Для простоты: если не работает, используйте JSON на фронте
      return res.status(400).json({ error: 'FormData не поддерживается, отправьте JSON' });
    } else {
      ({ id, name, email, phone, position, avatar } = req.body);
    }
    try {
      await client.connect();
      await client.query(
        'UPDATE enter SET name = $2, login = $3, phone = $5, position = $6, avatar_url = $7 WHERE id = $1',
        [id, name, email, null, phone, position, avatar]
      );
      const result = await client.query(
        'SELECT id, name, login AS email, phone, position, avatar_url AS avatar FROM enter WHERE id = $1',
        [id]
      );
      await client.end();
      return res.status(200).json({ user: result.rows[0] });
    } catch (error) {
      await client.end();
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'GET') {
    // Получение профиля
    const { id } = req.query;
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
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 