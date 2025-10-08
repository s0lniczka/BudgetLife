const db = require('../../config/db');
const checkAchievements = require('../achievements/helpers');

// helper do walidacji liczb
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
      SELECT e.*
      FROM expenses e
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

    if (!budget_id || !category || amount === undefined)
      return res.status(400).json({ error: 'budget_id, category, amount są wymagane' });

    // Sprawdź, czy budżet należy do zalogowanego usera
    const owns = await db.query(
      'SELECT 1 FROM budgets WHERE id=$1 AND user_id=$2',
      [Number(budget_id), req.user.id]
    );
    if (!owns.rowCount) return res.status(404).json({ error: 'Budget not found' });

    const { rows } = await db.query(
      `INSERT INTO expenses (user_id, budget_id, category, amount, description, "date")
       VALUES ($1,$2,$3,$4,$5, COALESCE($6, NOW()))
       RETURNING *`,
      [req.user.id, Number(budget_id), category, toNum(amount), description ?? null, date ?? null]
    );
    await checkAchievements(req.user.id);

    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { category, amount, description, date, budget_id } = req.body;

    // Pobierz istniejący wydatek i upewnij się, że należy do usera
    const cur = await db.query(
      'SELECT * FROM expenses WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    );
    const row = cur.rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });

    // Jeśli zmieniasz budget_id – sprawdź własność budżetu
    let newBudgetId = row.budget_id;
    if (budget_id && Number(budget_id) !== row.budget_id) {
      const owns = await db.query(
        'SELECT 1 FROM budgets WHERE id=$1 AND user_id=$2',
        [Number(budget_id), req.user.id]
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
        req.user.id
      ]
    );

    res.json(rows[0]);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await db.query(
      'DELETE FROM expenses WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
};
