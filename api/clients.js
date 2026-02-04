import { createDbClient } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { name, email, company, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Имя, email и сообщение обязательны' });
  }

  const client = createDbClient();

  try {
    // Сохраняем заявку в базу данных
    const result = await client.query(
      `INSERT INTO clients (name, email, company, message, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id, name, email, company, message, created_at`,
      [name, email || null, company || null, message]
    );

    const savedClient = result.rows[0];

    console.log('✅ Заявка успешно сохранена в БД:', {
      id: savedClient.id,
      name: savedClient.name,
      email: savedClient.email,
      company: savedClient.company,
      created_at: savedClient.created_at
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.',
      client_id: savedClient.id
    });
    
  } catch (error) {
    console.error('❌ Ошибка сохранения заявки в БД:', error);
    
    // Если ошибка связана с дубликатом email
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'Заявка с таким email уже существует' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Ошибка сохранения заявки. Попробуйте позже.' 
    });
  } finally {
    if (client && typeof client.end === 'function') {
      await client.end();
    }
  }
} 