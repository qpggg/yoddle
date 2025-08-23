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
    console.log('📊 Stats request for user:', userId);
    
    // Пока возвращаем mock данные
    const mockStats = {
      current_score: 7.8,
      current_level: 'Стажер',
      current_tier: 'silver',
      xp_multiplier: 1.1,
      weekly_average: 7.5,
      monthly_average: 7.2,
      mood_stability: 0.8,
      energy_consistency: 0.7,
      stress_management: 0.6,
      total_achievements: 8,
      productivity_achievements: 3
    };
    
    console.log('📊 Returning mock stats:', mockStats);
    
    res.json({
      success: true,
      stats: mockStats
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
    console.log('📊 Dashboard request for user:', userId);
    
    // Пока возвращаем mock данные, пока не создана таблица productivity_dashboard
    const mockDashboard = {
      user_id: parseInt(userId),
      user_name: 'Пользователь',
      productivity_score: 7.8,
      productivity_level: 'Стажер',
      productivity_tier: 'silver',
      xp_multiplier: 1.1,
      level_icon: '🚀',
      level_color: '#4682B4',
      level_description: 'Стабильный прогресс',
      weekly_productivity: 7.5,
      monthly_productivity: 7.2,
      mood_stability: 0.8,
      energy_consistency: 0.7,
      stress_management: 0.6,
      daily_entries_count: 2,
      weekly_entries_count: 12,
      days_tracked_this_week: 5,
      productivity_achievements_count: 3
    };
    
    console.log('📊 Returning mock dashboard data:', mockDashboard);
    
    res.json({
      success: true,
      dashboard: mockDashboard
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
    console.log('📊 Progress request for user:', userId);
    
    // Пока возвращаем mock данные
    const mockProgress = {
      user_id: parseInt(userId),
      user_name: 'Пользователь',
      xp: 1250,
      level: 3,
      productivity_score: 7.8,
      productivity_level: 'Стажер',
      productivity_tier: 'silver',
      xp_multiplier: 1.1,
      level_icon: '🚀',
      level_color: '#4682B4',
      progress_percentage: 78,
      next_level: 'Специалист',
      score_to_next_level: 2.2
    };
    
    console.log('📊 Returning mock progress data:', mockProgress);
    
    res.json({
      success: true,
      progress: mockProgress
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
    console.log('🏆 Achievements request for user:', userId);
    
    // Пока возвращаем mock данные
    const mockAchievements = [
      {
        code: 'mood_master',
        name: 'Мастер настроения',
        description: 'Записывал настроение 7 дней подряд',
        category: 'mood',
        xp_reward: 100,
        icon: '😊',
        tier: 'bronze',
        unlocked: true,
        unlocked_at: '2024-12-20T10:00:00Z'
      },
      {
        code: 'consistency',
        name: 'Стабильность',
        description: 'Поддерживал продуктивность выше 7.0 неделю',
        category: 'productivity',
        xp_reward: 150,
        icon: '📈',
        tier: 'silver',
        unlocked: true,
        unlocked_at: '2024-12-19T15:30:00Z'
      },
      {
        code: 'energy_boost',
        name: 'Энерджайзер',
        description: 'Достиг высокого уровня энергии 5 дней подряд',
        category: 'energy',
        xp_reward: 200,
        icon: '⚡',
        tier: 'gold',
        unlocked: false
      },
      {
        code: 'stress_master',
        name: 'Антистресс',
        description: 'Управлял стрессом на уровне ниже 3.0 неделю',
        category: 'stress',
        xp_reward: 250,
        icon: '🧘',
        tier: 'platinum',
        unlocked: false
      }
    ];
    
    console.log('🏆 Returning mock achievements:', mockAchievements.length);
    
    res.json({
      success: true,
      achievements: mockAchievements
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
    console.log('📊 Weekly data request for user:', userId);
    
    // Пока возвращаем mock данные
    const mockWeeklyData = [
      {
        date: '2024-12-20',
        final_score: 8.2,
        mood_component: 7.8,
        activity_component: 8.5,
        quality_multiplier: 0.9,
        platform_activity_coefficient: 1.0,
        mood_entries_count: 2,
        activity_entries_count: 1
      },
      {
        date: '2024-12-19',
        final_score: 7.9,
        mood_component: 7.5,
        activity_component: 8.2,
        quality_multiplier: 0.8,
        platform_activity_coefficient: 1.0,
        mood_entries_count: 1,
        activity_entries_count: 2
      },
      {
        date: '2024-12-18',
        final_score: 8.1,
        mood_component: 8.0,
        activity_component: 8.1,
        quality_multiplier: 1.0,
        platform_activity_coefficient: 1.0,
        mood_entries_count: 2,
        activity_entries_count: 1
      }
    ];
    
    console.log('📊 Returning mock weekly data:', mockWeeklyData.length, 'days');
    
    res.json({
      success: true,
      weeklyData: mockWeeklyData
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
