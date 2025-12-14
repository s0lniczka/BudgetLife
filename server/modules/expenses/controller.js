const db = require('../../config/db');
const checkAchievements = require('../achievements/helpers');

const toNum = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

exports.list = async (req, res, next) => {
  try {
    const { budget_id, from, to } = req.query;

    const params = [req.user.id];
    const where = ['e.user_id = $1'];

    if (budget_id) {
      params.push(Number(budget_id));
      where.push(`e.budget_id = $${params.length}`);
    }

    if (from) {
      params.push(from);
      where.push(`e."date" >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      where.push(`e."date" <= $${params.length}`);
    }

    const sql = `
      SELECT e.*, b.name AS budget_name
      FROM expenses e
      JOIN budgets b ON e.budget_id = b.id AND b.user_id = $1
      WHERE ${where.join(' AND ')}
      ORDER BY e."date" DESC, e.id DESC
    `;

    const { rows } = await db.query(sql, params);
    res.json(rows);

  } catch (e) { next(e); }
};



exports.getOne = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const { rows } = await db.query(
      `SELECT id, user_id, budget_id, category, amount::float8 AS amount, description, "date"
       FROM expenses
       WHERE id=$1 AND user_id=$2`,
      [id, req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);

  } catch (e) { next(e); }
};



exports.create = async (req, res, next) => {
  try {
    const { budget_id, category, amount, description, date } = req.body;
    const userId = req.user.id;

    if (!budget_id || !category || amount === undefined)
      return res.status(400).json({ error: 'budget_id, category, amount są wymagane' });

    const owns = await db.query(
      'SELECT 1 FROM budgets WHERE id=$1 AND user_id=$2',
      [Number(budget_id), userId]
    );
    if (!owns.rowCount) return res.status(404).json({ error: 'Budget not found' });

    const { rows } = await db.query(
      `INSERT INTO expenses (user_id, budget_id, category, amount, description, "date")
       VALUES ($1,$2,$3,$4,$5, COALESCE($6, NOW()))
       RETURNING *`,
      [userId, Number(budget_id), category, toNum(amount), description ?? null, date ?? null]
    );

    await db.query(
      `UPDATE budgets
       SET actual_expenses = COALESCE(actual_expenses, 0) + $1
       WHERE id = $2 AND user_id = $3`,
      [toNum(amount), Number(budget_id), userId]
    );

    res.status(201).json(rows[0]);

  } catch (e) { next(e); }
};



exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const { category, amount, description, date, budget_id } = req.body;

    const cur = await db.query(
      'SELECT * FROM expenses WHERE id=$1 AND user_id=$2',
      [id, userId]
    );
    const row = cur.rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });

    let newBudgetId = row.budget_id;

    if (budget_id && Number(budget_id) !== row.budget_id) {
      const owns = await db.query(
        'SELECT 1 FROM budgets WHERE id=$1 AND user_id=$2',
        [Number(budget_id), userId]
      );
      if (!owns.rowCount) return res.status(404).json({ error: 'Budget not found' });
      newBudgetId = Number(budget_id);
    }

    const { rows } = await db.query(
      `UPDATE expenses SET
         budget_id   = $1,
         category    = COALESCE($2, category),
         amount      = COALESCE($3, amount),
         description = COALESCE($4, description),
         "date"      = COALESCE($5, "date")
       WHERE id=$6 AND user_id=$7
       RETURNING *`,
      [
        newBudgetId,
        category ?? null,
        amount !== undefined ? toNum(amount) : null,
        description ?? null,
        date ?? null,
        id,
        userId
      ]
    );

    res.json(rows[0]);

  } catch (e) { next(e); }
};



exports.remove = async (req, res, next) => {
  const client = await db.connect();
  const userId = req.user.id;

  try {
    await client.query('BEGIN');

    const { rows: exp } = await client.query(
      'SELECT budget_id, amount FROM expenses WHERE id=$1 AND user_id=$2',
      [req.params.id, userId]
    );

    if (!exp.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Nie znaleziono wydatku' });
    }

    const { budget_id, amount } = exp[0];

    await client.query(
      'DELETE FROM expenses WHERE id=$1 AND user_id=$2',
      [req.params.id, userId]
    );

    await client.query(
      'UPDATE budgets SET actual_expenses = actual_expenses - $1 WHERE id=$2 AND user_id=$3',
      [amount, budget_id, userId]
    );

    await client.query('COMMIT');
    res.status(204).end();

  } catch (e) {
    await client.query('ROLLBACK');
    next(e);

  } finally {
    client.release();
  }
};



exports.byCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { budget_id } = req.query;

    const params = [userId];
    let where = 'user_id = $1';

    if (budget_id) {
      params.push(Number(budget_id));
      where += ` AND budget_id = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT category, SUM(amount)::float8 AS total
       FROM expenses
       WHERE ${where}
       GROUP BY category
       ORDER BY total DESC`,
      params
    );

    res.json(rows);

  } catch (e) { next(e); }
};



exports.recent = async (req, res) => {
  const { budget_id } = req.query;

  try {
    const result = await db.query(
      `SELECT e.*, b.name AS budget_name
       FROM expenses e
       JOIN budgets b ON e.budget_id = b.id
       WHERE e.budget_id=$1 AND b.user_id = e.user_id
       ORDER BY e.date DESC
       LIMIT 10`,
      [budget_id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
