import fetch from 'node-fetch';

// 🔧 НАСТРОЙКИ ДЛЯ ОСНОВНОГО СЕРВЕРА В РОССИИ
// ЗАМЕНИТЕ НА ВАШ РЕАЛЬНЫЙ URL!
const MAIN_SERVER_URL = 'http://185.185.69.254:3000'; // попробуем порт 3000
const TEST_USER = {
  login: 'test@gmail.com',
  password: 'test'
};

async function testMainServer() {
  console.log('🚀 ТЕСТ ОСНОВНОГО СЕРВЕРА В РОССИИ');
  console.log('=====================================');
  console.log(`📡 URL: ${MAIN_SERVER_URL}`);
  
  try {
    // 1. Проверяем доступность сайта
    console.log('\n📡 Проверяем доступность сайта...');
    const siteResponse = await fetch(MAIN_SERVER_URL);
    
    if (!siteResponse.ok) {
      console.log(`❌ Сайт недоступен: ${siteResponse.status}`);
      return;
    }
    
    console.log('✅ Сайт доступен!');
    
    // 2. Тестируем API логина
    console.log('\n🔐 Тестируем API логина...');
    const loginResponse = await fetch(`${MAIN_SERVER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log(`❌ Ошибка входа: ${loginResponse.status} - ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log(`✅ Вход выполнен: ${loginData.user.name}`);
    
    // 3. Тестируем геймификацию
    console.log('\n🎮 Тестируем геймификацию...');
    const gamificationResponse = await fetch(`${MAIN_SERVER_URL}/api/gamification/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: loginData.user.id })
    });
    
    if (!gamificationResponse.ok) {
      const errorText = await gamificationResponse.text();
      console.log(`❌ Ошибка геймификации: ${gamificationResponse.status} - ${errorText}`);
      return;
    }
    
    const gamificationData = await gamificationResponse.json();
    console.log(`✅ Геймификация: ${gamificationData.totalXP} XP`);
    console.log(`📊 Действий: ${gamificationData.actions}, Бонусов: ${gamificationData.bonuses}`);
    
    console.log('\n🎯 РЕЗУЛЬТАТ: Основной сервер работает!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.log('\n💡 ПОДСКАЗКА:');
    console.log('1. Проверьте правильность URL в строке 5');
    console.log('2. Убедитесь, что сервер запущен');
    console.log('3. Проверьте доступность из сети');
  }
}

testMainServer(); 