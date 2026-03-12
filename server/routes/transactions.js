const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  exportCSV,
  importCSV,
} = require('../controllers/transactionController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

router.get('/', getTransactions);
router.get('/categories', getCategories);
router.get('/export', exportCSV);
router.post('/import', upload.single('file'), importCSV);
router.post('/', createTransaction);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
