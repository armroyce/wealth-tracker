const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getInsurances, getUpcomingRenewals, createInsurance, updateInsurance, deleteInsurance } = require('../controllers/insuranceController');

const router = express.Router();
router.use(authenticate);

router.get('/', getInsurances);
router.get('/reminders', getUpcomingRenewals);
router.post('/', createInsurance);
router.patch('/:id', updateInsurance);
router.delete('/:id', deleteInsurance);

module.exports = router;
