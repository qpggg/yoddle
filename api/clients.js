import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { name, email, company, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Имя, email и сообщение обязательны' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Yoddle <noreply@yoddle.ru>',
      to: ['your-email@gmail.com'], // Замените на ваш Gmail
      subject: `Новая заявка от ${name} - Yoddle`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 12px;">
          <div style="background-color: #750000; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎯 Новая заявка с Yoddle</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2C3E50; margin-top: 0;">📋 Детали заявки</h2>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #750000;">👤 Имя:</strong>
              <span style="color: #2C3E50; margin-left: 10px;">${name}</span>
            </div>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #750000;">📧 Email:</strong>
              <span style="color: #2C3E50; margin-left: 10px;">${email}</span>
            </div>
            
            ${company ? `
            <div style="margin-bottom: 20px;">
              <strong style="color: #750000;">🏢 Компания:</strong>
              <span style="color: #2C3E50; margin-left: 10px;">${company}</span>
            </div>
            ` : ''}
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #750000;">💬 Сообщение:</strong>
              <div style="color: #2C3E50; margin-top: 10px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #750000;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745;">
              <strong style="color: #28a745;">✅ Заявка получена</strong>
              <p style="margin: 5px 0 0 0; color: #155724;">Пожалуйста, свяжитесь с клиентом в ближайшее время.</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center; color: #6C757D; font-size: 14px;">
              <p>Это письмо отправлено автоматически с сайта <a href="https://yoddle.ru" style="color: #750000;">yoddle.ru</a></p>
              <p>Время отправки: ${new Date().toLocaleString('ru-RU')}</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Ошибка отправки письма:', error);
      return res.status(500).json({ error: 'Ошибка отправки письма' });
    }

    console.log('✅ Письмо успешно отправлено:', data);
    return res.status(200).json({ success: true, message: 'Письмо отправлено успешно' });
    
  } catch (error) {
    console.error('Ошибка отправки письма:', error);
    return res.status(500).json({ error: 'Ошибка отправки письма' });
  }
} 