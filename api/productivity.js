import express from 'express';
import { Pool } from 'pg';
import { createDbClient } from '../db.js';

const router = express.Router();
const db = createDbClient();

// =====================================================
// API ДЛЯ АЛГОРИТМА ПРОДУКТИВНОСТИ
// =====================================================

// POST /api/productivity/mood-check - Проверка настроения
router.post('/mood-check', async (req, res) => {
  try {
    const { userId, mood, energy, stress, notes } = req.body;
    
    // Проверяем лимиты (максимум 3 записи настроения в день)
    const dailyLimitCheck = await db.query(`
      SELECT COUNT(*) as count 
      FROM ai_signals 
      WHERE user_id = $1 
      AND type IN ('mood', 'daily_mood_check') 
      AND DATE(timestamp) = CURRENT_DATE
    `, [userId]);
    
    if (parseInt(dailyLimitCheck.rows[0].count) >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Достигнут лимит записей настроения на сегодня (максимум 3)'
      });
    }
    
    // Проверяем интервал (минимум 8 часов между записями)
    const intervalCheck = await db.query(`
      SELECT COUNT(*) as count 
      FROM ai_signals 
      WHERE user_id = $1 
      AND type IN ('mood', 'daily_mood_check') 
      AND timestamp > NOW() - INTERVAL '8 hours'
    `, [userId]);
    
    if (parseInt(intervalCheck.rows[0].count) > 0) {
      return res.status(429).json({
        success: false,
        message: 'Подождите минимум 8 часов между записями настроения'
      });
    }
    
    // Сохраняем сигнал настроения
    const signalResult = await db.query(`
      INSERT INTO ai_signals (
        user_id, type, mood_rating, energy_rating, stress_rating, 
        notes, quality_score, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      userId, 
      'daily_mood_check', 
      mood, 
      energy, 
      stress, 
      notes,
      notes && notes.length >= 30 ? 1.0 : notes && notes.length >= 20 ? 0.8 : notes && notes.length >= 10 ? 0.6 : 0.4
    ]);
    
    // Автоматически рассчитываем продуктивность
    const productivityScore = await db.query(`
      SELECT calculate_productivity_score($1, CURRENT_DATE)
    `, [userId]);
    
    // Получаем обновленную статистику
    const stats = await db.query(`
      SELECT * FROM get_user_productivity_stats($1)
    `, [userId]);
    
    res.json({
      success: true,
      message: 'Настроение записано и проанализировано',
      productivityScore: productivityScore.rows[0].calculate_productivity_score,
      stats: stats.rows[0]
    });
    
  } catch (error) {
    console.error('Error in mood-check:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при записи настроения',
      error: error.message
    });
  }
});

// POST /api/productivity/activity-log - Логирование активности
router.post('/activity-log', async (req, res) => {
  try {
    const { userId, activity, category, duration, success, notes, mood, energy, stress } = req.body;
    
    // Проверяем общий лимит записей в день (максимум 5)
    const dailyTotalCheck = await db.query(`
      SELECT COUNT(*) as count 
      FROM ai_signals 
      WHERE user_id = $1 
      AND DATE(timestamp) = CURRENT_DATE
    `, [userId]);
    
    if (parseInt(dailyTotalCheck.rows[0].count) >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Достигнут общий лимит записей на сегодня (максимум 5)'
      });
    }
    
    // Сохраняем активность
    const activityResult = await db.query(`
      INSERT INTO ai_signals (
        user_id, type, notes, activity_category, duration_minutes, 
        success_rating, mood_rating, energy_rating, stress_rating,
        quality_score, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id
    `, [
      userId,
      'activity_analysis',
      notes,
      category,
      duration,
      success ? 10 : 1, // Успех = 10, неудача = 1
      mood,
      energy,
      stress,
      notes && notes.length >= 30 ? 1.0 : notes && notes.length >= 20 ? 0.8 : notes && notes.length >= 10 ? 0.6 : 0.4
    ]);
    
    // Автоматически рассчитываем продуктивность
    const productivityScore = await db.query(`
      SELECT calculate_productivity_score($1, CURRENT_DATE)
    `, [userId]);
    
    // Получаем обновленную статистику
    const stats = await db.query(`
      SELECT * FROM get_user_productivity_stats($1)
    `, [userId]);
    
    res.json({
      success: true,
      message: 'Активность записана и проанализирована',
      productivityScore: productivityScore.rows[0].calculate_productivity_score,
      stats: stats.rows[0]
    });
    
  } catch (error) {
    console.error('Error in activity-log:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при записи активности',
      error: error.message
    });
  }
});

// GET /api/productivity/stats/:userId - Статистика продуктивности
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await db.query(`
      SELECT * FROM get_user_productivity_stats($1)
    `, [userId]);
    
    if (stats.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    res.json({
      success: true,
      stats: stats.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting productivity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики',
      error: error.message
    });
  }
});

// GET /api/productivity/dashboard/:userId - Данные для дашборда
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const dashboardData = await db.query(`
      SELECT * FROM productivity_dashboard WHERE user_id = $1
    `, [userId]);
    
    if (dashboardData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Данные дашборда не найдены'
      });
    }
    
    res.json({
      success: true,
      dashboard: dashboardData.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении данных дашборда',
      error: error.message
    });
  }
});

// GET /api/productivity/progress/:userId - Данные для страницы прогресса
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const progressData = await db.query(`
      SELECT * FROM productivity_progress WHERE user_id = $1
    `, [userId]);
    
    if (progressData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Данные прогресса не найдены'
      });
    }
    
    res.json({
      success: true,
      progress: progressData.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting progress data:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении данных прогресса',
      error: error.message
    });
  }
});

// GET /api/productivity/achievements/:userId - Достижения продуктивности
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const achievements = await db.query(`
      SELECT 
        pa.code,
        pa.name,
        pa.description,
        pa.category,
        pa.xp_reward,
        pa.icon,
        pa.tier,
        CASE WHEN ua.user_id IS NOT NULL THEN true ELSE false END as unlocked,
        ua.unlocked_at
      FROM productivity_achievements pa
      LEFT JOIN user_achievements ua ON pa.code = ua.achievement_id AND ua.user_id = $1
      WHERE pa.is_active = true
      ORDER BY pa.tier, pa.xp_reward DESC
    `, [userId]);
    
    res.json({
      success: true,
      achievements: achievements.rows
    });
    
  } catch (error) {
    console.error('Error getting productivity achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении достижений',
      error: error.message
    });
  }
});

// POST /api/productivity/calculate/:userId - Принудительный расчет продуктивности
router.post('/calculate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.body;
    
    const targetDate = date || 'CURRENT_DATE';
    
    const productivityScore = await db.query(`
      SELECT calculate_productivity_score($1, $2)
    `, [userId, targetDate]);
    
    // Получаем обновленную статистику
    const stats = await db.query(`
      SELECT * FROM get_user_productivity_stats($1)
    `, [userId]);
    
    res.json({
      success: true,
      message: 'Продуктивность пересчитана',
      productivityScore: productivityScore.rows[0].calculate_productivity_score,
      stats: stats.rows[0]
    });
    
  } catch (error) {
    console.error('Error calculating productivity:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при расчете продуктивности',
      error: error.message
    });
  }
});

// GET /api/productivity/weekly/:userId - Недельная статистика
router.get('/weekly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const weeklyData = await db.query(`
      SELECT 
        date,
        final_score,
        mood_component,
        activity_component,
        quality_multiplier,
        platform_activity_coefficient,
        mood_entries_count,
        activity_entries_count
      FROM productivity_scores 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY date DESC
    `, [userId]);
    
    res.json({
      success: true,
      weeklyData: weeklyData.rows
    });
    
  } catch (error) {
    console.error('Error getting weekly data:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении недельных данных',
      error: error.message
    });
  }
});

export default router;
