const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { authenticateToken } = require('../middleware/auth');

// All claim routes require authentication
router.use(authenticateToken);

// Get user's incoming and outgoing claims
router.get('/', claimController.getClaims);

// Approve or reject a claim
router.put('/:id', claimController.updateClaimStatus);

module.exports = router;
