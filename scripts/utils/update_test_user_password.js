#!/usr/bin/env node
// Скрипт для обновления пароля тестового пользователя
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updatePassword() {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING || 
      `postgresql://${process.env.PGUSER || 'yoddle_user'}:${process.env.PGPASSWORD}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'yoddle_db'}`
  });

  try {
    await client.connect();
    console.log('✅ Подключено к БД');

    // Генерируем хеш для пароля test123
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 Сгенерирован хеш пароля:', hashedPassword);

    // Обновляем пароль тестового пользователя
    const result = await client.query(
      `UPDATE enter 
       SET password = $1 
       WHERE login = 'test_productivity@yoddle.test' 
       RETURNING id, name, login`,
      [hashedPassword]
    );

    if (result.rows.length > 0) {
      console.log('✅ Пароль обновлен для пользователя:', result.rows[0]);
      console.log('📧 Email:', result.rows[0].login);
      console.log('🔑 Пароль: test123');
    } else {
      console.log('⚠️  Пользователь не найден');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updatePassword();
