const r = require('express').Router();
const c = require('./controller');
const auth = require('../../middlewares/auth');
const { body, validationResult } = require('express-validator');


r.post('/register',
    [
        body('email')
            .isEmail()
            .withMessage('Podaj poprawny adres e-mail'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Hasło powinno zawierać conajmniej 6 znaków')],
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
        }
        next();
        }, c.register);
r.post('/login', c.login);

r.post('/forgot-password', c.forgotPassword);
r.post('/reset-password', c.resetPassword);


r.get('/me', auth, (req, res) => res.json({ id: req.user.id }));

module.exports = r;
