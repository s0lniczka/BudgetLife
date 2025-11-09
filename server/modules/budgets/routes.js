const r = require('express').Router();
const auth = require('../../middlewares/auth');
const c = require('./controller');

r.use(auth);
r.get('/', c.list);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);
r.patch('/:id/income', c.addIncome);

module.exports = r;
