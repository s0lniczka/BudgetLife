const db = require('../../config/db');
const checkAchievements = require('../achievements/helpers'); // dodaj na górze

exports.list = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM budgets WHERE user_id=$1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
};

exports.create = async (req, res) => {
  const { month, name, planned_income, actual_income, planned_expenses, actual_expenses } = req.body;
  const user_id = req.user.id;

  try {
    await db.query(
      `INSERT INTO budgets (user_id, month, name, planned_income, actual_income, planned_expenses, actual_expenses)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [user_id, month, name, planned_income, actual_income, planned_expenses, actual_expenses]
    );

    res.status(201).json({ message: "Budget created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addIncome = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const id = Number(req.params.id);

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Nieprawidłowa kwota' });
    }

    const { rows } = await db.query(
      `UPDATE budgets
         SET actual_income = COALESCE(actual_income, 0) + $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [Number(amount), id, req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Budżet nie znaleziony' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
};


exports.update = async (req, res) => {
  const { month, name, planned_income, actual_income, planned_expenses, actual_expenses } = req.body;
  const budget_id = req.params.id;

  try {
    await db.query(
      `UPDATE budgets SET month=$1, name=$2, planned_income=$3, actual_income=$4,
       planned_expenses=$5, actual_expenses=$6 WHERE id=$7`,
      [month, name, planned_income, actual_income, planned_expenses, actual_expenses, budget_id]
    );

    res.json({ message: "Budget updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.remove = async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM budgets WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
};
