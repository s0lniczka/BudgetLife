const express = require('express');
const r = express.Router();
const auth = require('../../middlewares/auth');
const c = require('./controller');

r.get('/', auth, c.get);
r.put('/', auth, c.update);

module.exports = r;
