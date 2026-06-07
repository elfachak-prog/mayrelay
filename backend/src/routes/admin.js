const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  try {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    const admin = result.rows[0];
    const valid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'mayrelay_secret_key_2024',
      { expiresIn: '7d' }
    );
    res.json({ message: 'Connexion admin reussie', token, user: { id: admin.id, nom: admin.nom, email: admin.email, role: 'admin' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const partenaires = await db.query('SELECT COUNT(*) FROM partenaires');
    const livreurs = await db.query('SELECT COUNT(*) FROM livreurs');
    const colis = await db.query('SELECT COUNT(*) FROM colis');
    const missions = await db.query('SELECT COUNT(*) FROM missions');
    res.json({
      partenaires: parseInt(partenaires.rows[0].count),
      livreurs: parseInt(livreurs.rows[0].count),
      colis: parseInt(colis.rows[0].count),
      missions: parseInt(missions.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
