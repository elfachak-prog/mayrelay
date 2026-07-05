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

router.post('/', auth, async (req, res) => {
  try {
    const { numero, taille } = req.body;
    if (!numero || !taille) return res.status(400).json({ message: 'Numero et taille requis' });
    const existe = await db.query(
      'SELECT id FROM casiers WHERE partenaire_id=$1 AND numero=$2',
      [req.user.id, numero]
    );
    if (existe.rows.length > 0) return res.status(400).json({ message: 'Ce numéro de casier existe déjà' });
    const result = await db.query(
      'INSERT INTO casiers (partenaire_id, numero, taille, statut) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, numero, taille, 'libre']
    );
    res.status(201).json({ casier: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { numero, taille } = req.body;
    if (!numero || !taille) return res.status(400).json({ message: 'Numero et taille requis' });
    const existe = await db.query(
      'SELECT id FROM casiers WHERE partenaire_id=$1 AND numero=$2 AND id<>$3',
      [req.user.id, numero, req.params.id]
    );
    if (existe.rows.length > 0) return res.status(400).json({ message: 'Ce numéro de casier existe déjà' });
    await db.query(
      'UPDATE casiers SET numero=$1, taille=$2 WHERE id=$3 AND partenaire_id=$4',
      [numero, taille, req.params.id, req.user.id]
    );
    res.json({ message: 'Casier mis a jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const casier = await db.query(
      'SELECT * FROM casiers WHERE id=$1 AND partenaire_id=$2',
      [req.params.id, req.user.id]
    );
    if (casier.rows.length === 0) return res.status(404).json({ message: 'Casier introuvable' });
    if (casier.rows[0].statut === 'occupe') return res.status(400).json({ message: 'Impossible de supprimer un casier occupé' });
    await db.query('DELETE FROM casiers WHERE id=$1', [req.params.id]);
    res.json({ message: 'Casier supprime' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id/assigner', auth, async (req, res) => {
  try {
    const { ref } = req.body;
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
