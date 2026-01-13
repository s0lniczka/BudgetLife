const r = require('express').Router();
const auth = require('../../middlewares/auth');
const c = require('./controller');

r.use(auth);

r.get('/summary', c.summary);

module.exports = r;
