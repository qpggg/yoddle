import { Pool } from 'pg';

export default async function handler(req, res) {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: process.env.PG_CONNECTION_STRING?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Проверка админских прав (простая проверка, можно расширить)
    const { admin_id } = req.body || req.query;
    if (!admin_id) {
      client.release();
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // Проверяем является ли пользователь админом
    const adminCheck = await client.query(
      'SELECT is_admin FROM enter WHERE id = $1',
      [admin_id]
    );

    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      client.release();
      return res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }

    if (req.method === 'GET') {
      const { action, period, company_id } = req.query;

      if (action === 'balance_report') {
        // Отчет по балансам пользователей
        let companyFilter = '';
        let queryParams = [];
        
        if (company_id) {
          companyFilter = 'WHERE u.company_id = $1';
          queryParams = [company_id];
        }

        const reportQuery = `
          SELECT * FROM balance_report 
          ${companyFilter}
          ORDER BY company_name, name
        `;

        const result = await client.query(reportQuery, queryParams);
        
        client.release();
        return res.status(200).json({
          success: true,
          report: result.rows.map(row => ({
            user_id: row.id,
            name: row.name,
            email: row.email,
            company: row.company_name,
            balance: parseFloat(row.balance || 0),
            total_earned: parseFloat(row.total_earned || 0),
            total_spent: parseFloat(row.total_spent || 0),
            last_update: row.last_balance_update
          }))
        });

      } else if (action === 'transactions_report') {
        // Отчет по транзакциям
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        
        let dateFilter = '';
        let queryParams = [limit, offset];
        
        if (period) {
          if (period === 'week') {
            dateFilter = 'WHERE ct.created_at >= NOW() - INTERVAL \'7 days\'';
          } else if (period === 'month') {
            dateFilter = 'WHERE ct.created_at >= NOW() - INTERVAL \'30 days\'';
          } else if (period === 'year') {
            dateFilter = 'WHERE ct.created_at >= NOW() - INTERVAL \'365 days\'';
          }
        }

        const reportQuery = `
          SELECT * FROM transactions_report 
          ${dateFilter}
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2
        `;

        const result = await client.query(reportQuery, queryParams);
        
        // Получаем общую статистику
        const statsQuery = `
          SELECT 
            COUNT(*) as total_transactions,
            SUM(CASE WHEN transaction_type IN ('credit', 'admin_add', 'monthly_allowance') THEN amount ELSE 0 END) as total_credits,
            SUM(CASE WHEN transaction_type IN ('debit', 'admin_remove', 'benefit_purchase') THEN amount ELSE 0 END) as total_debits
          FROM coin_transactions ct
          ${dateFilter.replace('ct.created_at', 'created_at')}
        `;

        const statsResult = await client.query(statsQuery, period ? [] : []);

        client.release();
        return res.status(200).json({
          success: true,
          transactions: result.rows.map(row => ({
            id: row.id,
            user_name: row.user_name,
            email: row.email,
            company: row.company_name,
            type: row.transaction_type,
            amount: parseFloat(row.amount),
            description: row.description,
            created_at: row.created_at,
            processed_by: row.processed_by_name
          })),
          statistics: {
            total_transactions: parseInt(statsResult.rows[0].total_transactions),
            total_credits: parseFloat(statsResult.rows[0].total_credits || 0),
            total_debits: parseFloat(statsResult.rows[0].total_debits || 0)
          }
        });

      } else if (action === 'company_stats') {
        // Статистика по компаниям
        const result = await client.query('SELECT * FROM company_statistics ORDER BY company_name');
        
        client.release();
        return res.status(200).json({
          success: true,
          companies: result.rows.map(row => ({
            id: row.id,
            company_name: row.company_name,
            planned_employees: row.employee_count,
            actual_employees: row.actual_employees,
            monthly_rate: parseFloat(row.monthly_rate),
            coins_per_employee: parseFloat(row.coins_per_employee),
            total_balance: parseFloat(row.total_balance || 0),
            total_coins_issued: parseFloat(row.total_coins_issued || 0),
            total_coins_spent: parseFloat(row.total_coins_spent || 0)
          }))
        });

      } else {
        client.release();
        return res.status(400).json({ error: 'Invalid action parameter' });
      }

    } else if (req.method === 'POST') {
      const { action, user_id, amount, description, company_data } = req.body;

      if (action === 'add_company') {
        // Добавление новой компании
        const { company_name, employee_count, monthly_rate, coins_per_employee, plan_start_date } = company_data;
        
        if (!company_name || !employee_count || !monthly_rate || !coins_per_employee) {
          client.release();
          return res.status(400).json({ error: 'All company data fields are required' });
        }

        const result = await client.query(
          'INSERT INTO company_plans (company_name, employee_count, monthly_rate, coins_per_employee, plan_start_date) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [company_name, employee_count, monthly_rate, coins_per_employee, plan_start_date || new Date()]
        );

        client.release();
        return res.status(200).json({
          success: true,
          message: 'Компания успешно добавлена',
          company_id: result.rows[0].id
        });

      } else if (action === 'manual_allocation') {
        // Ручное начисление коинов пользователю
        if (!user_id || !amount || amount <= 0) {
          client.release();
          return res.status(400).json({ error: 'user_id and valid amount are required' });
        }

        const result = await client.query(
          'SELECT add_coins($1, $2, $3, $4, $5) as success',
          [user_id, amount, description || 'Ручное начисление администратором', 'admin_add', admin_id]
        );

        if (result.rows[0].success) {
          client.release();
          return res.status(200).json({
            success: true,
            message: 'Коины успешно начислены'
          });
        } else {
          client.release();
          return res.status(500).json({ error: 'Failed to allocate coins' });
        }

      } else if (action === 'bulk_allocation') {
        // Массовое начисление коинов
        const { company_id, amount_per_user, description: bulk_description } = req.body;
        
        if (!company_id || !amount_per_user || amount_per_user <= 0) {
          client.release();
          return res.status(400).json({ error: 'company_id and valid amount_per_user are required' });
        }

        // Получаем всех пользователей компании
        const usersResult = await client.query(
          'SELECT id, name FROM enter WHERE company_id = $1',
          [company_id]
        );

        let successCount = 0;
        let errorCount = 0;

        // Начисляем коины каждому пользователю
        for (const user of usersResult.rows) {
          try {
            const result = await client.query(
              'SELECT add_coins($1, $2, $3, $4, $5) as success',
              [user.id, amount_per_user, bulk_description || 'Массовое начисление', 'admin_add', admin_id]
            );
            
            if (result.rows[0].success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(`Error allocating coins to user ${user.id}:`, error);
            errorCount++;
          }
        }

        client.release();
        return res.status(200).json({
          success: true,
          message: 'Массовое начисление завершено',
          statistics: {
            total_users: usersResult.rows.length,
            successful_allocations: successCount,
            failed_allocations: errorCount
          }
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
    console.error('Admin Coins API error:', error);
    return res.status(500).json({ error: 'Failed to process admin request', details: error.message });
  } finally {
    await pool.end();
  }
}