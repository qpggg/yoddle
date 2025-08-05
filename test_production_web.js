import fetch from 'node-fetch';

// 🔧 НАСТРОЙКИ ДЛЯ ПРОДАКШЕНА
const PRODUCTION_URL = 'https://yoddle.vercel.app'; // или ваш продакшен URL
const TEST_USER = {
  login: 'test@gmail.com',
  password: 'test'
};

async function testProductionWeb() {
  console.log('🚀 ТЕСТ ПРОДАКШЕНА ЧЕРЕЗ ВЕБ');
  console.log('==============================');
  
  try {
    // 1. Проверяем доступность сайта
    console.log('📡 Проверяем доступность сайта...');
    const siteResponse = await fetch(PRODUCTION_URL);
    
    if (!siteResponse.ok) {
      console.log(`❌ Сайт недоступен: ${siteResponse.status}`);
      return;
    }
    
    console.log('✅ Сайт доступен!');
    
    // 2. Тестируем API логина
    console.log('\n🔐 Тестируем API логина...');
    const loginResponse = await fetch(`${PRODUCTION_URL}/api/login`, {
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
    const gamificationResponse = await fetch(`${PRODUCTION_URL}/api/gamification/login`, {
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
    
    console.log('\n🎯 РЕЗУЛЬТАТ: Продакшен работает через веб!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testProductionWeb(); 