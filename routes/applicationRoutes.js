const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Adopter application routes
router.post('/', verifyToken, applicationController.submitApplication);
router.get('/my', verifyToken, applicationController.getMyApplications);

// Admin review routes
router.get('/', verifyToken, requireAdmin, applicationController.getAllApplications);
router.put('/:id/status', verifyToken, requireAdmin, applicationController.updateApplicationStatus);

module.exports = router;
