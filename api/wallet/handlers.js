import { createDbClient, getDbClient } from '../../db.js';

export async function ensureWalletSchema() {
  const client = createDbClient();
  try {
    await client.query(`ALTER TABLE IF EXISTS benefits ADD COLUMN IF NOT EXISTS price_coins numeric NOT NULL DEFAULT 0`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_balance (
        user_id integer PRIMARY KEY,
        balance numeric NOT NULL DEFAULT 0,
        total_earned numeric NOT NULL DEFAULT 0,
        total_spent numeric NOT NULL DEFAULT 0,
        updated_at timestamp DEFAULT NOW()
      )`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS coin_transactions (
        id serial PRIMARY KEY,
        user_id integer NOT NULL,
        transaction_type varchar(50) NOT NULL,
        amount numeric NOT NULL,
        balance_before numeric,
        balance_after numeric,
        description text,
        reference_id text,
        processed_by integer,
        created_at timestamp DEFAULT NOW()
      )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at)`);
    // Allow amount >= 0 and permit repeated purchases
    await client.query(`ALTER TABLE IF EXISTS coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_amount_positive`);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'coin_transactions_amount_non_negative'
        ) THEN
          ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_amount_non_negative CHECK (amount >= 0);
        END IF;
      END $$;`);
    await client.query(`ALTER TABLE IF EXISTS coin_transactions DROP CONSTRAINT IF EXISTS uq_tx_user_type_ref`);
    await client.query(`DROP INDEX IF EXISTS uq_tx_user_type_ref`);
    // Ensure transaction_type allows 'refund'
    await client.query(`ALTER TABLE IF EXISTS coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_transaction_type_check`);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'coin_transactions_transaction_type_check'
        ) THEN
          ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_transaction_type_check
            CHECK (transaction_type IN ('monthly_allowance','credit','admin_add','benefit_purchase','debit','admin_remove','refund'));
        ELSE
          -- Re-add with refund in case old definition lacked it
          BEGIN
            ALTER TABLE coin_transactions ADD CONSTRAINT tmp_tx_type_check
              CHECK (transaction_type IN ('monthly_allowance','credit','admin_add','benefit_purchase','debit','admin_remove','refund'));
            ALTER TABLE coin_transactions DROP CONSTRAINT coin_transactions_transaction_type_check;
            ALTER TABLE coin_transactions RENAME CONSTRAINT tmp_tx_type_check TO coin_transactions_transaction_type_check;
          EXCEPTION WHEN others THEN
            -- If add failed because existing already correct, ignore
            NULL;
          END;
        END IF;
      END $$;`);
  } catch (e) {
    console.error('ensureWalletSchema error:', e.message);
  }
}

export async function purchaseHandler(req, res) {
  const { user_id, benefit_id } = req.body;
  if (!user_id || !benefit_id) {
    return res.status(400).json({ error: 'user_id and benefit_id are required' });
  }
  const userIdStr = String(user_id);
  const benefitIdNum = parseInt(String(benefit_id), 10);

  const client = await getDbClient();
  try {
    await ensureWalletSchema();
    await client.query('BEGIN');

    // Ensure balance row
    const ubRes = await client.query(
      `SELECT user_id, balance, total_earned, total_spent FROM user_balance WHERE user_id::text = $1 FOR UPDATE`,
      [userIdStr]
    );
    if (ubRes.rows.length === 0) {
      await client.query(
        `INSERT INTO user_balance (user_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING`,
        [userIdStr]
      );
    }

    const ubLocked = await client.query(
      `SELECT user_id, balance, total_earned, total_spent FROM user_balance WHERE user_id::text = $1 FOR UPDATE`,
      [userIdStr]
    );
    const currentBalance = Number(ubLocked.rows[0]?.balance || 0);

    // Load benefit
    const benefitRes = await client.query(
      'SELECT id, name, COALESCE(price_coins, 0) AS price_coins FROM benefits WHERE id = $1',
      [benefitIdNum]
    );
    if (benefitRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'benefit not found' });
    }
    const benefit = benefitRes.rows[0];
    const price = Number(benefit.price_coins || 0);

    if (price > 0 && currentBalance < price) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'insufficient_funds', required: price, balance: currentBalance });
    }

    const balanceBefore = currentBalance;
    const balanceAfter = price > 0 ? balanceBefore - price : balanceBefore;

    // Anti-dup 5 sec
    const recentPurchase = await client.query(
      `SELECT id FROM coin_transactions WHERE user_id::text = $1 AND transaction_type = 'benefit_purchase' AND reference_id = $2 AND created_at >= NOW() - INTERVAL '5 seconds' ORDER BY created_at DESC, id DESC LIMIT 1`,
      [userIdStr, String(benefitIdNum)]
    );
    if (recentPurchase.rows.length > 0) {
      await client.query('COMMIT');
      return res.status(200).json({ success: true, duplicate: true, balance: currentBalance, spent: 0 });
    }

    // Insert purchase
    await client.query(
      `INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
       VALUES ($1,'benefit_purchase',$2,$3,$4,$5,$6,NULL,NOW())`,
      [userIdStr, price, balanceBefore, balanceAfter, `Покупка льготы: ${benefit.name}`, String(benefit.id)]
    );

    if (price > 0) {
      await client.query(
        `UPDATE user_balance SET balance = $2, total_spent = total_spent + $3, updated_at = NOW() WHERE user_id::text = $1`,
        [userIdStr, balanceAfter, price]
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({ success: true, balance: balanceAfter, spent: price });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Wallet purchase error:', error);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
}

export async function refundHandler(req, res) {
  const { user_id, transaction_id } = req.body;
  if (!user_id || !transaction_id) {
    return res.status(400).json({ error: 'user_id and transaction_id required' });
  }
  const userIdStr = String(user_id);
  const txOrBenefit = String(transaction_id);

  const client = await getDbClient();
  try {
    await ensureWalletSchema();
    await client.query('BEGIN');

    // Find purchase by id or by benefit_id
    let tx = await client.query(
      `SELECT * FROM coin_transactions WHERE id::text = $1 AND user_id::text = $2 AND transaction_type = 'benefit_purchase'`,
      [txOrBenefit, userIdStr]
    );
    if (tx.rows.length === 0) {
      tx = await client.query(
        `SELECT * FROM coin_transactions WHERE user_id::text = $1 AND transaction_type = 'benefit_purchase' AND reference_id = $2 ORDER BY created_at DESC, id DESC LIMIT 1`,
        [userIdStr, txOrBenefit]
      );
      if (tx.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ error: 'purchase transaction not found' });
      }
    }

    const purchase = tx.rows[0];

    // 48h window
    const windowHours = 48;
    const timeDiffQuery = await client.query(`SELECT EXTRACT(EPOCH FROM (NOW() - $1::timestamp)) AS seconds`, [purchase.created_at]);
    const secondsPassed = Number(timeDiffQuery.rows[0].seconds || 0);
    const secondsWindow = windowHours * 3600;
    if (secondsPassed > secondsWindow) {
      const secondsLeft = 0;
      try { await client.query('ROLLBACK'); } catch {}
      client.release();
      return res.status(422).json({ error: 'refund window closed', window_hours: windowHours, seconds_left: secondsLeft });
    }

    const existingRefund = await client.query(
      `SELECT 1 FROM coin_transactions WHERE user_id::text = $1 AND transaction_type = 'refund' AND reference_id = $2`,
      [userIdStr, String(purchase.id)]
    );
    if (existingRefund.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(409).json({ error: 'already refunded' });
    }

    const balanceBefore = purchase.balance_after;
    const balanceAfter = Number(balanceBefore) + Number(purchase.amount);

    const inserted = await client.query(
      `INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id, processed_by, created_at)
       VALUES ($1,'refund',$2,$3,$4,$5,$6,NULL,NOW()) RETURNING id`,
      [userIdStr, purchase.amount, balanceBefore, balanceAfter, `Возврат: ${purchase.description || ''}`.trim(), String(purchase.id)]
    );

    if (Number(purchase.amount) > 0) {
      await client.query(
        `UPDATE user_balance SET balance = balance + $2, total_spent = GREATEST(total_spent - $2, 0), updated_at = NOW() WHERE user_id::text = $1`,
        [userIdStr, purchase.amount]
      );
    }

    const secondsLeft = secondsWindow - secondsPassed;
    await client.query('COMMIT');
    client.release();
    return res.status(200).json({ success: true, refund_id: inserted.rows[0].id, purchase_id: purchase.id, seconds_left: secondsLeft, window_hours: windowHours });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    client.release();
    console.error('Refund error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function purchasesHandler(req, res) {
  const { user_id, benefit_id, limit = 50 } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  const userIdStr = String(user_id);
  const benefitIdStr = benefit_id !== undefined ? String(benefit_id) : undefined;
  const limitNum = parseInt(String(limit), 10) || 50;

  const client = createDbClient();
  try {
    await client.connect();
    const rows = await client.query(
      `SELECT ct.* , b.name AS benefit_name
         FROM coin_transactions ct
         LEFT JOIN benefits b ON (ct.transaction_type = 'benefit_purchase' AND ct.reference_id = b.id::text)
        WHERE ct.user_id::text = $1 AND ct.transaction_type = 'benefit_purchase'
          ${benefitIdStr ? 'AND ct.reference_id = $3' : ''}
        ORDER BY ct.created_at DESC, ct.id DESC
        LIMIT $2`,
      benefitIdStr ? [userIdStr, limitNum, benefitIdStr] : [userIdStr, limitNum]
    );
    await client.end();
    return res.status(200).json({ success: true, data: rows.rows });
  } catch (error) {
    await client.end();
    console.error('Purchases fetch error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function transactionsHandler(req, res) {
  const { user_id, limit = 20, offset = 0, type = 'all' } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();

    let whereType = '';
    if (type === 'topup') whereType = `AND ct.transaction_type IN ('monthly_allowance','credit','admin_add','refund')`;
    else if (type === 'purchase') whereType = `AND ct.transaction_type IN ('benefit_purchase')`;
    else if (type === 'debit') whereType = `AND ct.transaction_type IN ('debit','admin_remove')`;

    const sql = `SELECT 
                    ct.id,
                    ct.transaction_type,
                    ct.amount,
                    ct.description,
                    ct.reference_id,
                    ct.created_at,
                    CASE 
                      WHEN ct.transaction_type = 'benefit_purchase' THEN (SELECT name FROM benefits b WHERE b.id::text = ct.reference_id LIMIT 1)
                      WHEN ct.transaction_type = 'refund' THEN (SELECT name FROM benefits b WHERE b.id::text = (SELECT p.reference_id FROM coin_transactions p WHERE p.id::text = ct.reference_id LIMIT 1) LIMIT 1)
                      ELSE NULL
                    END AS benefit_name
                  FROM coin_transactions ct
                 WHERE ct.user_id::text = $1 ${whereType}
                 ORDER BY ct.created_at DESC, ct.id DESC`;

    const limitNum = parseInt(String(limit), 10) || 20;
    const offsetNum = parseInt(String(offset), 10) || 0;

    const rs = await client.query(sql, [String(user_id)]);
    const page = rs.rows.slice(offsetNum, offsetNum + limitNum);
    await client.end();
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    await client.end();
    console.error('Wallet transactions error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function policyHandler(req, res) {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();
    const result = await client.query(
      `SELECT cp.allowance_day, cp.carryover_policy, cp.max_balance, COALESCE(cp.timezone, 'Europe/Moscow') as timezone
         FROM enter e
         LEFT JOIN company_plans cp ON cp.id = e.company_id
        WHERE e.id = $1`,
      [user_id]
    );
    const row = result.rows[0] || {};
    const allowanceDay = row.allowance_day || 1;
    const tz = row.timezone || 'Europe/Moscow';
    const carryover = row.carryover_policy || 'none';

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const currentDay = now.getUTCDate();
    const targetMonth = currentDay < allowanceDay ? month : month + 1;
    const targetDate = new Date(Date.UTC(year, targetMonth, Math.min(allowanceDay, 28), 0, 0, 0));

    const hint = `Следующее начисление: ${targetDate.toLocaleDateString('ru-RU')} • Политика переноса: ${carryover === 'none' ? 'без переноса' : carryover === 'full' ? 'полный перенос' : 'частичный перенос'}`;
    await client.end();
    return res.status(200).json({ success: true, allowance_day: allowanceDay, carryover_policy: carryover, timezone: tz, next_allowance_at: targetDate, hint });
  } catch (error) {
    await client.end();
    console.error('Wallet policy error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function refreshHandler(req, res) {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const client = createDbClient();
  try {
    await ensureWalletSchema();
    await client.connect();
    const agg = await client.query(
      `SELECT 
          COALESCE(SUM(CASE WHEN transaction_type IN ('monthly_allowance','credit','admin_add') THEN amount ELSE 0 END),0) AS earned,
          COALESCE(SUM(CASE WHEN transaction_type IN ('benefit_purchase','debit','admin_remove') THEN amount ELSE 0 END),0) 
          - COALESCE(SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END),0) AS spent
       FROM coin_transactions WHERE user_id = $1`,
      [user_id]
    );
    const earned = Number(agg.rows[0]?.earned || 0);
    const spentRaw = Number(agg.rows[0]?.spent || 0);
    const spent = Math.max(0, spentRaw);
    const balance = earned - spent;

    await client.query(
      `INSERT INTO user_balance (user_id, balance, total_earned, total_spent)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance, total_earned = EXCLUDED.total_earned, total_spent = EXCLUDED.total_spent, updated_at = NOW()`,
      [user_id, balance, earned, spent]
    );

    await client.end();
    return res.status(200).json({ success: true, balance, total_earned: earned, total_spent: spent });
  } catch (error) {
    await client.end();
    console.error('Wallet refresh error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}
