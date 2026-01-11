const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/routes');
const achievementsRoutes = require('../modules/achievements/routes');
const budgetsRoutes = require('../modules/budgets/routes');
const expensesRoutes = require('../modules/expenses/routes');
const userRoutes = (require('../modules/user/routes'))
const dashboardRoutes = require('../modules/dashboard/routes');
const savingsRoutes = require('../modules/savings/routes');
const statsRoutes = require('../modules/stats/routes');
const settingsRoutes = require('../modules/settings/routes');


router.use('/auth', authRoutes);
router.use('/achievements', achievementsRoutes);
router.use('/budgets', budgetsRoutes);
router.use('/expenses', expensesRoutes);
router.use('/user', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/savings', savingsRoutes);
router.use('/stats', statsRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
