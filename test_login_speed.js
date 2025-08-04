import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

const testCredentials = [
  { login: 'admin@gmail.com', password: 'admin' },
  { login: 'test@gmail.com', password: 'test' }
];

async function testLoginSpeed(credentials) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Вход ${credentials.login}: ${duration}ms`);
      return { success: true, duration, user: data.user };
    } else {
      console.log(`❌ Ошибка входа ${credentials.login}: ${duration}ms`);
      return { success: false, duration };
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ Ошибка сети ${credentials.login}: ${duration}ms - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function runSpeedTests() {
  console.log('🚀 ТЕСТИРОВАНИЕ СКОРОСТИ ВХОДА');
  console.log('================================\n');
  
  const results = [];
  
  // Тестируем первый вход (без кэша)
  console.log('📝 Первый вход (без кэша):');
  const firstResult = await testLoginSpeed(testCredentials[0]);
  results.push(firstResult);
  
  // Пауза между тестами
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Тестируем повторный вход (с кэшем)
  console.log('\n📝 Повторный вход (с кэшем):');
  const secondResult = await testLoginSpeed(testCredentials[0]);
  results.push(secondResult);
  
  // Пауза между тестами
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Тестируем третий вход (с кэшем)
  console.log('\n📝 Третий вход (с кэшем):');
  const thirdResult = await testLoginSpeed(testCredentials[0]);
  results.push(thirdResult);
  
  console.log('\n📊 РЕЗУЛЬТАТЫ СКОРОСТИ:');
  console.log('========================');
  
  const successfulLogins = results.filter(r => r.success);
  const failedLogins = results.filter(r => !r.success);
  
  if (successfulLogins.length > 0) {
    const avgDuration = successfulLogins.reduce((sum, r) => sum + r.duration, 0) / successfulLogins.length;
    const minDuration = Math.min(...successfulLogins.map(r => r.duration));
    const maxDuration = Math.max(...successfulLogins.map(r => r.duration));
    
    console.log(`✅ Успешных входов: ${successfulLogins.length}`);
    console.log(`⏱️  Среднее время: ${avgDuration.toFixed(0)}ms`);
    console.log(`⚡ Минимальное время: ${minDuration}ms`);
    console.log(`🐌 Максимальное время: ${maxDuration}ms`);
    
    // Анализируем кэширование
    if (successfulLogins.length >= 3) {
      const firstLogin = successfulLogins[0].duration;
      const cachedLogins = successfulLogins.slice(1);
      const avgCachedDuration = cachedLogins.reduce((sum, r) => sum + r.duration, 0) / cachedLogins.length;
      
      console.log(`\n🎯 АНАЛИЗ КЭШИРОВАНИЯ:`);
      console.log(`📝 Первый вход: ${firstLogin}ms`);
      console.log(`⚡ Кэшированные входы: ${avgCachedDuration.toFixed(0)}ms`);
      
      if (avgCachedDuration < firstLogin * 0.8) {
        console.log('✅ КЭШ РАБОТАЕТ! Повторные входы быстрее');
      } else {
        console.log('⚠️  КЭШ НЕ РАБОТАЕТ! Нет ускорения');
      }
    }
    
    if (avgDuration < 500) {
      console.log('🎯 ОТЛИЧНО! Вход работает быстро');
    } else if (avgDuration < 1000) {
      console.log('👍 ХОРОШО! Вход работает нормально');
    } else {
      console.log('⚠️  МЕДЛЕННО! Нужна оптимизация');
    }
  }
  
  if (failedLogins.length > 0) {
    console.log(`❌ Неудачных входов: ${failedLogins.length}`);
    failedLogins.forEach(r => {
      console.log(`   - ${r.error || 'Неизвестная ошибка'}`);
    });
  }
  
  console.log('\n🎯 РЕКОМЕНДАЦИИ:');
  if (successfulLogins.length > 0) {
    const avgDuration = successfulLogins.reduce((sum, r) => sum + r.duration, 0) / successfulLogins.length;
    if (avgDuration > 1000) {
      console.log('- Вход слишком медленный, проверьте логирование');
      console.log('- Убедитесь, что все API запросы оптимизированы');
    } else {
      console.log('- Скорость входа в норме');
      console.log('- Оптимизация логирования работает');
    }
  }
}

runSpeedTests().catch(console.error); 