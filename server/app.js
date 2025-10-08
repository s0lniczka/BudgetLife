const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./config/db'); // samo odpalenie połączenia

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/budgets', require('./modules/budgets/routes'));
app.use('/api/expenses', require('./modules/expenses/routes'));
app.use('/api/achievements', require('./modules/achievements/routes'));



app.use(require('./middlewares/error'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API on :${PORT}`));


