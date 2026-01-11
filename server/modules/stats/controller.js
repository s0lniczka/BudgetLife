const db = require('../../config/db');

function getUserId(req) {
  return req.user?.user_id || req.user?.id;
}

exports.getStats = async (req, res) => {
  try {
    const userId = getUserId(req);

    // ===== SUMMARY =====
    const [
      incomeSum,
      expenseSum,
      savedSum,
      achievementsCount
    ] = await Promise.all([
      db.query(
        `SELECT COALESCE(SUM(amount),0)::numeric AS total
         FROM income_transactions
         WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COALESCE(SUM(amount),0)::numeric AS total
         FROM expenses
         WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COALESCE(SUM(saved_amount),0)::numeric AS total
         FROM savings_goals
         WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM user_achievements
         WHERE user_id = $1`,
        [userId]
      )
    ]);

    const summary = {
      income: Number(incomeSum.rows[0].total),
      expenses: Number(expenseSum.rows[0].total),
      saved: Number(savedSum.rows[0].total),
      achievements: Number(achievementsCount.rows[0].total)
    };

    // ===== EVENTS =====
    // UWAGA:
    // - Budżety i cele tworzone mają amount = NULL (żeby UI nie pokazywał kwoty)
    // - Przychody mają amount z income_transactions
    // - Wpłaty do celów mają amount z savings_transactions
    const { rows: events } = await db.query(
      `
      (
        -- 1) WYDATKI
        SELECT
          'expense-' || e.id AS id,
          'expense'::text AS type,
          e.category::text AS title,
          (-e.amount)::numeric AS amount,
          created_at AS date
        FROM expenses e
        WHERE e.user_id = $1
      )

      UNION ALL

      (
        -- 2) PRZYCHODY (z income_transactions, NIE z history)
        SELECT
          'income-' || it.id AS id,
          'income'::text AS type,
          ('Dodano przychód ' || it.amount || ' zł do budżetu ' || b.name)::text AS title,
          it.amount::numeric AS amount,
          it.date AS date
        FROM income_transactions it
        JOIN budgets b ON b.id = it.budget_id
        WHERE it.user_id = $1
      )

      UNION ALL

      (
        -- 3) UTWORZENIE BUDŻETU (z history, bo budgets nie ma created_at)
        SELECT
          'budget-' || h.id AS id,
          'budget'::text AS type,
          REPLACE(h.action, 'Utworzono budżet: ', '')::text AS title,
          NULL::numeric AS amount,
          h.date AS date
        FROM history h
        WHERE h.user_id = $1
          AND h.action ILIKE 'Utworzono budżet:%'
      )

      UNION ALL

      (
        -- 4) UTWORZENIE CELU OSZCZĘDNOŚCIOWEGO (created_at, kwoty brak)
        SELECT
          'saving-goal-' || sg.id AS id,
          'saving'::text AS type,
          sg.name::text AS title,
          NULL::numeric AS amount,
          sg.created_at AS date
        FROM savings_goals sg
        WHERE sg.user_id = $1
      )

      UNION ALL

      (
        -- 5) WPŁATY DO CELI (savings_transactions)
        SELECT
          'saving-pay-' || st.id AS id,
          'saving'::text AS type,
          ('Wpłata do celu: ' || sg.name)::text AS title,
          st.amount::numeric AS amount,
          st.date AS date
        FROM savings_transactions st
        JOIN savings_goals sg ON sg.id = st.goal_id
        WHERE sg.user_id = $1
      )

      UNION ALL

      (
        -- 6) OSIĄGNIĘCIA
        SELECT
          'ach-' || ua.id AS id,
          'achievement'::text AS type,
          a.name::text AS title,
          NULL::numeric AS amount,
          ua.date_awarded AS date
        FROM user_achievements ua
        JOIN achievements a ON a.id = ua.achievement_id
        WHERE ua.user_id = $1
      )

      ORDER BY date DESC NULLS LAST
      `,
      [userId]
    );

    res.json({ summary, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
