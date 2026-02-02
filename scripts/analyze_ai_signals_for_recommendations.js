#!/usr/bin/env node
/**
 * Анализ ai_signals для эндпоинта generate-personal-recommendations.
 * Показывает: какие типы записей есть, откуда берутся mood/stress/success, что реально видит код.
 */
import 'dotenv/config';
import { createDbClient, closePool } from '../db.js';

const userId = process.argv[2] || '4';
const db = createDbClient();

async function main() {
  console.log('=== ai_signals: структура и данные для user_id =', userId, '===\n');

  // 1) Какие колонки есть в ai_signals
  const cols = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ai_signals' 
    ORDER BY ordinal_position
  `);
  console.log('Колонки ai_signals:', cols.rows.map(r => r.column_name).join(', '));
  console.log('');

  // 2) Количество записей по типам (все пользователи и по user_id)
  const byType = await db.query(`
    SELECT type, COUNT(*) as cnt 
    FROM ai_signals 
    WHERE user_id = $1
    GROUP BY type 
    ORDER BY cnt DESC
  `, [userId]);
  console.log('Записей по type для user_id =', userId);
  byType.rows.forEach(r => console.log('  ', r.type, ':', r.cnt));
  console.log('');

  // 3) Последние 50 записей (как в коде) — type, есть ли data, есть ли mood_rating/stress_rating/success_rating
  const last50 = await db.query(`
    SELECT id, type, 
           (data IS NOT NULL AND data::text != '{}') as has_data,
           mood_rating, energy_rating, stress_rating, success_rating,
           LEFT(data::text, 80) as data_preview,
           timestamp
    FROM ai_signals 
    WHERE user_id = $1 
    ORDER BY timestamp DESC 
    LIMIT 50
  `, [userId]);

  console.log('Последние 50 записей (как в generate-personal-recommendations):');
  console.log('type                  | has_data | mood_rating | stress_rating | success_rating | data_preview');
  console.log('-'.repeat(100));
  for (const row of last50.rows) {
    const preview = (row.data_preview || '').substring(0, 40);
    console.log(
      String(row.type).padEnd(21),
      '|', String(row.has_data).padEnd(8),
      '|', String(row.mood_rating ?? '—').padEnd(12),
      '|', String(row.stress_rating ?? '—').padEnd(13),
      '|', String(row.success_rating ?? '—').padEnd(15),
      '|', preview
    );
  }
  console.log('');

  // 4) Что видит код: только type IN ('mood','activity') и поле data
  const moodRows = last50.rows.filter(r => r.type === 'mood');
  const activityRows = last50.rows.filter(r => r.type === 'activity');
  const dailyMoodRows = last50.rows.filter(r => r.type === 'daily_mood_check');
  const activityAnalysisRows = last50.rows.filter(r => r.type === 'activity_analysis');

  console.log('Что берёт generate-personal-recommendations (filter type === "mood" / "activity", читает row.data):');
  console.log('  type=mood:          ', moodRows.length, 'записей');
  console.log('  type=activity:      ', activityRows.length, 'записей');
  console.log('Что НЕ берётся (записи с продуктивности):');
  console.log('  type=daily_mood_check:    ', dailyMoodRows.length, 'записей (mood_rating, stress_rating есть здесь)');
  console.log('  type=activity_analysis:   ', activityAnalysisRows.length, 'записей (success_rating здесь)');
  console.log('');

  // 5) Если бы считали по daily_mood_check и activity_analysis (реальные данные)
  const allMoodLike = await db.query(`
    SELECT mood_rating, stress_rating, timestamp 
    FROM ai_signals 
    WHERE user_id = $1 AND type IN ('mood', 'daily_mood_check') 
    ORDER BY timestamp DESC 
    LIMIT 50
  `, [userId]);
  const allActivityLike = await db.query(`
    SELECT success_rating, notes, activity_category, timestamp 
    FROM ai_signals 
    WHERE user_id = $1 AND type IN ('activity', 'activity_analysis') 
    ORDER BY timestamp DESC 
    LIMIT 50
  `, [userId]);

  if (allMoodLike.rows.length > 0) {
    const moods = allMoodLike.rows.map(r => r.mood_rating).filter(v => v != null);
    const stresses = allMoodLike.rows.map(r => r.stress_rating).filter(v => v != null);
    const avgMood = moods.length ? (moods.reduce((a,b) => a+b,0) / moods.length).toFixed(2) : '—';
    const avgStress = stresses.length ? (stresses.reduce((a,b) => a+b,0) / stresses.length).toFixed(2) : '—';
    console.log('Фактические данные (daily_mood_check + mood):');
    console.log('  Записей настроения:', allMoodLike.rows.length);
    console.log('  Среднее mood_rating:', avgMood, '| Среднее stress_rating:', avgStress);
    console.log('  Все mood_rating:', moods.join(', '));
    console.log('  Все stress_rating:', stresses.join(', '));
  }
  if (allActivityLike.rows.length > 0) {
    const successCount = allActivityLike.rows.filter(r => r.success_rating != null && Number(r.success_rating) >= 5).length;
    const total = allActivityLike.rows.length;
    const pct = total ? Math.round((successCount / total) * 100) : 0;
    console.log('Фактические активности (activity_analysis + activity):');
    console.log('  Записей активностей:', total);
    console.log('  Успешных (success_rating>=5):', successCount, '/', total, '=', pct + '%');
  }

  await closePool();
}

main().catch(e => { console.error(e); process.exit(1); });
