const db = require('../../config/db');

function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

exports.get = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { rows } = await db.query(
      `SELECT language, currency, notifications, theme
       FROM settings
       WHERE user_id = $1`,
      [userId]
    );

    // jeśli brak istawien to podstawowoe
    if (!rows.length) {
      const { rows: created } = await db.query(
        `INSERT INTO settings (user_id, language, currency, notifications, theme)
         VALUES ($1, 'pl', 'PLN', true, 'light')
         RETURNING language, currency, notifications, theme`,
        [userId]
      );

      return res.json(created[0]);
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { language, currency, notifications, theme } = req.body;

    const { rows } = await db.query(
      `INSERT INTO settings (user_id, language, currency, notifications, theme)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id)
       DO UPDATE SET
         language      = COALESCE(EXCLUDED.language, settings.language),
         currency      = COALESCE(EXCLUDED.currency, settings.currency),
         notifications = COALESCE(EXCLUDED.notifications, settings.notifications),
         theme         = COALESCE(EXCLUDED.theme, settings.theme)
       RETURNING language, currency, notifications, theme`,
      [
        userId,
        language ?? null,
        currency ?? null,
        notifications ?? null,
        theme ?? null
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
