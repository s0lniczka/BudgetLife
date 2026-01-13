const r = require('express').Router();
const db = require('../../config/db');
const auth = require('../../middlewares/auth');

// GET /api/user/me — zwraca dane zalogowanego użytkownika
r.get('/me', auth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, email, currency, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Użytkownik nie został znaleziony.' });

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = r;
