import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Функция для создания клиента БД
function createDbClient() {
  const connectionString = process.env.PG_CONNECTION_STRING || 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  return new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

async function migratePasswords() {
  const client = createDbClient();
  
  try {
    await client.connect();
    console.log('Подключение к БД установлено');
    
    // Получаем всех пользователей с открытыми паролями
    const result = await client.query(
      'SELECT id, login, password FROM enter WHERE password NOT LIKE \'$2%\''
    );
    
    console.log(`Найдено ${result.rows.length} пользователей с открытыми паролями`);
    
    if (result.rows.length === 0) {
      console.log('Все пароли уже хешированы');
      return;
    }
    
    // Хешируем пароли
    for (const user of result.rows) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        await client.query(
          'UPDATE enter SET password = $1 WHERE id = $2',
          [hashedPassword, user.id]
        );
        
        console.log(`Пароль пользователя ${user.login} успешно хеширован`);
      } catch (error) {
        console.error(`Ошибка при хешировании пароля пользователя ${user.login}:`, error);
      }
    }
    
    console.log('Миграция паролей завершена');
    
  } catch (error) {
    console.error('Ошибка при миграции паролей:', error);
  } finally {
    await client.end();
  }
}

// Запускаем миграцию
migratePasswords().catch(console.error); 