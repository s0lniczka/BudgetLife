const db = require('../../config/db');
const { grantAchievement } = require('../achievements/helpers')


exports.listAll = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM achievements ORDER BY id');
    res.json(rows);
  } catch (e) { next(e); }
};

exports.listMy = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT a.*, ua.date_awarded
       FROM user_achievements ua
       JOIN achievements a ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.date_awarded DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
};
exports.unlock = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.query(
      `INSERT INTO user_achievements (user_id, achievement_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, achievement_id) DO NOTHING`,
      [req.user.id, id]
    );
    res.status(204).end(); // No Content
  } catch (e) { next(e); }
};
exports.getPoints = async (req, res, next) => {
  try {
    const userId = req.user.id

    const { rows } = await db.query(
      `
      SELECT COALESCE(SUM(a.points), 0) AS points
      FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = $1
      `,
      [userId]
    )

    res.json({ points: Number(rows[0].points) })
  } catch (e) {
    next(e)
  }
}

