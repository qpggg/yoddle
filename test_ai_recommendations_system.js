import fetch from 'node-fetch';
import { Pool } from 'pg';

// 🧪 КОМПЛЕКСНЫЙ ТЕСТ AI СИСТЕМЫ РЕКОМЕНДАЦИЙ
console.log('🚀 Запуск тестирования AI системы рекомендаций...\n');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 1;

// Создаем подключение к БД для проверки данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://f1111323_yoddle:Nei3wmOK@localhost:6543/supa_full?sslmode=disable',
  ssl: false
});

// 🎯 Утилиты для тестирования
const logSection = (title) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔍 ${title.toUpperCase()}`);
  console.log(`${'='.repeat(50)}`);
};

const logResult = (success, message, data = null) => {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${message}`);
  if (data && typeof data === 'object') {
    console.log('📊 Данные:', JSON.stringify(data, null, 2));
  }
};

const makeRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// 🧪 ТЕСТ 1: Проверка наличия тестовых данных
async function testDatabaseSetup() {
  logSection('Проверка базы данных');
  
  try {
    // Проверяем пользователя
    const userCheck = await pool.query('SELECT id, login, name FROM enter WHERE id = $1', [TEST_USER_ID]);
    logResult(userCheck.rows.length > 0, `Пользователь ${TEST_USER_ID} найден`, userCheck.rows[0]);

    // Проверяем льготы
    const benefitsCheck = await pool.query('SELECT COUNT(*) as count FROM benefits');
    const benefitsCount = parseInt(benefitsCheck.rows[0].count);
    logResult(benefitsCount > 0, `Льготы в БД: ${benefitsCount} штук`);

    // Проверяем AI сигналы
    const signalsCheck = await pool.query('SELECT COUNT(*) as count FROM ai_signals WHERE user_id = $1', [TEST_USER_ID]);
    const signalsCount = parseInt(signalsCheck.rows[0].count);
    logResult(signalsCount >= 0, `AI сигналы пользователя: ${signalsCount} записей`);

    return benefitsCount > 0;
  } catch (error) {
    logResult(false, `Ошибка проверки БД: ${error.message}`);
    return false;
  }
}

// 🧪 ТЕСТ 2: Добавление тестовых предпочтений
async function testSavePreferences() {
  logSection('Сохранение свободных предпочтений');
  
  const preferences = {
    user_id: TEST_USER_ID,
    free_text: 'Хочу больше гибкости в работе, возможность работать удаленно. Интересует спорт и здоровый образ жизни.',
    tags: ['гибкость', 'удаленка', 'спорт', 'здоровье'],
    avoid: ['сверхурочные', 'жесткий график'],
    constraints: {
      format: 'Смешанный',
      budget: 'Средний',
      time: 'Гибкий график'
    }
  };

  const result = await makeRequest('/api/ai-preferences', 'POST', preferences);
  
  if (result.success) {
    logResult(true, 'Предпочтения сохранены успешно', result.data);
    return true;
  } else {
    logResult(false, `Ошибка сохранения предпочтений: ${result.error || result.data?.error}`);
    return false;
  }
}

// 🧪 ТЕСТ 3: Добавление тестовых AI сигналов
async function addTestSignals() {
  logSection('Добавление тестовых сигналов');

  try {
    // Добавляем сигналы настроения
    const moodSignals = [
      { mood: 'Хорошее', stressLevel: 3, notes: 'Продуктивный день, но немного устал' },
      { mood: 'Отличное', stressLevel: 2, notes: 'Завершил проект досрочно' },
      { mood: 'Средне', stressLevel: 5, notes: 'Много задач, мало времени' }
    ];

    for (const mood of moodSignals) {
      const insertQuery = `
        INSERT INTO ai_signals (user_id, type, data, timestamp)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(insertQuery, [
        TEST_USER_ID,
        'mood',
        JSON.stringify(mood),
        new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Случайное время за последнюю неделю
      ]);
    }

    // Добавляем сигналы активности
    const activitySignals = [
      { activity: 'Йога', category: 'Спорт', duration: 45, success: true },
      { activity: 'Программирование', category: 'Работа', duration: 120, success: true },
      { activity: 'Медитация', category: 'Релакс', duration: 15, success: false }
    ];

    for (const activity of activitySignals) {
      const insertQuery = `
        INSERT INTO ai_signals (user_id, type, data, timestamp)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(insertQuery, [
        TEST_USER_ID,
        'activity',
        JSON.stringify(activity),
        new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      ]);
    }

    logResult(true, `Добавлено ${moodSignals.length} сигналов настроения и ${activitySignals.length} сигналов активности`);
    return true;
  } catch (error) {
    logResult(false, `Ошибка добавления сигналов: ${error.message}`);
    return false;
  }
}

// 🧪 ТЕСТ 4: Генерация гибридных рекомендаций (Основной тест)
async function testHybridRecommendations() {
  logSection('Тест гибридных рекомендаций');
  
  const result = await makeRequest('/api/ai/recommendations/generate', 'POST', {
    user_id: TEST_USER_ID,
    variant: 'hybrid_v1'
  });

  if (result.success) {
    logResult(true, 'Гибридные рекомендации сгенерированы и сохранены успешно');
    console.log(`📊 Статус: ${result.data.success ? 'Успешно' : 'Ошибка'}`);
    console.log(`📊 Вариант: ${result.data.variant || 'Не указан'}`);
    console.log(`📊 Сохранено записей: ${result.data.saved || 0}`);
    
    // Проверим, что рекомендации действительно сохранились, запросив их
    try {
      const getResult = await makeRequest(`/api/ai/recommendations?user_id=${TEST_USER_ID}`, 'GET');
      if (getResult.success && getResult.data.recommendations) {
        const recs = getResult.data.recommendations;
        console.log(`📊 Проверка: найдено ${recs.length} сохраненных AI рекомендаций`);
        
        // Показываем первую AI рекомендацию
        const aiRec = recs.find(r => r.score_breakdown || r.explanations?.length > 0);
        if (aiRec) {
          console.log(`\n🎯 Пример AI рекомендации:`);
          console.log(`   • Название: ${aiRec.name}`);
          console.log(`   • AI Score: ${aiRec.score_breakdown?.ai_score || 'Не указано'}`);
          console.log(`   • Итоговый Score: ${aiRec.score_breakdown?.final || aiRec.score || 'Не указано'}`);
          console.log(`   • Уверенность: ${aiRec.confidence || 'Не указано'}`);
          console.log(`   • Объяснения: ${(aiRec.explanations || []).join(', ') || 'Не указано'}`);
        }
      }
    } catch (e) {
      console.log('⚠️ Не удалось проверить сохраненные рекомендации');
    }

    return result.data.success;
  } else {
    logResult(false, `Ошибка генерации гибридных рекомендаций: ${result.error || result.data?.error}`);
    console.log('📊 Полный ответ:', result);
    return false;
  }
}

// 🧪 ТЕСТ 5: Генерация персональных рекомендаций
async function testPersonalRecommendations() {
  logSection('Тест персональных рекомендаций');
  
  const result = await makeRequest('/api/ai/generate-personal-recommendations', 'POST', {
    userId: TEST_USER_ID
  });

  if (result.success) {
    logResult(true, 'Персональные рекомендации сгенерированы успешно');
    
    const recommendations = result.data.recommendations;
    console.log('\n📝 Персональные рекомендации:');
    console.log('─'.repeat(50));
    console.log(recommendations);
    console.log('─'.repeat(50));
    
    return recommendations && recommendations.length > 50; // Проверяем, что есть содержательный ответ
  } else {
    logResult(false, `Ошибка генерации персональных рекомендаций: ${result.error || result.data?.error}`);
    console.log('📊 Полный ответ:', result);
    return false;
  }
}

// 🧪 ТЕСТ 6: Получение сохраненных рекомендаций
async function testGetRecommendations() {
  logSection('Получение сохраненных рекомендаций');
  
  const result = await makeRequest(`/api/ai/recommendations?user_id=${TEST_USER_ID}`, 'GET');

  if (result.success) {
    const recommendations = result.data.recommendations || [];
    logResult(true, `Получено ${recommendations.length} сохраненных рекомендаций`);
    
    recommendations.slice(0, 2).forEach((rec, index) => {
      console.log(`\n💾 Сохраненная рекомендация ${index + 1}:`);
      console.log(`   • ID льготы: ${rec.benefit_id}`);
      console.log(`   • Приоритет: ${rec.priority}`);
      console.log(`   • Алгоритм: ${rec.algorithm_variant || 'static'}`);
      console.log(`   • Уверенность: ${rec.confidence || 'Не указано'}`);
      console.log(`   • Объяснения: ${(rec.explanations || []).join(', ') || 'Не указано'}`);
    });

    return true;
  } else {
    logResult(false, `Ошибка получения рекомендаций: ${result.error || result.data?.error}`);
    return false;
  }
}

// 🧪 ТЕСТ 7: Проверка API ключа Claude
async function testClaudeApiKey() {
  logSection('Проверка Claude API ключа');
  
  const hasKey = !!process.env.CLAUDE_API_KEY;
  logResult(hasKey, hasKey ? 'Claude API ключ найден' : 'Claude API ключ НЕ найден');
  
  if (hasKey) {
    const keyPrefix = process.env.CLAUDE_API_KEY.substring(0, 12);
    console.log(`🔑 Префикс ключа: ${keyPrefix}...`);
  } else {
    console.log('⚠️  Для работы AI нужно установить CLAUDE_API_KEY');
  }
  
  return hasKey;
}

// 🎬 ГЛАВНАЯ ФУНКЦИЯ ТЕСТИРОВАНИЯ
async function runAllTests() {
  console.log('🧪 КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ AI СИСТЕМЫ РЕКОМЕНДАЦИЙ');
  console.log('📅 Время запуска:', new Date().toLocaleString('ru-RU'));
  
  const results = {
    database: false,
    claudeKey: false,
    preferences: false,
    signals: false,
    hybridRecommendations: false,
    personalRecommendations: false,
    getRecommendations: false
  };

  try {
    // Проверяем Claude API ключ
    results.claudeKey = await testClaudeApiKey();
    
    // Проверяем базу данных
    results.database = await testDatabaseSetup();
    
    if (results.database) {
      // Добавляем тестовые данные
      results.signals = await addTestSignals();
      results.preferences = await testSavePreferences();
      
      // Тестируем AI генерацию (только если есть ключ)
      if (results.claudeKey) {
        results.hybridRecommendations = await testHybridRecommendations();
        results.personalRecommendations = await testPersonalRecommendations();
      } else {
        logSection('Пропуск AI тестов');
        console.log('⚠️  AI тесты пропущены - нет Claude API ключа');
      }
      
      // Тестируем получение данных
      results.getRecommendations = await testGetRecommendations();
    }

  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  } finally {
    await pool.end();
  }

  // Финальный отчет
  logSection('Итоговый отчет');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`📊 Пройдено тестов: ${passed}/${total} (${percentage}%)`);
  console.log('\n📋 Детализация:');
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result ? '✅' : '❌';
    const testNames = {
      database: 'База данных',
      claudeKey: 'Claude API ключ', 
      preferences: 'Сохранение предпочтений',
      signals: 'Добавление сигналов',
      hybridRecommendations: 'Гибридные рекомендации',
      personalRecommendations: 'Персональные рекомендации',
      getRecommendations: 'Получение рекомендаций'
    };
    console.log(`${icon} ${testNames[test]}`);
  });

  if (percentage >= 80) {
    console.log('\n🎉 ОТЛИЧНО! Система работает корректно');
  } else if (percentage >= 60) {
    console.log('\n⚠️  ХОРОШО! Есть некоторые проблемы');
  } else {
    console.log('\n🚨 ТРЕБУЕТ ВНИМАНИЯ! Много ошибок');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Тестирование завершено');
  console.log('='.repeat(50));
}

// Запуск тестов
runAllTests().catch(console.error);
