const r = require('express').Router();
const auth = require('../../middlewares/auth');
const c = require('./controller');

r.use(auth);
r.get('/', c.getStats);

module.exports = r;
