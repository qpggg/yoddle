import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  const connection = await mysql.createConnection({
    host: 'trolley.proxy.rlwy.net',
    port: 14844,
    user: 'root',
    password: 'gtilMfFIVILpoykuGSvRmFfTzpoFjSxq',
    database: 'railway'
  });

  const [rows] = await connection.execute(
    'SELECT * FROM enter WHERE login = ? AND password = ?',
    [login, password]
  );
  await connection.end();

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid login or password' });
  }

  return res.status(200).json({ success: true, user: rows[0] });
} 