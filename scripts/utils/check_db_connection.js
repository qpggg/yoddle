import { Pool } from 'pg';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

console.log('🔍 Проверка подключения к базе данных...\n');

// Проверяем наличие переменных окружения
if (!process.env.PG_CONNECTION_STRING) {
  console.error('❌ PG_CONNECTION_STRING не установлен!');
  console.error('\n💡 Установите переменную в .env файле:');
  console.error('   PG_CONNECTION_STRING=postgresql://user:password@host:port/database');
  console.error('\n   Или используйте отдельные переменные:');
  console.error('   PGHOST=host');
  console.error('   PGPORT=5432');
  console.error('   PGDATABASE=database');
  console.error('   PGUSER=user');
  console.error('   PGPASSWORD=password');
  process.exit(1);
}

// Парсим строку подключения для отображения (без пароля)
let connectionInfo = {};
try {
  const url = new URL(process.env.PG_CONNECTION_STRING);
  connectionInfo = {
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace('/', ''),
    user: url.username,
    password: url.password ? '***' : 'не указан'
  };
} catch (error) {
  console.warn('⚠️  Не удалось распарсить PG_CONNECTION_STRING');
}

// Определяем SSL настройки
let sslOption = false;
try {
  const url = new URL(process.env.PG_CONNECTION_STRING);
  const sslMode = url.searchParams.get('sslmode');
  const isSupabase = /supabase\.com$/i.test(url.hostname);
  if (sslMode === 'require' || isSupabase) {
    sslOption = { rejectUnauthorized: false };
  }
} catch {
  // Игнорируем ошибки парсинга
}

// Создаем пул соединений
const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: sslOption,
  max: 1, // Для проверки достаточно одного соединения
  connectionTimeoutMillis: 10000, // 10 секунд таймаут
});

async function checkConnection() {
  const startTime = Date.now();
  
  try {
    // Пытаемся подключиться
    const client = await pool.connect();
    
    // Выполняем простой запрос
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Отображаем информацию
    console.log('✅ Подключение к БД успешно!\n');
    console.log('📊 Информация о подключении:');
    if (connectionInfo.host) {
      console.log(`   Host: ${connectionInfo.host}`);
      console.log(`   Port: ${connectionInfo.port}`);
      console.log(`   Database: ${connectionInfo.database}`);
      console.log(`   User: ${connectionInfo.user}`);
    }
    console.log(`   Время подключения: ${duration}ms`);
    console.log(`   Текущее время БД: ${result.rows[0].current_time}`);
    console.log(`   Версия PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    
    // Проверяем наличие основных таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`\n📋 Найдено таблиц: ${tablesResult.rows.length}+`);
      console.log('   Примеры:');
      tablesResult.rows.slice(0, 5).forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('\n⚠️  Таблицы не найдены. Возможно, БД пустая.');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Проверка завершена успешно!');
    process.exit(0);
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error('\n❌ Ошибка подключения к БД!\n');
    console.error(`⏱️  Время до ошибки: ${duration}ms\n`);
    console.error('📋 Детали ошибки:');
    console.error(`   Код: ${error.code || 'N/A'}`);
    console.error(`   Сообщение: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Возможные причины:');
      console.error('   - БД недоступна по указанному адресу');
      console.error('   - Неправильный хост или порт');
      console.error('   - БД не запущена');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Возможные причины:');
      console.error('   - Таймаут подключения');
      console.error('   - Проблемы с сетью');
      console.error('   - IP не добавлен в whitelist БД');
    } else if (error.code === '28P01') {
      console.error('\n💡 Возможные причины:');
      console.error('   - Неправильный пароль');
      console.error('   - Неправильное имя пользователя');
    } else if (error.code === '3D000') {
      console.error('\n💡 Возможные причины:');
      console.error('   - База данных не существует');
      console.error('   - Неправильное имя базы данных');
    }
    
    console.error('\n🔧 Рекомендации:');
    console.error('   1. Проверьте правильность PG_CONNECTION_STRING в .env');
    console.error('   2. Убедитесь, что БД доступна с вашего IP');
    console.error('   3. Для Supabase добавьте ?sslmode=require в строку подключения');
    console.error('   4. Проверьте логи БД на сервере');
    
    await pool.end();
    process.exit(1);
  }
}

// Запускаем проверку
checkConnection();
