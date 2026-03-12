const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getInvestments, createInvestment, updateInvestment, deleteInvestment, refreshPrices, getAllocation } = require('../controllers/investmentController');

const router = express.Router();
router.use(authenticate);

router.get('/', getInvestments);
router.get('/allocation', getAllocation);
router.post('/refresh-prices', refreshPrices);
router.post('/', createInvestment);
router.patch('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

module.exports = router;
