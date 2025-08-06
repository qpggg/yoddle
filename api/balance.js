import { Pool } from 'pg';

export default async function handler(req, res) {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: process.env.PG_CONNECTION_STRING?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    if (req.method === 'GET') {
      const { user_id, action, period } = req.query;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      if (action === 'balance') {
        // Получение текущего баланса пользователя
        const balanceQuery = `
          SELECT 
            ub.balance,
            ub.total_earned,
            ub.total_spent,
            ub.updated_at,
            u.name,
            cp.company_name,
            cp.coins_per_employee
          FROM user_balance ub
          JOIN enter u ON ub.user_id = u.id
          LEFT JOIN company_plans cp ON u.company_id = cp.id
          WHERE ub.user_id = $1
        `;
        
        const balanceResult = await client.query(balanceQuery, [user_id]);
        
        if (balanceResult.rows.length === 0) {
          // Создаем баланс если его нет
          await client.query(
            'INSERT INTO user_balance (user_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0)',
            [user_id]
          );
          
          client.release();
          return res.status(200).json({
            success: true,
            balance: 0,
            total_earned: 0,
            total_spent: 0,
            updated_at: new Date(),
            company_name: null,
            coins_per_employee: 0
          });
        }

        const balance = balanceResult.rows[0];
        client.release();

        return res.status(200).json({
          success: true,
          balance: parseFloat(balance.balance),
          total_earned: parseFloat(balance.total_earned),
          total_spent: parseFloat(balance.total_spent),
          updated_at: balance.updated_at,
          user_name: balance.name,
          company_name: balance.company_name,
          coins_per_employee: parseFloat(balance.coins_per_employee || 0)
        });

      } else if (action === 'transactions') {
        // Получение истории транзакций
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        let dateFilter = '';
        let queryParams = [user_id, limit, offset];
        
        if (period) {
          if (period === 'week') {
            dateFilter = 'AND ct.created_at >= NOW() - INTERVAL \'7 days\'';
          } else if (period === 'month') {
            dateFilter = 'AND ct.created_at >= NOW() - INTERVAL \'30 days\'';
          } else if (period === 'year') {
            dateFilter = 'AND ct.created_at >= NOW() - INTERVAL \'365 days\'';
          }
        }

        const transactionsQuery = `
          SELECT 
            ct.id,
            ct.transaction_type,
            ct.amount,
            ct.balance_before,
            ct.balance_after,
            ct.description,
            ct.created_at,
            admin_user.name as processed_by_name
          FROM coin_transactions ct
          LEFT JOIN enter admin_user ON ct.processed_by = admin_user.id
          WHERE ct.user_id = $1 ${dateFilter}
          ORDER BY ct.created_at DESC
          LIMIT $2 OFFSET $3
        `;

        const transactionsResult = await client.query(transactionsQuery, queryParams);
        
        // Получаем общий счетчик транзакций
        const countQuery = `
          SELECT COUNT(*) as total 
          FROM coin_transactions 
          WHERE user_id = $1 ${dateFilter}
        `;
        const countResult = await client.query(countQuery, [user_id]);

        client.release();

        return res.status(200).json({
          success: true,
          transactions: transactionsResult.rows.map(row => ({
            id: row.id,
            type: row.transaction_type,
            amount: parseFloat(row.amount),
            balance_before: parseFloat(row.balance_before),
            balance_after: parseFloat(row.balance_after),
            description: row.description,
            created_at: row.created_at,
            processed_by: row.processed_by_name
          })),
          total: parseInt(countResult.rows[0].total),
          has_more: (offset + limit) < parseInt(countResult.rows[0].total)
        });

      } else {
        client.release();
        return res.status(400).json({ error: 'Invalid action parameter' });
      }

    } else if (req.method === 'POST') {
      const { user_id, action, amount, description, processed_by, reference_id } = req.body;

      if (!user_id || !action) {
        client.release();
        return res.status(400).json({ error: 'user_id and action are required' });
      }

      if (action === 'add_coins') {
        // Добавление коинов (только для админов)
        if (!amount || amount <= 0) {
          client.release();
          return res.status(400).json({ error: 'Valid amount is required' });
        }

        const result = await client.query(
          'SELECT add_coins($1, $2, $3, $4, $5) as success',
          [user_id, amount, description || 'Пополнение баланса', 'admin_add', processed_by]
        );

        if (result.rows[0].success) {
          // Получаем обновленный баланс
          const balanceQuery = 'SELECT balance FROM user_balance WHERE user_id = $1';
          const balanceResult = await client.query(balanceQuery, [user_id]);
          
          client.release();
          return res.status(200).json({
            success: true,
            message: 'Коины успешно добавлены',
            new_balance: parseFloat(balanceResult.rows[0].balance)
          });
        } else {
          client.release();
          return res.status(500).json({ error: 'Failed to add coins' });
        }

      } else if (action === 'spend_coins') {
        // Списание коинов
        if (!amount || amount <= 0) {
          client.release();
          return res.status(400).json({ error: 'Valid amount is required' });
        }

        try {
          const result = await client.query(
            'SELECT spend_coins($1, $2, $3, $4) as success',
            [user_id, amount, description || 'Покупка льготы', reference_id]
          );

          if (result.rows[0].success) {
            // Получаем обновленный баланс
            const balanceQuery = 'SELECT balance FROM user_balance WHERE user_id = $1';
            const balanceResult = await client.query(balanceQuery, [user_id]);
            
            client.release();
            return res.status(200).json({
              success: true,
              message: 'Покупка успешно совершена',
              new_balance: parseFloat(balanceResult.rows[0].balance)
            });
          } else {
            client.release();
            return res.status(500).json({ error: 'Failed to spend coins' });
          }
        } catch (error) {
          client.release();
          if (error.message.includes('Недостаточно средств')) {
            return res.status(400).json({ error: 'Недостаточно средств на балансе' });
          }
          throw error;
        }

      } else if (action === 'monthly_allocation') {
        // Ежемесячное начисление (только для админов)
        const result = await client.query('SELECT monthly_coins_allocation() as allocated_count');
        
        client.release();
        return res.status(200).json({
          success: true,
          message: 'Ежемесячное начисление выполнено',
          allocated_users: result.rows[0].allocated_count
        });

      } else {
        client.release();
        return res.status(400).json({ error: 'Invalid action' });
      }

    } else {
      client.release();
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Balance API error:', error);
    return res.status(500).json({ error: 'Failed to process balance request', details: error.message });
  } finally {
    await pool.end();
  }
}