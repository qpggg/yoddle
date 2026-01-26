import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

console.log('🚀 НАСТРОЙКА ЛОКАЛЬНОЙ РАЗРАБОТКИ');
console.log('==================================\n');

// Конфигурация локальной БД
const LOCAL_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Подключаемся к системной БД для создания нашей
  user: 'postgres',
  password: '4bd2e9993a6e443a8489c7391d1a23ee' // Пароль из установки
};

async function setupLocalDatabase() {
  console.log('📊 Создание локальной БД...');
  
  const client = new Client(LOCAL_CONFIG);
  
  try {
    await client.connect();
    
    // Создаем БД и пользователя
    await client.query(`
      CREATE DATABASE yoddle_dev;
    `);
    
    console.log('✅ База данных yoddle_dev создана');
    
    await client.query(`
      CREATE USER yoddle_user WITH PASSWORD 'yoddle123';
    `);
    
    console.log('✅ Пользователь yoddle_user создан');
    
    await client.query(`
      GRANT ALL PRIVILEGES ON DATABASE yoddle_dev TO yoddle_user;
    `);
    
    console.log('✅ Права выданы');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('⚠️  База данных уже существует');
    } else if (error.code === '42710') {
      console.log('⚠️  Пользователь уже существует');
    } else {
      console.error('❌ Ошибка создания БД:', error.message);
      return false;
    }
  } finally {
    await client.end();
  }
  
  return true;
}

async function createTables() {
  console.log('\n📋 Создание таблиц...');
  
  const client = new Client({
    ...LOCAL_CONFIG,
    database: 'yoddle_dev',
    user: 'yoddle_user',
    password: 'yoddle123'
  });
  
  try {
    await client.connect();
    
    // Создаем основные таблицы
    const tables = [
      `CREATE TABLE IF NOT EXISTS enter (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        login VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        position VARCHAR(255),
        avatar_url TEXT,
        password VARCHAR(255)
      );`,
      
      `CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100),
        xp_earned INTEGER DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      
      `CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        login_streak INTEGER DEFAULT 0,
        days_active INTEGER DEFAULT 0,
        benefits_used INTEGER DEFAULT 0,
        profile_completion INTEGER DEFAULT 0,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    ];
    
    for (const table of tables) {
      await client.query(table);
    }
    
    console.log('✅ Таблицы созданы');
    
    // Добавляем тестовые данные
    await client.query(`
      INSERT INTO enter (name, login, phone, position, password) 
      VALUES 
        ('Михаил Полшков', 'admin@gmail.com', '+7-999-123-45-67', 'CEO', 'admin'),
        ('Елена', 'test@gmail.com', '+7-999-987-65-43', 'Секретарь', 'test')
      ON CONFLICT (login) DO NOTHING;
    `);
    
    console.log('✅ Тестовые данные добавлены');
    
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error.message);
    return false;
  } finally {
    await client.end();
  }
  
  return true;
}

function updateEnvFile() {
  console.log('\n🔧 Обновление .env файла...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envContent = `# Локальная разработка
PG_CONNECTION_STRING=postgresql://yoddle_user:yoddle123@localhost:5432/yoddle_dev

# Продакшн (закомментировать для локальной разработки)
# PG_CONNECTION_STRING=postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
`;
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env файл обновлен');
    return true;
  } catch (error) {
    console.error('❌ Ошибка обновления .env:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Начинаем настройку локальной разработки...\n');
  
  const dbCreated = await setupLocalDatabase();
  if (!dbCreated) {
    console.log('❌ Не удалось создать БД');
    return;
  }
  
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.log('❌ Не удалось создать таблицы');
    return;
  }
  
  const envUpdated = updateEnvFile();
  if (!envUpdated) {
    console.log('❌ Не удалось обновить .env');
    return;
  }
  
  console.log('\n🎉 НАСТРОЙКА ЗАВЕРШЕНА!');
  console.log('========================');
  console.log('✅ Локальная БД создана');
  console.log('✅ Таблицы настроены');
  console.log('✅ .env обновлен');
  console.log('\n🚀 Теперь запустите:');
  console.log('   npm run server');
  console.log('   npm run test-simple');
  console.log('\n📊 Ожидаемая скорость: 50-100ms!');
}

main().catch(console.error); 