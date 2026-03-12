const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getGoals, createGoal, updateGoal, deleteGoal, contributeToGoal } = require('../controllers/goalController');

const router = express.Router();
router.use(authenticate);

router.get('/', getGoals);
router.post('/', createGoal);
router.post('/:id/contribute', contributeToGoal);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
