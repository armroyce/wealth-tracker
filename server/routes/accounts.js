const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getAccounts, createAccount, updateAccount, deleteAccount, getAccountSummary } = require('../controllers/accountController');

const router = express.Router();
router.use(authenticate);

router.get('/', getAccounts);
router.get('/summary', getAccountSummary);
router.post('/', createAccount);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);

module.exports = router;
