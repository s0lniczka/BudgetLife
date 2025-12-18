const r = require('express').Router();
const auth = require('../../middlewares/auth');
const c = require('./controller');

r.use(auth);

r.get('/', c.listAll);     // wszystkie możliwe osiągnięcia
r.get('/mine', c.listMy);  // osiągnięcia konkretnego użytkownika
r.post('/:id', auth, c.unlock); // Ręczne przyznanie osiągnięcia
r.get('/points', auth, c.getPoints);


module.exports = r;
