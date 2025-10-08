const db = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, currency='PLN' } = req.body;
    if (!username || !email || !password) throw new Error('Missing fields');
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (username, email, password_hash, currency)
       VALUES ($1,$2,$3,$4)
       RETURNING id, username, email, currency, created_at`,
      [username, email, hash, currency]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await db.query(
      'SELECT id, username, email, password_hash FROM users WHERE email=$1',
      [email]
    );
    const u = rows[0];
    if (!u) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, username: u.username, email: u.email } });
  } catch (e) { next(e); }
};
