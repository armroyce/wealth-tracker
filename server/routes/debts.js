const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDebts, createDebt, updateDebt, deleteDebt, getPayoffPlan } = require('../controllers/debtController');

const router = express.Router();
router.use(authenticate);

router.get('/', getDebts);
router.get('/payoff-plan', getPayoffPlan);
router.post('/', createDebt);
router.patch('/:id', updateDebt);
router.delete('/:id', deleteDebt);

module.exports = router;
