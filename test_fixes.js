import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Тестовые данные
const testUser = {
  login: 'test@example.com',
  password: 'test123'
};

const testActivity = {
  user_id: 1,
  year: 2024,
  month: 12
};

const testProgress = {
  user_id: 1,
  xp_to_add: 50,
  action: 'test_action'
};

// Функция для тестирования endpoints
async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`🧪 Тестируем ${name}...`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name}: УСПЕХ (${response.status})`);
      console.log(`   Ответ:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
    } else {
      console.log(`❌ ${name}: ОШИБКА (${response.status})`);
      console.log(`   Ошибка:`, data.error || data);
    }
  } catch (error) {
    console.log(`💥 ${name}: ИСКЛЮЧЕНИЕ`);
    console.log(`   Ошибка:`, error.message);
  }
  console.log('');
}

// Основные тесты
async function runTests() {
  console.log('🚀 ЗАПУСК ТЕСТОВ ИСПРАВЛЕНИЙ YODDLE\n');
  
  // Тест 1: Проверка доступности сервера
  await testEndpoint('Сервер доступен', `${BASE_URL}/api/benefits`);
  
  // Тест 2: Валидация входа (должна вернуть ошибку валидации)
  await testEndpoint('Валидация входа (пустые данные)', `${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: '', password: '' })
  });
  
  // Тест 3: Валидация активности (должна вернуть ошибку валидации)
  await testEndpoint('Валидация активности (без user_id)', `${BASE_URL}/api/activity`);
  
  // Тест 4: Валидация прогресса (должна вернуть ошибку валидации)
  await testEndpoint('Валидация прогресса (неверные данные)', `${BASE_URL}/api/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 'invalid', xp_to_add: -10 })
  });
  
  // Тест 5: Корректные данные для активности
  await testEndpoint('Активность (корректные данные)', `${BASE_URL}/api/activity?user_id=1&year=2024&month=12`);
  
  // Тест 6: Корректные данные для прогресса
  await testEndpoint('Прогресс (корректные данные)', `${BASE_URL}/api/progress?user_id=1`);
  
  console.log('🎯 ТЕСТЫ ЗАВЕРШЕНЫ');
  console.log('\n📊 РЕЗУЛЬТАТЫ:');
  console.log('- Если видите ошибки валидации - это хорошо!');
  console.log('- Если сервер отвечает - исправления работают');
  console.log('- Если есть ошибки БД - нужно применить SQL файлы');
}

// Запуск тестов
runTests().catch(console.error); 