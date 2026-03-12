const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getPhysicalAssets, createPhysicalAsset, updatePhysicalAsset, deletePhysicalAsset } = require('../controllers/physicalAssetController');

const router = express.Router();
router.use(authenticate);

router.get('/', getPhysicalAssets);
router.post('/', createPhysicalAsset);
router.patch('/:id', updatePhysicalAsset);
router.delete('/:id', deletePhysicalAsset);

module.exports = router;
