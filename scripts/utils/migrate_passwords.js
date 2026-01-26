import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function migratePasswords() {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Получаем всех пользователей с открытыми паролями
    const result = await client.query(
      'SELECT id, password FROM enter WHERE password NOT LIKE \'$2%\''
    );

    console.log(`Found ${result.rows.length} users with unhashed passwords`);

    for (const user of result.rows) {
      if (user.password && !user.password.startsWith('$2')) {
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Обновляем пароль в базе
        await client.query(
          'UPDATE enter SET password = $1 WHERE id = $2',
          [hashedPassword, user.id]
        );
        
        console.log(`Migrated password for user ID: ${user.id}`);
      }
    }

    console.log('Password migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.end();
  }
}

migratePasswords(); 