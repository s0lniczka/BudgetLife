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

exports.create = async (req, res, next) => {
  try {
    const { month, planned_income, planned_expenses } = req.body;
    const { rows } = await db.query(
      `INSERT INTO budgets (user_id,"month",planned_income,planned_expenses)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, month, planned_income, planned_expenses]
    );
    res.status(201).json(rows[0]);
    await checkAchievements(req.user.id);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { planned_income, planned_expenses, actual_income, actual_expenses } = req.body;
    const { rows } = await db.query(
      `UPDATE budgets
         SET planned_income=$1, planned_expenses=$2,
             actual_income=$3, actual_expenses=$4
       WHERE id=$5 AND user_id=$6
       RETURNING *`,
      [planned_income, planned_expenses, actual_income, actual_expenses, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
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
