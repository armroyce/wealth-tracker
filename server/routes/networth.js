const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getNetWorth, getHistory, takeSnapshot } = require('../controllers/networthController');

const router = express.Router();
router.use(authenticate);

router.get('/', getNetWorth);
router.get('/history', getHistory);
router.post('/snapshot', takeSnapshot);

module.exports = router;
