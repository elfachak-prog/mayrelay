const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM parametres ORDER BY cle');
    const params = {};
    result.rows.forEach(r => { params[r.cle] = r.valeur; });
    res.json({ parametres: params });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:cle', async (req, res) => {
  try {
    const { valeur } = req.body;
    await db.query(
      `INSERT INTO parametres (cle, valeur, updated_at) VALUES ($2, $1, NOW())
       ON CONFLICT (cle) DO UPDATE SET valeur = $1, updated_at = NOW()`,
      [valeur, req.params.cle]
    );
    res.json({ message: 'Parametre mis a jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
