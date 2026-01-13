const db = require('../../config/db');
const { grantAchievement } = require('../achievements/helpers');

function getUserId(req) {
  return req.user?.user_id || req.user?.id;
}

exports.list = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { rows } = await db.query(
      `SELECT g.*,
              COALESCE(SUM(t.amount), 0) AS saved_amount
       FROM savings_goals g
       LEFT JOIN savings_transactions t ON t.goal_id = g.id
       WHERE g.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const userId = getUserId(req);
    const goalId = Number(req.params.id);

    const { rows } = await db.query(
      `SELECT g.*,
              COALESCE(SUM(t.amount), 0) AS saved_amount
       FROM savings_goals g
       LEFT JOIN savings_transactions t ON t.goal_id = g.id
       WHERE g.id = $1 AND g.user_id = $2
       GROUP BY g.id`,
      [goalId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, target_amount, deadline } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({ error: 'Brakuje wymaganych pól' });
    }

    const { rows } = await db.query(
      `INSERT INTO savings_goals
        (user_id, name, target_amount, deadline, status)
       VALUES ($1, $2, $3, $4, 'in_progress')
       RETURNING *`,
      [userId, name, Number(target_amount), deadline ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = getUserId(req);
    const goalId = Number(req.params.id);

    // await db.query(
    //   `DELETE FROM savings_transactions WHERE goal_id = $1`,
    //   [goalId]
    // );

    const { rowCount } = await db.query(
      `DELETE FROM savings_goals
       WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const userId = getUserId(req);
    const goalId = Number(req.params.id);

    const { rowCount } = await db.query(
      `UPDATE savings_goals
       SET status = 'canceled'
       WHERE id = $1 AND user_id = $2 AND status = 'in_progress'`,
      [goalId, userId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: 'Goal not found or cannot be canceled' });
    }

    res.status(200).json({ status: 'canceled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.listPayments = async (req, res) => {
  try {
    const goalId = Number(req.params.id);

    const { rows } = await db.query(
      `SELECT *
       FROM savings_transactions
       WHERE goal_id = $1
       ORDER BY date DESC`,
      [goalId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPayment = async (req, res) => {
  const client = await db.connect();

  try {
    const userId = getUserId(req);
    const goalId = Number(req.params.id);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Niepoprawna kwota' });
    }

    await client.query('BEGIN');

    const goalRes = await client.query(
      `SELECT * FROM savings_goals
       WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (!goalRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Goal not found' });
    }

    await client.query(
      `INSERT INTO savings_transactions (goal_id, amount, date)
       VALUES ($1, $2, NOW())`,
      [goalId, Number(amount)]
    );

    const { rows: [sum] } = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM savings_transactions
       WHERE goal_id = $1`,
      [goalId]
    );

    const totalSaved = Number(sum.total);
    const target = Number(goalRes.rows[0].target_amount);

    let status = goalRes.rows[0].status;

    if (totalSaved >= target && status !== 'completed') {
      status = 'completed';

      await client.query(
        `UPDATE savings_goals
         SET status = 'completed'
         WHERE id = $1`,
        [goalId]
      );

      await grantAchievement(userId, 6);
    }

    if (totalSaved >= 1000) {
      await grantAchievement(userId, 3);
    }

    await client.query('COMMIT');

    res.status(201).json({
      amount: Number(amount),
      saved_amount: totalSaved,
      status
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.update = async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);

    const { name, target_amount, saved_amount, deadline, status } = req.body;

    const { rows } = await db.query(
      `UPDATE savings_goals
       SET name = COALESCE($1, name),
           target_amount = COALESCE($2, target_amount),
           saved_amount = COALESCE($3, saved_amount),
           deadline = COALESCE($4, deadline),
           status = COALESCE($5, status)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, target_amount, saved_amount, deadline, status, id, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
