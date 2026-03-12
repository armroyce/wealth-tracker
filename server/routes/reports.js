const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getMonthlyReport, getAnnualReport, getDashboardData } = require('../controllers/reportController');

const router = express.Router();
router.use(authenticate);

router.get('/dashboard', getDashboardData);
router.get('/monthly', getMonthlyReport);
router.get('/annual', getAnnualReport);

module.exports = router;
