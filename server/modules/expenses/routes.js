const r = require('express').Router();
const auth = require('../../middlewares/auth');
const c = require('./controller');

r.use(auth);

r.get('/', c.list);
r.get('/categories', c.byCategory);
r.get('/recent', c.recent);
r.get('/:id', c.getOne);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);

module.exports = r;
