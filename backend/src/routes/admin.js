const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  try {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    const admin = result.rows[0];
    const valid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET || 'mayrelay_secret_key_2024', { expiresIn: '7d' });
    res.json({ message: 'Connexion admin reussie', token, user: { id: admin.id, nom: admin.nom, email: admin.email, role: 'admin' } });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
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
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.get('/partenaires', async (req, res) => {
  try {
    const result = await db.query('SELECT id, nom, email, telephone, zone, horaires, statut, note, created_at FROM partenaires ORDER BY created_at DESC');
    res.json({ partenaires: result.rows });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.post('/partenaires', async (req, res) => {
  const { nom, email, mot_de_passe, telephone, zone, horaires } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const result = await db.query(
      'INSERT INTO partenaires (nom, email, mot_de_passe, telephone, zone, horaires, statut) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nom, email, telephone, zone, horaires, statut',
      [nom, email, hashedPassword, telephone, zone, horaires || '08:00-20:00', 'actif']
    );
    res.status(201).json({ message: 'Partenaire cree avec succes', partenaire: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Email deja utilise' });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/partenaires/:id/statut', async (req, res) => {
  try {
    const { statut } = req.body;
    await db.query('UPDATE partenaires SET statut = $1 WHERE id = $2', [statut, req.params.id]);
    res.json({ message: 'Statut mis a jour' });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.get('/livreurs', async (req, res) => {
  try {
    const result = await db.query('SELECT id, nom, email, telephone, zone, vehicule, statut, note, solde, created_at FROM livreurs ORDER BY created_at DESC');
    res.json({ livreurs: result.rows });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.put('/livreurs/:id/statut', async (req, res) => {
  try {
    const { statut } = req.body;
    await db.query('UPDATE livreurs SET statut = $1 WHERE id = $2', [statut, req.params.id]);
    res.json({ message: 'Statut mis a jour' });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.get('/colis', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, p.nom as partenaire_nom 
      FROM colis c 
      LEFT JOIN partenaires p ON c.partenaire_id = p.id 
      ORDER BY c.created_at DESC
    `);
    res.json({ colis: result.rows });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

module.exports = router;

router.get('/finance', async (req, res) => {
  try {
    const total = await db.query(`
      SELECT 
        SUM(part_mayrelay) as total_encaisse,
        SUM(CASE WHEN statut = 'encaisse' THEN part_mayrelay ELSE 0 END) as total_a_recevoir,
        SUM(CASE WHEN statut = 'reverse' THEN part_mayrelay ELSE 0 END) as total_recu
      FROM paiements
    `);

    const par_partenaire = await db.query(`
      SELECT 
        pat.id, pat.nom, pat.email, pat.telephone, pat.zone,
        COUNT(p.id) as nb_colis,
        SUM(p.montant_total) as volume_total,
        SUM(p.part_mayrelay) as total_du,
        SUM(CASE WHEN p.statut = 'encaisse' THEN p.part_mayrelay ELSE 0 END) as montant_a_recevoir,
        SUM(CASE WHEN p.statut = 'reverse' THEN p.part_mayrelay ELSE 0 END) as montant_recu
      FROM partenaires pat
      LEFT JOIN paiements p ON pat.id = p.partenaire_id
      GROUP BY pat.id, pat.nom, pat.email, pat.telephone, pat.zone
      ORDER BY montant_a_recevoir DESC
    `);

    res.json({ 
      totaux: total.rows[0],
      par_partenaire: par_partenaire.rows 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/finance/confirmer/:partenaire_id', async (req, res) => {
  try {
    await db.query(
      `UPDATE paiements SET statut = 'reverse', updated_at = NOW() 
       WHERE partenaire_id = $1 AND statut = 'encaisse'`,
      [req.params.partenaire_id]
    );
    res.json({ message: 'Reversement confirme' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
