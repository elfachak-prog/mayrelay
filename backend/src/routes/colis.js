const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  creerColis,
  getMesColis,
  getColisByReference,
  updateStatutColis
} = require('../controllers/colisController');

router.post('/', auth, creerColis);
router.get('/', auth, getMesColis);
router.get('/:reference', auth, getColisByReference);
router.put('/:reference/statut', auth, updateStatutColis);

module.exports = router;
