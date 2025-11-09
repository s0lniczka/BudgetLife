const db = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

    
    if (!u) return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
    const token = jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, username: u.username, email: u.email } });
  } catch (e) { next(e); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const {email} = req.body;
    if(!email) return res.status(400).json({error: 'Podaj adres e-mail.'});

    const {rows} = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if(!rows.length) return res.status(404).json({error: 'Użytkownik o podanym adresie e-mail nie istnieje.'});

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 10);
    await db.query('UPDATE users SET reset_token=$1, reset_expires=$2 WHERE email=$3', [token, expires, email]);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
    });

    const resetLink=`http://localhost:5173/reset-password?token=${token}`;

    await transporter.sendMail({
      from: ' "BudgetLife" <no-reply@budgetlife.com',
      to: email,
      subject: 'Reset hasła - BudgetLife',
      html: `
        <h1>Reset hasła - BudgetLife</h1>
        <p>Otrzymaliśmy prośbę o zresetowanie hasła.</p>
        <p>Kliknij w link poniżej, aby ustawić nowe hasło:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Link wygaśnie za 5 minut.</p>
      `,
    });
    res.json({ok: 'Wysłano e-mail z linkiem do zresetowania hasła.'});
    } catch (e) { 
      next(e); 
    }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const {token, newPassword} = req.body;
    if(!token || !newPassword) 
      return res.status(400).json({error: 'Podaj token i nowe hasło.(brak danych)'});

    const {rows} = await db.query(
      'SELECT id FROM users WHERE reset_token=$1 AND reset_expires > NOW()',
      [token]
    );
    if (!rows.length) 
      return res.status(400).json({error: 'Token wygasł lub jest nieprawidłowy.'});

    const hash = await bcrypt.hash(newPassword, 12);

    await db.query(
      'UPDATE users SET password_hash=$1, reset_token=null, reset_expires=NULL WHERE id=$2',
      [hash, rows[0].id]
    );

    res.json({ok: 'Hasło zostało zresetowane pomyślnie.'});
  } catch (e) {
    next(e);
  }
};