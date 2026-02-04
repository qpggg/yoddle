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
    
    // Рассчитываем недельный и месячный рейтинги отдельно (если функции существуют)
    let weeklyRating = stats.rows[0]?.overall_rating || 0;
    let monthlyRating = stats.rows[0]?.overall_rating || 0;
    
    try {
      const weeklyRatingResult = await db.query(`
        SELECT calculate_weekly_rating($1) as weekly_rating
      `, [userId]);
      weeklyRating = weeklyRatingResult.rows[0]?.weekly_rating || stats.rows[0]?.overall_rating || 0;
    } catch (err) {
      console.warn('⚠️ calculate_weekly_rating не найдена, используем overall_rating');
    }
    
    try {
      const monthlyRatingResult = await db.query(`
        SELECT calculate_monthly_rating($1) as monthly_rating
      `, [userId]);
      monthlyRating = monthlyRatingResult.rows[0]?.monthly_rating || stats.rows[0]?.overall_rating || 0;
    } catch (err) {
      console.warn('⚠️ calculate_monthly_rating не найдена, используем overall_rating');
    }
    
    res.json({
      success: true,
      message: 'Настроение записано и проанализировано',
      productivityScore: productivityScore.rows[0].calculate_productivity_score,
      stats: {
        current_rating: stats.rows[0]?.overall_rating || 0,
        weekly_rating: weeklyRating,
        monthly_rating: monthlyRating,
        tracked_days: stats.rows[0]?.total_records || 0,
        achievements_count: stats.rows[0]?.total_achievements || 0,
        mood_stability: stats.rows[0]?.mood_stability || 0,
        energy_consistency: stats.rows[0]?.energy_consistency || 0,
        stress_management: stats.rows[0]?.stress_management || 0,
        xp_multiplier: stats.rows[0]?.xp_multiplier || 1.0
      }
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
    const { userId, activity, category, duration, success, success_rating, notes } = req.body;
    
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
    // Нормализуем success_rating: поддерживаем как слайдер 0-10, так и старый boolean success
    const normalizedSuccessRating = (Number.isFinite(Number(success_rating))
      ? Math.max(0, Math.min(10, Number(success_rating)))
      : (success === true ? 10 : (success === false ? 0 : 5)));

    // Рассчитываем quality_score на основе длины notes
    const qualityScore = notes && notes.length >= 30 ? 1.0 : 
                         notes && notes.length >= 20 ? 0.8 : 
                         notes && notes.length >= 10 ? 0.6 : 0.4;

    const activityResult = await db.query(`
      INSERT INTO ai_signals (
        user_id, type, notes, activity_category, duration_minutes, 
        success_rating, quality_score, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      userId,
      'activity_analysis',
      notes,
      category,
      duration,
      normalizedSuccessRating,
      qualityScore
    ]);
    
    // Автоматически рассчитываем продуктивность
    const productivityScore = await db.query(`
      SELECT calculate_productivity_score($1, CURRENT_DATE)
    `, [userId]);
    
    // Получаем обновленную статистику
    const stats = await db.query(`
      SELECT * FROM get_user_productivity_stats($1)
    `, [userId]);
    
    // Рассчитываем недельный и месячный рейтинги отдельно (если функции существуют)
    let weeklyRating = stats.rows[0]?.overall_rating || 0;
    let monthlyRating = stats.rows[0]?.overall_rating || 0;
    
    try {
      const weeklyRatingResult = await db.query(`
        SELECT calculate_weekly_rating($1) as weekly_rating
      `, [userId]);
      weeklyRating = weeklyRatingResult.rows[0]?.weekly_rating || stats.rows[0]?.overall_rating || 0;
    } catch (err) {
      console.warn('⚠️ calculate_weekly_rating не найдена, используем overall_rating');
    }
    
    try {
      const monthlyRatingResult = await db.query(`
        SELECT calculate_monthly_rating($1) as monthly_rating
      `, [userId]);
      monthlyRating = monthlyRatingResult.rows[0]?.monthly_rating || stats.rows[0]?.overall_rating || 0;
    } catch (err) {
      console.warn('⚠️ calculate_monthly_rating не найдена, используем overall_rating');
    }
    
    res.json({
      success: true,
      message: 'Активность записана и проанализирована',
      productivityScore: productivityScore.rows[0].calculate_productivity_score,
      stats: {
        current_rating: stats.rows[0]?.overall_rating || 0,
        weekly_rating: weeklyRating,
        monthly_rating: monthlyRating,
        tracked_days: stats.rows[0]?.total_records || 0,
        achievements_count: stats.rows[0]?.total_achievements || 0,
        mood_stability: stats.rows[0]?.mood_stability || 0,
        energy_consistency: stats.rows[0]?.energy_consistency || 0,
        stress_management: stats.rows[0]?.stress_management || 0,
        xp_multiplier: stats.rows[0]?.xp_multiplier || 1.0
      }
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
    
    // Проверяем существование функции
    const functionExists = await db.query(`
      SELECT 1 FROM pg_proc WHERE proname = 'get_user_productivity_stats'
    `);
    
    if (functionExists.rows.length === 0) {
      console.error('❌ Function get_user_productivity_stats does not exist');
      return res.status(500).json({
        success: false,
        message: 'Функция расчета статистики не найдена в БД'
      });
    }
    
    // Используем реальную функцию из БД
    const statsResult = await db.query(`
      SELECT * FROM get_user_productivity_stats($1)
    `, [userId]);
    
    if (statsResult.rows.length === 0) {
      console.log('📊 No stats found for user:', userId);
      // Возвращаем базовые данные если статистики нет
      return res.json({
        success: true,
        stats: {
          current_score: 0,
          current_level: 'Новичок',
          current_tier: 'bronze',
          xp_multiplier: 1.0,
          weekly_average: 0,
          monthly_average: 0,
          mood_stability: 0,
          energy_consistency: 0,
          stress_management: 0,
          total_achievements: 0,
          productivity_achievements: 0
        }
      });
    }
    
    const stats = statsResult.rows[0];
    console.log('📊 Returning real stats from DB:', stats);
    
    // Рассчитываем недельный и месячный рейтинги отдельно (если функции существуют)
    let weeklyRating = stats.overall_rating || 0;
    let monthlyRating = stats.overall_rating || 0;
    
    try {
      const weeklyRatingResult = await db.query(`
        SELECT calculate_weekly_rating($1) as weekly_rating
      `, [userId]);
      weeklyRating = weeklyRatingResult.rows[0]?.weekly_rating || stats.overall_rating || 0;
    } catch (err) {
      console.warn('⚠️ calculate_weekly_rating не найдена, используем overall_rating');
    }
    
    try {
      const monthlyRatingResult = await db.query(`
        SELECT calculate_monthly_rating($1) as monthly_rating
      `, [userId]);
      monthlyRating = monthlyRatingResult.rows[0]?.monthly_rating || stats.overall_rating || 0;
    } catch (err) {
      console.warn('⚠️ calculate_monthly_rating не найдена, используем overall_rating');
    }
    
    res.json({
      success: true,
      stats: {
        current_rating: stats.overall_rating || 0,
        weekly_rating: weeklyRating,
        monthly_rating: monthlyRating,
        tracked_days: stats.total_records || 0,
        achievements_count: stats.total_achievements || 0,
        mood_stability: stats.mood_stability || 0,
        energy_consistency: stats.energy_consistency || 0,
        stress_management: stats.stress_management || 0,
        xp_multiplier: stats.xp_multiplier || 1.0
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting productivity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики',
      error: error.message
    });
  }
});

// Минимальный дашборд по умолчанию (если БД/функции недоступны)
function getDefaultDashboard() {
  return {
    productivity_level: 'Новичок',
    level_icon: '🌱',
    level_description: 'Начинающий путь к продуктивности',
    current_score: 0,
    current_level: 'Новичок',
    current_tier: 'bronze',
    xp_multiplier: 1.0,
    weekly_average: 0,
    monthly_average: 0,
    mood_stability: 0,
    energy_consistency: 0,
    stress_management: 0,
    total_achievements: 0,
    productivity_achievements: 0,
    level: 'Новичок',
    tier: 'bronze',
    productivity_score: 0,
    weekly_productivity: 0,
    monthly_productivity: 0,
    days_tracked_this_week: 0
  };
}

// GET /api/productivity/dashboard/:userId - Данные для дашборда
router.get('/dashboard/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('📊 Dashboard request for user:', userId);

  try {
    // Проверяем существование функции
    const functionExists = await db.query(`
      SELECT 1 FROM pg_proc WHERE proname = 'get_user_productivity_stats'
    `);

    if (functionExists.rows.length === 0) {
      console.warn('⚠️ Function get_user_productivity_stats not found, returning default dashboard');
      return res.json({
        success: true,
        dashboard: getDefaultDashboard()
      });
    }

    // Используем реальную функцию из БД для получения данных дашборда
    const statsResult = await db.query(`
      SELECT * FROM get_user_productivity_stats($1)
    `, [userId]);

    if (statsResult.rows.length === 0) {
      console.log('📊 No stats found for user:', userId);
      return res.json({
        success: true,
        dashboard: getDefaultDashboard()
      });
    }

    const stats = statsResult.rows[0];
    console.log('📊 Returning dashboard data from DB function:', stats);

    const overallRating = stats.overall_rating || 0;
    const calculatedLevel = calculateLevelFromRating(overallRating);
    const calculatedTier = calculateTierFromRating(overallRating);

    let weeklyRating = overallRating;
    let monthlyRating = overallRating;

    try {
      const weeklyRatingResult = await db.query(`
        SELECT calculate_weekly_rating($1) as weekly_rating
      `, [userId]);
      weeklyRating = weeklyRatingResult.rows[0]?.weekly_rating ?? overallRating;
    } catch (err) {
      console.warn('⚠️ calculate_weekly_rating:', err.message);
    }

    try {
      const monthlyRatingResult = await db.query(`
        SELECT calculate_monthly_rating($1) as monthly_rating
      `, [userId]);
      monthlyRating = monthlyRatingResult.rows[0]?.monthly_rating ?? overallRating;
    } catch (err) {
      console.warn('⚠️ calculate_monthly_rating:', err.message);
    }

    const dashboard = {
      productivity_level: calculatedLevel,
      level_icon: getLevelIcon(calculatedLevel, calculatedTier),
      level_description: getLevelDescription(calculatedLevel),
      current_score: overallRating,
      current_level: calculatedLevel,
      current_tier: calculatedTier,
      xp_multiplier: stats.xp_multiplier || 1.0,
      weekly_average: weeklyRating,
      monthly_average: monthlyRating,
      mood_stability: stats.mood_stability || 0,
      energy_consistency: stats.energy_consistency || 0,
      stress_management: stats.stress_management || 0,
      total_achievements: stats.total_achievements || 0,
      productivity_achievements: stats.productivity_achievements || 0,
      level: calculatedLevel,
      tier: calculatedTier,
      productivity_score: overallRating,
      weekly_productivity: weeklyRating,
      monthly_productivity: monthlyRating,
      days_tracked_this_week: stats.total_records || 0
    };

    return res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('❌ Error getting dashboard:', error.message);
    // Не отдаём 500 — отдаём дефолтный дашборд, чтобы страница продуктивности не показывала блок «Ошибка загрузки»
    return res.json({
      success: true,
      dashboard: getDefaultDashboard()
    });
  }
});

// Вспомогательные функции для форматирования данных
function calculateLevelFromRating(rating) {
  if (rating >= 9.0) return 'Мастер';
  if (rating >= 8.0) return 'Эксперт';
  if (rating >= 7.0) return 'Специалист';
  if (rating >= 6.0) return 'Стажер';
  return 'Новичок';
}

function calculateTierFromRating(rating) {
  if (rating >= 9.5) return 'platinum';
  if (rating >= 8.5) return 'gold';
  if (rating >= 7.5) return 'silver';
  return 'bronze';
}

function getLevelIcon(level, tier) {
  const icons = {
    'Новичок': '🌱',
    'Стажер': '🌿',
    'Специалист': '🌳',
    'Эксперт': '🏆',
    'Мастер': '👑'
  };
  
  // Если уровень не найден, возвращаем иконку по умолчанию
  if (!icons[level]) {
    return '🌱';
  }
  
  // Возвращаем только иконку уровня без дополнительных эмодзи
  return icons[level];
}

function getLevelDescription(level) {
  const descriptions = {
    'Новичок': 'Начинающий путь к продуктивности',
    'Стажер': 'Осваиваете основы продуктивности',
    'Специалист': 'Уверенно движетесь к целям',
    'Эксперт': 'Достигли высокого уровня продуктивности',
    'Мастер': 'Владеете искусством продуктивности'
  };
  return descriptions[level] || 'Начинающий путь к продуктивности';
}

// GET /api/productivity/progress/:userId - Данные для страницы прогресса
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 Progress request for user:', userId);
    
    // Используем реальное представление из БД
    const progressResult = await db.query(`
      SELECT * FROM productivity_progress WHERE user_id = $1
    `, [userId]);
    
    if (progressResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Данные прогресса не найдены'
      });
    }
    
    const progress = progressResult.rows[0];
    console.log('📊 Returning real progress data from DB:', progress);
    
    res.json({
      success: true,
      progress: progress
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
    
    // Получаем все достижения продуктивности из БД
    const achievementsResult = await db.query(`
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
    
    const achievements = achievementsResult.rows;
    console.log('🏆 Returning real achievements from DB:', achievements.length);
    
    res.json({
      success: true,
      achievements: achievements
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
    
    // Рассчитываем недельный и месячный рейтинги отдельно (если функции существуют)
    let weeklyRating = stats.rows[0]?.overall_rating || 0;
    let monthlyRating = stats.rows[0]?.overall_rating || 0;
    
    try {
      const weeklyRatingResult = await db.query(`
        SELECT calculate_weekly_rating($1) as weekly_rating
      `, [userId]);
      weeklyRating = weeklyRatingResult.rows[0]?.weekly_rating || stats.rows[0]?.overall_rating || 0;
    } catch (err) {
      console.warn('⚠️ calculate_weekly_rating не найдена, используем overall_rating');
    }
    
    try {
      const monthlyRatingResult = await db.query(`
        SELECT calculate_monthly_rating($1) as monthly_rating
      `, [userId]);
      monthlyRating = monthlyRatingResult.rows[0]?.monthly_rating || stats.rows[0]?.overall_rating || 0;
    } catch (err) {
      console.warn('⚠️ calculate_monthly_rating не найдена, используем overall_rating');
    }
    
    res.json({
      success: true,
      message: 'Продуктивность пересчитана',
      productivityScore: productivityScore.rows[0].calculate_productivity_score,
      stats: {
        current_rating: stats.rows[0]?.overall_rating || 0,
        weekly_rating: weeklyRating,
        monthly_rating: monthlyRating,
        tracked_days: stats.rows[0]?.total_records || 0,
        achievements_count: stats.rows[0]?.total_achievements || 0,
        mood_stability: stats.rows[0]?.mood_stability || 0,
        energy_consistency: stats.rows[0]?.energy_consistency || 0,
        stress_management: stats.rows[0]?.stress_management || 0,
        xp_multiplier: stats.rows[0]?.xp_multiplier || 1.0
      }
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
    
    // Получаем реальные недельные данные из БД
    const weeklyResult = await db.query(`
      SELECT 
        date,
        final_score as rating,
        mood_component,
        activity_component,
        quality_multiplier,
        platform_activity_coefficient,
        mood_entries_count,
        activity_entries_count
      FROM productivity_scores 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY date ASC
    `, [userId]);
    
    const weeklyData = weeklyResult.rows;
    console.log('📊 Returning real weekly data from DB:', weeklyData.length, 'days');
    
    res.json({
      success: true,
      weeklyData: weeklyData
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

// GET /api/productivity/rating-chart/:userId - Данные для графика зависимости рейтинга от активностей (НАКОПИТЕЛЬНЫЙ)
router.get('/rating-chart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 14 } = req.query; // По умолчанию 14 дней
    console.log('📊 Rating vs Activities chart data request for user:', userId, 'days:', days);
    
    // Используем функцию для получения накопительного рейтинга и данных об активностях
    const chartResult = await db.query(`
      SELECT * FROM get_rating_vs_activities_chart($1, $2)
      ORDER BY date ASC
    `, [userId, days]);
    
    const chartData = chartResult.rows;
    console.log('📊 Returning cumulative rating chart data:', chartData.length, 'days');
    
    // Рассчитываем статистику
    const ratings = chartData.map(d => parseFloat(d.rating) || 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    
    // Статистика по активностям
    const totalActivities = chartData.reduce((sum, d) => sum + parseInt(d.total_activities || 0), 0);
    const successfulActivities = chartData.reduce((sum, d) => sum + parseInt(d.successful_activities || 0), 0);
    const failedActivities = chartData.reduce((sum, d) => sum + parseInt(d.failed_activities || 0), 0);
    
    console.log('📊 Chart data from function:', chartData.length, 'records');
    console.log('📊 Sample chart data:', chartData.slice(0, 3));
    
    res.json({
      success: true,
      chartData: chartData.map(d => ({
        date: d.date,
        rating: parseFloat(d.rating) || 0,
        total_activities: parseInt(d.total_activities) || 0,
        successful_activities: parseInt(d.successful_activities) || 0,
        failed_activities: parseInt(d.failed_activities) || 0,
        mood_records: parseInt(d.mood_records) || 0,
        activity_log_actions: parseInt(d.activity_log_actions) || 0,
        cumulative_mood_score: parseFloat(d.cumulative_mood_score) || 0,
        cumulative_activity_score: parseFloat(d.cumulative_activity_score) || 0
      })),
      stats: {
        average: parseFloat(avgRating.toFixed(2)),
        min: parseFloat(minRating.toFixed(2)),
        max: parseFloat(maxRating.toFixed(2)),
        days: chartData.length,
        total_activities: totalActivities,
        successful_activities: successfulActivities,
        failed_activities: failedActivities,
        success_rate: totalActivities > 0 ? parseFloat((successfulActivities / totalActivities * 100).toFixed(2)) : 0
      }
    });
    
  } catch (error) {
    console.error('Error getting rating chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении данных для графика',
      error: error.message
    });
  }
});

// GET /api/productivity/mood-percentages/:userId - Проценты настроения, энергии и спокойствия
router.get('/mood-percentages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 Mood percentages request for user:', userId);
    
    // Проверяем существование функций
    const functionExists = await db.query(`
      SELECT 1 FROM pg_proc WHERE proname = 'get_weekly_average_percentages'
    `);
    
    if (functionExists.rows.length === 0) {
      console.error('❌ Function get_weekly_average_percentages does not exist');
      return res.status(500).json({
        success: false,
        message: 'Функции расчета процентов не найдены в БД'
      });
    }
    
    // Получаем средние недельные проценты
    const averageResult = await db.query(`
      SELECT * FROM get_weekly_average_percentages($1)
    `, [userId]);
    
    // Получаем ежедневные проценты
    const dailyResult = await db.query(`
      SELECT * FROM get_weekly_mood_percentages($1)
    `, [userId]);
    
    if (averageResult.rows.length === 0) {
      console.log('📊 No mood percentages found for user:', userId);
      // Возвращаем базовые данные если процентов нет
      return res.json({
        success: true,
        percentages: {
          mood: 0,
          energy: 0,
          calmness: 0
        },
        dailyData: []
      });
    }
    
    const percentages = averageResult.rows[0];
    const dailyData = dailyResult.rows;
    
    console.log('📊 Returning mood percentages from DB:', percentages);
    console.log('📊 Daily data count:', dailyData.length);
    
    // Функция теперь возвращает проценты (0-100), используем их напрямую
    res.json({
      success: true,
      percentages: {
        mood: parseFloat(percentages.mood_average) || 0,
        energy: parseFloat(percentages.energy_average) || 0,
        calmness: parseFloat(percentages.calmness_average) || 0
      },
      dailyData: dailyData.map(d => ({
        date: d.date,
        day_name: d.day_name,
        mood: parseFloat(d.mood_percent) || 0,
        energy: parseFloat(d.energy_percent) || 0,
        calmness: parseFloat(d.calmness_percent) || 0
      }))
    });
    
  } catch (error) {
    console.error('❌ Error getting mood percentages:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении процентов настроения',
      error: error.message
    });
  }
});

export default router;
