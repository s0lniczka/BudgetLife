const db = require('../../config/db');

//
// Uniwersalne pobieranie id użytkownika z JWT
//
function getUserId(req) {
  return req.user?.user_id || req.user?.id;
}

//
// Pobieranie wszystkich celów użytkownika
//
exports.list = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { rows } = await db.query(
      `SELECT *
       FROM savings_goals
       WHERE user_id = $1
       ORDER BY id DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// Pobieranie pojedynczego celu
//
exports.getOne = async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);

    const { rows } = await db.query(
      `SELECT *
       FROM savings_goals
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (!rows.length) return res.status(404).json({ error: "Goal not found" });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// Tworzenie nowego celu
//
exports.create = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, target_amount, deadline } = req.body;

    if (!name || !target_amount)
      return res.status(400).json({ error: "Brakuje wymaganych pól" });

    const { rows } = await db.query(
      `INSERT INTO savings_goals (user_id, name, target_amount, saved_amount, deadline, status)
       VALUES ($1, $2, $3, 0, $4, 'in_progress')
       RETURNING *`,
      [userId, name, Number(target_amount), deadline ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// Aktualizacja celu
//
exports.update = async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);

    const { name, target_amount, saved_amount, deadline, status } = req.body;

    if (status && !['in_progress', 'completed', 'canceled', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status celu.' });
    }

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

    if (!rows.length) return res.status(404).json({ error: "Goal not found" });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// Usuwanie celu
//
exports.remove = async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);

    const { rowCount } = await db.query(
      `DELETE FROM savings_goals
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (!rowCount) return res.status(404).json({ error: "Goal not found" });

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// Pobieranie listy wpłat dla danego celu
//
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


//
// Dodawanie wpłaty
//
exports.addPayment = async (req, res) => {
  const client = await db.connect();

  try {
    const userId = getUserId(req);
    const goalId = Number(req.params.id);
    const { amount } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ error: "Niepoprawna kwota" });

    await client.query("BEGIN");

    // sprawdź czy cel istnieje i należy do usera
    const goal = await client.query(
      `SELECT * FROM savings_goals
       WHERE id=$1 AND user_id=$2`,
      [goalId, userId]
    );

    if (!goal.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Goal not found" });
    }

    // ✅ dodaj wpłatę do savings_transactions
    const payment = await client.query(
      `INSERT INTO savings_transactions (goal_id, amount, date)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [goalId, Number(amount)]
    );

    // zaktualizuj saved_amount w savings_goals
    await client.query(
      `UPDATE savings_goals
       SET saved_amount = saved_amount + $1
       WHERE id=$2`,
      [Number(amount), goalId]
    );

    const updatedGoal = await client.query(
      `SELECT saved_amount, target_amount FROM savings_goals WHERE id=$1`,
      [goalId]
    );

    if (updatedGoal.rows[0].saved_amount >= updatedGoal.rows[0].target_amount) {
      await client.query(
        `UPDATE savings_goals
        SET status = 'completed'
        WHERE id=$1`,
        [goalId]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(payment.rows[0]);

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

