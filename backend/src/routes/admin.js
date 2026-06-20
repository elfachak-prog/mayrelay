const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { envoyerSMS } = require('../config/sms');

const genererMotDePasse = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

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
    const [globales, activite, transactions] = await Promise.all([
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM partenaires)::int                                              AS partenaires,
          (SELECT COUNT(*) FROM livreurs)::int                                                 AS livreurs,
          (SELECT COUNT(*) FROM livreurs WHERE statut = 'actif')::int                          AS livreurs_actifs,
          (SELECT COUNT(*) FROM colis)::int                                                    AS colis_total,
          (SELECT COUNT(*) FROM colis WHERE statut = 'paye')::int                              AS colis_livres,
          (SELECT COUNT(*) FROM missions WHERE statut = 'termine')::int                        AS missions_terminees,
          (SELECT COALESCE(SUM(montant_total), 0) FROM paiements)::numeric                    AS revenus_total,
          (SELECT COALESCE(SUM(montant_total), 0) FROM paiements
           WHERE created_at >= date_trunc('month', NOW()))::numeric                            AS revenus_ce_mois
      `),
      db.query(`
        WITH jours AS (
          SELECT generate_series(
            (NOW() - INTERVAL '6 days')::date,
            NOW()::date,
            '1 day'::interval
          )::date AS jour
        )
        SELECT
          j.jour,
          COUNT(c.id)::int                          AS nb_colis,
          COALESCE(SUM(c.prix::numeric), 0)::numeric AS revenus
        FROM jours j
        LEFT JOIN colis c ON DATE(c.created_at) = j.jour
        GROUP BY j.jour
        ORDER BY j.jour
      `),
      db.query(`
        SELECT
          p.id, p.montant_total, p.avec_livreur, p.created_at,
          c.reference, c.nom_destinataire, c.type,
          pat.nom AS partenaire_nom
        FROM paiements p
        JOIN colis c   ON p.colis_id      = c.id
        JOIN partenaires pat ON p.partenaire_id = pat.id
        ORDER BY p.created_at DESC
        LIMIT 10
      `)
    ]);

    res.json({
      ...globales.rows[0],
      activite_semaine: activite.rows,
      dernieres_transactions: transactions.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/partenaires', async (req, res) => {
  try {
    const result = await db.query('SELECT id, nom, email, telephone, zone, horaires, adresse, latitude, longitude, statut, note, created_at FROM partenaires ORDER BY created_at DESC');
    res.json({ partenaires: result.rows });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.post('/partenaires', async (req, res) => {
  const { nom, email, mot_de_passe, telephone, zone, horaires, adresse, latitude, longitude } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const result = await db.query(
      'INSERT INTO partenaires (nom, email, mot_de_passe, telephone, zone, horaires, adresse, latitude, longitude, statut) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, nom, email, telephone, zone, horaires, adresse, latitude, longitude, statut',
      [nom, email, hashedPassword, telephone, zone, horaires || '08:00-20:00', adresse || null, latitude || null, longitude || null, 'actif']
    );
    res.status(201).json({ message: 'Partenaire cree', partenaire: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Email deja utilise' });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/partenaires/:id', async (req, res) => {
  const { nom, email, mot_de_passe, telephone, zone, horaires, adresse, latitude, longitude } = req.body;
  try {
    let query, params;
    if (mot_de_passe) {
      const hash = await bcrypt.hash(mot_de_passe, 10);
      query = 'UPDATE partenaires SET nom=$1, email=$2, mot_de_passe=$3, telephone=$4, zone=$5, horaires=$6, adresse=$7, latitude=$8, longitude=$9 WHERE id=$10';
      params = [nom, email, hash, telephone, zone, horaires, adresse || null, latitude || null, longitude || null, req.params.id];
    } else {
      query = 'UPDATE partenaires SET nom=$1, email=$2, telephone=$3, zone=$4, horaires=$5, adresse=$6, latitude=$7, longitude=$8 WHERE id=$9';
      params = [nom, email, telephone, zone, horaires, adresse || null, latitude || null, longitude || null, req.params.id];
    }
    await db.query(query, params);
    res.json({ message: 'Partenaire mis a jour' });
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

router.delete('/partenaires/:id', async (req, res) => {
  try {
    const enUsage = await db.query(
      'SELECT COUNT(*) FROM missions WHERE partenaire_depart_id=$1 OR partenaire_destination_id=$1',
      [req.params.id]
    );
    if (parseInt(enUsage.rows[0].count) > 0)
      return res.status(400).json({ message: 'Ce partenaire est associe a des missions existantes' });
    await db.query('DELETE FROM partenaires WHERE id = $1', [req.params.id]);
    res.json({ message: 'Partenaire supprime' });
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
      WHERE c.archive IS NOT TRUE
      ORDER BY c.created_at DESC
    `);
    res.json({ colis: result.rows });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// GET /admin/colis/corbeille — colis archivés
router.get('/colis/corbeille', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, p.nom as partenaire_nom
      FROM colis c
      LEFT JOIN partenaires p ON c.partenaire_id = p.id
      WHERE c.archive = TRUE
      ORDER BY c.updated_at DESC
    `);
    res.json({ colis: result.rows });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// PATCH /admin/colis/:id/archiver — soft delete (archive=true), missions/paiements intacts
router.patch('/colis/:id/archiver', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE colis SET archive = TRUE, updated_at = NOW() WHERE id = $1 AND (archive IS NOT TRUE) RETURNING id',
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Colis introuvable ou déjà archivé' });
    res.json({ message: 'Colis archivé' });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// DELETE /api/admin/colis/purge-test — supprime tous les colis en_attente/en_transit (colis de test)
// DOIT rester avant DELETE /colis/:id pour ne pas être capturé par le paramètre
router.delete('/colis/purge-test', async (req, res) => {
  try {
    const colisRes = await db.query(
      "SELECT id FROM colis WHERE statut IN ('en_attente', 'en_transit')"
    );
    const ids = colisRes.rows.map(r => r.id);
    if (ids.length === 0) return res.json({ supprime: 0, message: 'Aucun colis à supprimer' });

    await db.query('DELETE FROM notifications WHERE colis_id = ANY($1)', [ids]);
    await db.query('DELETE FROM missions WHERE colis_id = ANY($1)', [ids]);
    await db.query('DELETE FROM paiements WHERE colis_id = ANY($1)', [ids]);
    const result = await db.query('DELETE FROM colis WHERE id = ANY($1)', [ids]);

    res.json({ supprime: result.rowCount, message: `${result.rowCount} colis supprimé(s)` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /admin/colis/:id — suppression définitive avec cascade
router.delete('/colis/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide' });
    await db.query('DELETE FROM notifications WHERE colis_id = $1', [id]);
    await db.query('DELETE FROM missions WHERE colis_id = $1', [id]);
    await db.query('DELETE FROM paiements WHERE colis_id = $1', [id]);
    const result = await db.query('DELETE FROM colis WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Colis introuvable' });
    res.json({ message: 'Colis supprimé définitivement' });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// ── Demandes d'inscription ──────────────────────────────────────────

router.get('/demandes', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM demandes_inscription ORDER BY created_at DESC'
    );
    res.json({ demandes: result.rows });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.put('/demandes/:id/refuser', async (req, res) => {
  try {
    const result = await db.query(
      "UPDATE demandes_inscription SET statut='refuse', updated_at=NOW() WHERE id=$1 AND statut='en_attente' RETURNING id",
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Demande introuvable ou déjà traitée' });
    res.json({ message: 'Demande refusée' });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }); }
});

router.post('/demandes/:id/accepter', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM demandes_inscription WHERE id=$1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });
    const d = rows[0];
    if (d.statut !== 'en_attente') return res.status(400).json({ message: 'Demande déjà traitée' });

    const mdp = genererMotDePasse();
    const hash = await bcrypt.hash(mdp, 10);

    if (d.role === 'partenaire') {
      await db.query(
        `INSERT INTO partenaires (nom, email, mot_de_passe, telephone, zone, adresse, horaires, statut)
         VALUES ($1,$2,$3,$4,$5,$6,'08:00-20:00','actif')`,
        [d.nom_commerce || d.nom, d.email, hash, d.telephone, d.quartier || '', d.adresse || null]
      );
    } else {
      await db.query(
        `INSERT INTO livreurs (nom, email, mot_de_passe, telephone, zone, vehicule, statut)
         VALUES ($1,$2,$3,$4,$5,$6,'actif')`,
        [d.nom, d.email, hash, d.telephone, d.zone_couverture || '', d.type_vehicule || '']
      );
    }

    await db.query(
      "UPDATE demandes_inscription SET statut='accepte', updated_at=NOW() WHERE id=$1",
      [d.id]
    );

    const roleLabel = d.role === 'partenaire' ? 'partenaire relais' : 'livreur';
    const emailInfo = d.email ? `Email : ${d.email} — ` : '';
    const smsMsg = `MayRelay : Votre compte ${roleLabel} a ete cree ! ${emailInfo}Mot de passe : ${mdp} — Connectez-vous sur mayrelay.vercel.app`;
    await envoyerSMS(d.telephone, smsMsg);

    res.json({ message: 'Compte créé et identifiants envoyés par SMS', mot_de_passe: mdp });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Un compte avec cet email existe déjà' });
    console.error('Erreur accepter demande:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

// GET /api/admin/carte — partenaires actifs + livreurs en ligne (position < 30 min)
router.get('/carte', async (req, res) => {
  try {
    const [partenaires, livreurs] = await Promise.all([
      db.query(
        `SELECT id, nom, adresse, zone, latitude, longitude
         FROM partenaires
         WHERE statut = 'actif' AND latitude IS NOT NULL AND longitude IS NOT NULL`
      ),
      db.query(
        `SELECT id, nom, zone, vehicule, latitude, longitude, position_updated_at
         FROM livreurs
         WHERE statut = 'actif'
           AND latitude IS NOT NULL AND longitude IS NOT NULL
           AND position_updated_at > NOW() - INTERVAL '30 minutes'`
      ),
    ]);
    res.json({ partenaires: partenaires.rows, livreurs: livreurs.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

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
