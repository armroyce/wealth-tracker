const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');

const router = express.Router();
router.use(authenticate);

router.get('/', getBudgets);
router.post('/', createBudget);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
