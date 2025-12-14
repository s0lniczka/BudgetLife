const r = require('express').Router();
const auth = require('../../middlewares/auth');
const c = require('./controller');

r.use(auth);

// cele oszczędnościowee
r.get('/', c.list);
r.get('/:id', c.getOne);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);

// wpłaaty
r.get('/:id/payments', c.listPayments);
r.post('/:id/payments', c.addPayment);

module.exports = r;
