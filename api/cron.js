// ===================================================================
// ЕЖЕМЕСЯЧНОЕ ОБНУЛЕНИЕ РЕЙТИНГА ПРОДУКТИВНОСТИ
// ===================================================================
// API endpoint для ручного запуска обнуления рейтинга
// Также можно настроить автоматический запуск через cron на сервере
// ===================================================================

import express from 'express';
import { getDbClient } from '../db.js';

const router = express.Router();

// POST /api/cron/reset-monthly-rating - Обнуление рейтинга всех пользователей
router.post('/reset-monthly-rating', async (req, res) => {
  try {
    console.log('🔄 Запуск ежемесячного обнуления рейтинга продуктивности...');
    
    // Проверяем, что это первый день месяца
    const today = new Date();
    const isFirstDayOfMonth = today.getDate() === 1;
    
    if (!isFirstDayOfMonth && !req.body.force) {
      return res.json({
        success: false,
        message: 'Обнуление рейтинга выполняется только в первый день месяца. Используйте force=true для принудительного запуска.',
        currentDate: today.toISOString().split('T')[0]
      });
    }
    
    // Вызываем SQL функцию для обнуления рейтинга
    const db = getDbClient();
    const result = await db.query('SELECT * FROM reset_monthly_productivity_rating()');
    
    const resetCount = result.rows.length;
    console.log(`✅ Рейтинг продуктивности обнулен для ${resetCount} пользователей`);
    
    res.json({
      success: true,
      message: `Рейтинг продуктивности успешно обнулен для ${resetCount} пользователей`,
      resetCount: resetCount,
      resetDate: today.toISOString().split('T')[0],
      details: result.rows
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обнулении рейтинга:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обнулении рейтинга продуктивности',
      error: error.message
    });
  }
});

export default router;
