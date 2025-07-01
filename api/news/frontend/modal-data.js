import { Client } from 'pg';

// Функция для создания клиента БД
function createDbClient() {
  const connectionString = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  return new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const client = createDbClient();
  try {
    await client.connect();
    
    const { limit = 10 } = req.query;

    const result = await client.query(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.author,
        n.publish_date as date,
        nc.name as category,
        n.image_url as image
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.status = 'published'
      ORDER BY n.is_featured DESC, n.publish_date DESC
      LIMIT $1
    `, [parseInt(limit)]);

    await client.end();

    // Форматируем данные под формат NewsModal
    const formattedData = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      date: row.date ? row.date.toISOString().split('T')[0] : null, // YYYY-MM-DD format
      author: row.author,
      category: row.category,
      image: row.image
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching modal data:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении данных для модального окна'
    });
  }
} 