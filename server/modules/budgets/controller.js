const db = require('../../config/db');
const { grantAchievement } = require('../achievements/helpers');


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
  const {
    month,
    name,
    planned_income,
    planned_expenses
  } = req.body;

  const user_id = req.user.id;

  try {
    const { rows } = await db.query(
      `INSERT INTO budgets
        (user_id, month, name, planned_income, actual_income, planned_expenses, actual_expenses)
       VALUES ($1,$2,$3,$4,0,$5,0)
       RETURNING *`,
      [user_id, month, name, planned_income, planned_expenses]
    );

    const budget = rows[0];


    await db.query(
      `INSERT INTO history (user_id, action)
       VALUES ($1, $2)`,
      [user_id, `Utworzono budżet: ${budget.name}`]
    );

    const unlocked = await grantAchievement(user_id, 1);

    res.status(201).json({
      budget,
      achievementUnlocked: unlocked,
      achievementName: unlocked ? 'Pierwszy budżet' : null
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.addIncome = async (req, res, next) => {
  const client = await db.connect();

  try {
    const { amount } = req.body;
    const budget_id = Number(req.params.id);
    const user_id = req.user.id;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Nieprawidłowa kwota' });
    }

    await client.query('BEGIN');


    const { rows } = await client.query(
      `SELECT * FROM budgets WHERE id=$1 AND user_id=$2`,
      [budget_id, user_id]
    );

    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Budżet nie znaleziony' });
    }

    const budget = rows[0];

    await client.query(
      `INSERT INTO income_transactions (user_id, budget_id, amount)
       VALUES ($1, $2, $3)`,
      [user_id, budget_id, Number(amount)]
    );


    const { rows: [updated] } = await client.query(
      `UPDATE budgets
         SET actual_income = COALESCE(actual_income, 0) + $1
       WHERE id = $2
       RETURNING *`,
      [Number(amount), budget_id]
    );

 
    await client.query(
      `INSERT INTO history (user_id, action)
       VALUES ($1, $2)`,
      [user_id, `Dodano przychód ${amount} zł do budżetu ${budget.name}`]
    );

    await client.query('COMMIT');

    res.json(updated);

  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
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
