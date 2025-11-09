const db = require('../../config/db');

exports.summary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // saldo i liczba budżetów
    const { rows: budgets } = await db.query(
      `SELECT 
         COALESCE(SUM(actual_income - actual_expenses), 0) AS balance,
         COUNT(*) AS budgets_count
       FROM budgets
       WHERE user_id = $1`,
      [userId]
    );

    // liczba wydatków w bieżącym miesiącu
    const { rows: expenses } = await db.query(
      `SELECT COUNT(*) AS expenses_count
       FROM expenses
       WHERE user_id = $1
         AND DATE_TRUNC('month', "date") = DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );

    res.json({
      balance: Number(budgets[0].balance || 0),
      budgetsCount: Number(budgets[0].budgets_count || 0),
      expensesCount: Number(expenses[0].expenses_count || 0)
    });
  } catch (e) {
    next(e);
  }
};
