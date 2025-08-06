// Быстрый тест API
async function testAPI() {
  try {
    console.log('🧪 Тестируем GET баланс...');
    const response1 = await fetch('http://localhost:3000/api/balance?user_id=1');
    const data1 = await response1.text();
    console.log('✅ Ответ:', data1);
    
    console.log('\n🧪 Тестируем POST добавление коинов...');
    const response2 = await fetch('http://localhost:3000/api/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1,
        amount: 100,
        description: 'Test',
        action: 'add'
      })
    });
    const data2 = await response2.text();
    console.log('✅ Ответ:', data2);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testAPI();