const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getMissionsDisponibles,
  accepterMission,
  confirmerLivraison,
  getMesMissions
} = require('../controllers/missionsController');

router.get('/disponibles', auth, getMissionsDisponibles);
router.get('/mes-missions', auth, getMesMissions);
router.put('/:id/accepter', auth, accepterMission);
router.put('/:id/confirmer', auth, confirmerLivraison);

module.exports = router;
