const r = require('express').Router();
const auth = require('../../middlewares/auth');
const c = require('./controller');

r.use(auth); // zabezpieczenie JWT

r.get('/summary', c.summary);

module.exports = r;
