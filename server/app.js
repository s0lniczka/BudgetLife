const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Przykładowa trasa
app.get('/', (req, res) => {
  res.send('API działa');
});

// Można dodać własne trasy np. /api/goals
// app.use('/api/goals', require('./routes/goals'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serwer działa na porcie ${PORT}`));
