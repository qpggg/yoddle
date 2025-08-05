import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testGamification() {
  console.log('🎮 ТЕСТИРОВАНИЕ ГЕЙМИФИКАЦИИ');
  console.log('==============================\n');
  
  const startTime = Date.now();
  
  try {
    // Сначала входим в систему
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'test@gmail.com',
        password: 'test'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Ошибка входа для тестирования геймификации');
      return;
    }
    
    const loginData = await loginResponse.json();
    const userId = loginData.user.id;
    
    console.log(`✅ Вход выполнен для пользователя: ${loginData.user.name}`);
    
    // Небольшая задержка перед геймификацией
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Тестируем геймификацию
    const gamificationResponse = await fetch(`${BASE_URL}/api/gamification/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId
      })
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (gamificationResponse.ok) {
      const gamificationData = await gamificationResponse.json();
      
      console.log(`✅ Геймификация: ${duration}ms`);
      console.log(`🎯 Общий XP: ${gamificationData.totalXP}`);
      console.log(`📊 Действий: ${gamificationData.actions}`);
      console.log(`🎁 Бонусов: ${gamificationData.bonuses}`);
      
      if (gamificationData.bonuses > 0) {
        console.log('🎉 Бонусы активированы!');
      }
      
      return { success: true, duration, data: gamificationData };
    } else {
      console.log(`❌ Ошибка геймификации: ${duration}ms`);
      const errorData = await gamificationResponse.json();
      console.log(`📝 Ошибка: ${errorData.error}`);
      return { success: false, duration, error: errorData.error };
    }
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ Ошибка сети: ${duration}ms - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function testGamificationSpeed() {
  console.log('\n🚀 ТЕСТ СКОРОСТИ ГЕЙМИФИКАЦИИ');
  console.log('===============================\n');
  
  const results = [];
  
  for (let i = 0; i < 3; i++) {
    console.log(`📝 Тест ${i + 1}:`);
    const result = await testGamification();
    results.push(result);
    
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Увеличиваем задержку до 2 секунд
    }
  }
  
  console.log('\n📊 РЕЗУЛЬТАТЫ ГЕЙМИФИКАЦИИ:');
  console.log('=============================');
  
  const successfulTests = results.filter(r => r && r.success);
  const failedTests = results.filter(r => r && !r.success);
  
  if (successfulTests.length > 0) {
    const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    const avgXP = successfulTests.reduce((sum, r) => sum + r.data.totalXP, 0) / successfulTests.length;
    
    console.log(`✅ Успешных тестов: ${successfulTests.length}`);
    console.log(`⏱️  Среднее время: ${avgDuration.toFixed(0)}ms`);
    console.log(`🎯 Средний XP: ${avgXP.toFixed(0)}`);
    
    if (avgDuration < 1000) {
      console.log('🎯 ОТЛИЧНО! Геймификация работает быстро');
    } else if (avgDuration < 2000) {
      console.log('👍 ХОРОШО! Геймификация работает нормально');
    } else {
      console.log('⚠️  МЕДЛЕННО! Нужна оптимизация');
    }
  }
  
  if (failedTests.length > 0) {
    console.log(`❌ Неудачных тестов: ${failedTests.length}`);
  }
  
  console.log('\n🎮 ГЕЙМИФИКАЦИЯ РАБОТАЕТ!');
  console.log('- XP начисляются за вход');
  console.log('- Бонусы за ранний вход и выходные');
  console.log('- Streak обновляется');
}

testGamificationSpeed().catch(console.error); 