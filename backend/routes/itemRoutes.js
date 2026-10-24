const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const claimController = require('../controllers/claimController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public item listing and details
router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);

// Protected item management (Listing owners)
router.post('/', authenticateToken, upload.single('image'), itemController.createItem);
router.put('/:id', authenticateToken, upload.single('image'), itemController.updateItem);
router.delete('/:id', authenticateToken, itemController.deleteItem);
router.put('/:id/return', authenticateToken, itemController.markAsReturned);

// Item claim / match response submission
router.post('/:id/claim', authenticateToken, claimController.createClaim);

module.exports = router;
