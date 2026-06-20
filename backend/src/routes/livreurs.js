const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');

// GET /api/livreurs/profil — infos + stats agrégées
router.get('/profil', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.id, l.nom, l.email, l.telephone, l.zone, l.vehicule, l.statut, l.photo_url,
              COUNT(m.id) FILTER (WHERE m.statut = 'termine') AS nb_missions,
              COALESCE(SUM(m.gain_livreur) FILTER (WHERE m.statut = 'termine'), 0) AS gains_totaux,
              COALESCE(AVG(m.note_partenaire) FILTER (WHERE m.statut = 'termine' AND m.note_partenaire IS NOT NULL), 0) AS note_moyenne
       FROM livreurs l
       LEFT JOIN missions m ON m.livreur_id = l.id
       WHERE l.id = $1
       GROUP BY l.id`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Livreur introuvable' });
    res.json({ profil: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/livreurs/position — enregistrer la position GPS du livreur
router.post('/position', auth, async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude == null || longitude == null) return res.status(400).json({ message: 'Coordonnees manquantes' });
  try {
    await db.query(
      'UPDATE livreurs SET latitude=$1, longitude=$2, position_updated_at=NOW() WHERE id=$3',
      [latitude, longitude, req.user.id]
    );
    res.json({ message: 'Position mise a jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/livreurs/profil/photo — mettre à jour l'URL de photo
router.put('/profil/photo', auth, async (req, res) => {
  const { photo_url } = req.body;
  try {
    await db.query(
      'UPDATE livreurs SET photo_url = $1 WHERE id = $2',
      [photo_url || null, req.user.id]
    );
    res.json({ message: 'Photo mise a jour' });
  } catch (err) {
    if (err.code === '42703') {
      return res.status(400).json({ message: 'Colonne photo_url inexistante — migration requise' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
