const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');

const TAUX = {
  partenaire_exp: 0.25,
  partenaire_rec: 0.25,
  livreur: 0.30,
  mayrelay: 0.20
};

const TAUX_SANS_LIVREUR = {
  partenaire: 0.45,
  mayrelay: 0.55
};

router.post('/enregistrer/:colis_id', auth, async (req, res) => {
  try {
    const { colis_id } = req.params;
    const { avec_livreur } = req.body;

    const colisRes = await db.query('SELECT * FROM colis WHERE id = $1', [colis_id]);
    if (colisRes.rows.length === 0) return res.status(404).json({ message: 'Colis non trouve' });

    const colis = colisRes.rows[0];
    const prix = parseFloat(colis.prix);

    let paiementData;
    if (avec_livreur) {
      paiementData = {
        part_partenaire_exp: +(prix * TAUX.partenaire_exp).toFixed(2),
        part_partenaire_rec: +(prix * TAUX.partenaire_rec).toFixed(2),
        part_livreur: +(prix * TAUX.livreur).toFixed(2),
        part_mayrelay: +(prix * TAUX.mayrelay).toFixed(2),
      };
    } else {
      paiementData = {
        part_partenaire_exp: +(prix * TAUX_SANS_LIVREUR.partenaire).toFixed(2),
        part_partenaire_rec: 0,
        part_livreur: 0,
        part_mayrelay: +(prix * TAUX_SANS_LIVREUR.mayrelay).toFixed(2),
      };
    }

    const result = await db.query(
      `INSERT INTO paiements 
        (colis_id, partenaire_id, montant_total, part_partenaire_exp, part_partenaire_rec, part_livreur, part_mayrelay, avec_livreur, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'encaisse')
       RETURNING *`,
      [colis_id, colis.partenaire_id, prix, paiementData.part_partenaire_exp, paiementData.part_partenaire_rec, paiementData.part_livreur, paiementData.part_mayrelay, avec_livreur]
    );

    await db.query('UPDATE colis SET statut = $1 WHERE id = $2', ['paye', colis_id]);

    res.status(201).json({ message: 'Paiement enregistre', paiement: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/stats-partenaire', auth, async (req, res) => {
  try {
    const debut_mois = new Date();
    debut_mois.setDate(1); debut_mois.setHours(0, 0, 0, 0);

    const soldeRes = await db.query(`
      SELECT COALESCE(SUM(part_partenaire_exp + part_partenaire_rec), 0) as solde
      FROM paiements
      WHERE partenaire_id = $1 AND statut = 'encaisse'
    `, [req.user.id]);

    const revenusRes = await db.query(`
      SELECT COALESCE(SUM(part_partenaire_exp + part_partenaire_rec), 0) as revenus
      FROM paiements
      WHERE partenaire_id = $1 AND created_at >= $2
    `, [req.user.id, debut_mois]);

    const colisRes = await db.query(`
      SELECT COUNT(*) as nb
      FROM colis
      WHERE partenaire_id = $1 AND created_at >= $2
    `, [req.user.id, debut_mois]);

    res.json({
      solde_disponible: parseFloat(soldeRes.rows[0].solde).toFixed(2),
      revenus_mois: parseFloat(revenusRes.rows[0].revenus).toFixed(2),
      colis_mois: parseInt(colisRes.rows[0].nb),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/mes-paiements', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.reference, c.type, c.nom_destinataire, c.quartier
      FROM paiements p
      JOIN colis c ON p.colis_id = c.id
      WHERE p.partenaire_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    const total_du = result.rows
      .filter(p => p.statut === 'encaisse')
      .reduce((sum, p) => sum + parseFloat(p.part_mayrelay), 0);

    res.json({ paiements: result.rows, total_du: total_du.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/admin/tous', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.reference, c.type, c.nom_destinataire,
        pat.nom as partenaire_nom
      FROM paiements p
      JOIN colis c ON p.colis_id = c.id
      JOIN partenaires pat ON p.partenaire_id = pat.id
      ORDER BY p.created_at DESC
    `);

    const par_partenaire = await db.query(`
      SELECT pat.id, pat.nom, pat.email,
        SUM(p.part_mayrelay) as total_du,
        COUNT(p.id) as nb_colis
      FROM paiements p
      JOIN partenaires pat ON p.partenaire_id = pat.id
      WHERE p.statut = 'encaisse'
      GROUP BY pat.id, pat.nom, pat.email
      ORDER BY total_du DESC
    `);

    res.json({ paiements: result.rows, par_partenaire: par_partenaire.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/admin/confirmer/:partenaire_id', auth, async (req, res) => {
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

module.exports = router;
