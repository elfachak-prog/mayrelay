const express = require('express');
const router = express.Router();
const db = require('../config/database');

// POST /api/inscription — demande publique (aucune auth)
router.post('/', async (req, res) => {
  const {
    role,
    // partenaire
    nom_commerce, adresse, quartier, type_commerce, capacite_stockage,
    // livreur
    nom, zone_couverture, type_vehicule,
    // communs
    telephone, email,
  } = req.body;

  if (!role || !['partenaire', 'livreur'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }
  if (!telephone) {
    return res.status(400).json({ message: 'Le téléphone est obligatoire' });
  }
  if (role === 'partenaire' && !nom_commerce) {
    return res.status(400).json({ message: 'Le nom du commerce est obligatoire' });
  }
  if (role === 'livreur' && !nom) {
    return res.status(400).json({ message: 'Le nom complet est obligatoire' });
  }

  try {
    await db.query(
      `INSERT INTO demandes_inscription
        (role, nom, telephone, email, nom_commerce, adresse, quartier, type_commerce, capacite_stockage, zone_couverture, type_vehicule)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        role,
        role === 'livreur' ? nom : nom_commerce,
        telephone,
        email || null,
        role === 'partenaire' ? nom_commerce : null,
        adresse || null,
        quartier || null,
        type_commerce || null,
        capacite_stockage || null,
        zone_couverture || null,
        type_vehicule || null,
      ]
    );
    res.status(201).json({ message: 'Demande envoyée avec succès. Nous vous contacterons par SMS.' });
  } catch (err) {
    console.error('Erreur inscription:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
