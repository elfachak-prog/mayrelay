const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, co.reference, co.nom_destinataire 
       FROM casiers c
       LEFT JOIN colis co ON c.colis_id = co.id
       WHERE c.partenaire_id = $1
       ORDER BY c.numero`,
      [req.user.id]
    );
    res.json({ casiers: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id/assigner', auth, async (req, res) => {
  try {
    const { ref, nom } = req.body;
    const colis = await db.query('SELECT id FROM colis WHERE reference = $1', [ref]);
    if (colis.rows.length === 0) {
      return res.status(404).json({ message: 'Colis non trouve' });
    }
    await db.query(
      'UPDATE casiers SET statut = $1, colis_id = $2 WHERE id = $3',
      ['occupe', colis.rows[0].id, req.params.id]
    );
    res.json({ message: 'Casier assigne' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id/liberer', auth, async (req, res) => {
  try {
    await db.query(
      'UPDATE casiers SET statut = $1, colis_id = NULL WHERE id = $2',
      ['libre', req.params.id]
    );
    res.json({ message: 'Casier libere' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
