const r = require('express').Router();
const c = require('./controller');
const auth = require('../../middlewares/auth');


r.post('/register', c.register);
r.post('/login', c.login);

// poprawna trasa zabezpieczona tokenem
r.get('/me', auth, (req, res) => res.json({ id: req.user.id }));

module.exports = r;
