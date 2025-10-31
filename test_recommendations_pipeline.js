/**
 * Тестовый скрипт для проверки полного пайплайна умных рекомендаций
 * 1. Добавление свободных предпочтений
 * 2. Генерация рекомендаций через Claude
 * 3. Получение из БД с объяснениями
 * 4. Проверка данных для фронта
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/ai';
const TEST_USER_ID = 999; // Тестовый пользователь

async function testRecommendationsPipeline() {
  console.log('🚀 === ТЕСТ ПАЙПЛАЙНА УМНЫХ РЕКОМЕНДАЦИЙ ===\n');
  
  try {
    // Шаг 1: Сохранение свободных предпочтений
    console.log('📝 Шаг 1: Сохранение свободных предпочтений...');
    
    const preferencesPayload = {
      user_id: TEST_USER_ID,
      free_text: 'Хочу онлайн-психолога, предпочитаю индивидуальные консультации, избегаю групповых занятий',
      tags: ['психология', 'онлайн', 'индивидуальные'],
      avoid: ['групповые занятия', 'массаж', 'спорт'],
      constraints: {
        format: 'online',
        budget: 'medium',
        time: 'evening'
      }
    };
    
    const prefsResponse = await fetch(`${BASE_URL}/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferencesPayload)
    });
    
    const prefsResult = await prefsResponse.json();
    console.log('✅ Предпочтения сохранены:', prefsResult);
    
    if (!prefsResult.success) {
      throw new Error('Ошибка сохранения предпочтений');
    }
    
    // Шаг 2: Генерация рекомендаций через Claude
    console.log('\n🤖 Шаг 2: Генерация рекомендаций через Claude...');
    
    const generateResponse = await fetch(`${BASE_URL}/recommendations/generate?variant=hybrid_v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: TEST_USER_ID
      })
    });
    
    const generateResult = await generateResponse.json();
    console.log('✅ Генерация завершена:', generateResult);
    
    if (!generateResult.success) {
      throw new Error('Ошибка генерации рекомендаций');
    }
    
    // Шаг 3: Получение рекомендаций из БД
    console.log('\n📥 Шаг 3: Получение рекомендаций из БД...');
    
    const getResponse = await fetch(`${BASE_URL}/recommendations?user_id=${TEST_USER_ID}`);
    const recommendations = await getResponse.json();
    
    console.log('✅ Рекомендации получены:', JSON.stringify(recommendations, null, 2));
    
    // Шаг 4: Проверка структуры данных для фронта
    console.log('\n🔍 Шаг 4: Валидация данных для фронта...');
    
    const checks = [
      { name: 'hasRecommendations', value: recommendations.hasRecommendations, expected: true },
      { name: 'variant', value: recommendations.variant, expected: 'hybrid_v1' },
      { name: 'recommendations array', value: Array.isArray(recommendations.recommendations), expected: true },
      { name: 'recommendations count', value: recommendations.recommendations?.length > 0, expected: true }
    ];
    
    checks.forEach(check => {
      const status = check.value === check.expected ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.value}`);
    });
    
    // Проверяем первую рекомендацию
    if (recommendations.recommendations?.length > 0) {
      const firstRec = recommendations.recommendations[0];
      console.log('\n📋 Структура первой рекомендации:');
      console.log(`  - benefit_id: ${firstRec.benefit_id}`);
      console.log(`  - name: ${firstRec.name}`);
      console.log(`  - category: ${firstRec.category}`);
      console.log(`  - confidence: ${firstRec.confidence}`);
      console.log(`  - explanations: ${JSON.stringify(firstRec.explanations)}`);
      console.log(`  - score_breakdown: ${JSON.stringify(firstRec.score_breakdown)}`);
    }
    
    // Шаг 5: Тест фидбека
    console.log('\n💬 Шаг 5: Тест отправки фидбека...');
    
    if (recommendations.recommendations?.length > 0) {
      const feedbackPayload = {
        user_id: TEST_USER_ID,
        benefit_id: recommendations.recommendations[0].benefit_id,
        label: 'useful',
        reason: 'отлично подходит',
        context: { source: 'test_script', test_run: new Date().toISOString() }
      };
      
      const feedbackResponse = await fetch(`${BASE_URL}/recommendations/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload)
      });
      
      const feedbackResult = await feedbackResponse.json();
      console.log('✅ Фидбек отправлен:', feedbackResult);
    }
    
    console.log('\n🎉 === ТЕСТ ЗАВЕРШЁН УСПЕШНО ===');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА В ТЕСТЕ:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Запуск теста
if (require.main === module) {
  testRecommendationsPipeline();
}

module.exports = { testRecommendationsPipeline };















