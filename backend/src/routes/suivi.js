const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await db.query(`
      SELECT 
        c.reference, c.type, c.statut, c.quartier,
        c.nom_destinataire, c.created_at, c.updated_at,
        p.nom as partenaire_nom, p.zone as partenaire_zone,
        p.horaires as partenaire_horaires
      FROM colis c
      LEFT JOIN partenaires p ON c.partenaire_id = p.id
      WHERE c.reference = $1
    `, [reference]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Colis non trouve' });
    }

    res.json({ colis: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
