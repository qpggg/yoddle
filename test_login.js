import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Тестовые данные для входа
const testCredentials = [
  { login: 'admin@gmail.com', password: 'admin' },
  { login: 'test@gmail.com', password: 'test' }
];

async function testLogin(credentials) {
  try {
    console.log(`🧪 Тестируем вход для: ${credentials.login}`);
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ УСПЕШНЫЙ ВХОД для ${credentials.login}`);
      console.log(`   Пользователь: ${data.user.name}`);
      console.log(`   Должность: ${data.user.position}`);
    } else {
      console.log(`❌ ОШИБКА ВХОДА для ${credentials.login}`);
      console.log(`   Статус: ${response.status}`);
      console.log(`   Ошибка: ${data.error}`);
    }
  } catch (error) {
    console.log(`💥 ИСКЛЮЧЕНИЕ при входе для ${credentials.login}:`);
    console.log(`   Ошибка: ${error.message}`);
  }
  console.log('');
}

async function runLoginTests() {
  console.log('🔐 ТЕСТИРОВАНИЕ ВХОДА В СИСТЕМУ\n');
  
  // Ждем немного, чтобы сервер запустился
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  for (const credentials of testCredentials) {
    await testLogin(credentials);
  }
  
  console.log('🎯 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
  console.log('\n📋 РЕЗУЛЬТАТЫ:');
  console.log('- Если вход успешен - система работает с хешированными паролями');
  console.log('- Если ошибка - нужно проверить логику проверки паролей');
}

// Запуск тестов
runLoginTests().catch(console.error); 