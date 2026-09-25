const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', optionalAuth, petController.getAllPets);
router.get('/:id', optionalAuth, petController.getPetById);

// Admin-only routes
router.post('/', verifyToken, requireAdmin, upload.single('image'), petController.createPet);
router.put('/:id', verifyToken, requireAdmin, upload.single('image'), petController.updatePet);
router.delete('/:id', verifyToken, requireAdmin, petController.deletePet);

module.exports = router;
