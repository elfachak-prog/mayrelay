const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');
const { envoyerEmail } = require('../config/email');
const {
  creerColis,
  getMesColis,
  getColisByReference,
  updateStatutColis
} = require('../controllers/colisController');

router.post('/', auth, creerColis);
router.get('/', auth, getMesColis);

// Colis à remettre : en transit ou déjà livrés au relais, destinés à ce partenaire
router.get('/reception/a-remettre', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, m.id as mission_id, m.livreur_id,
             p.nom as partenaire_depart_nom
      FROM colis c
      JOIN missions m ON m.colis_id = c.id
      JOIN partenaires p ON m.partenaire_depart_id = p.id
      WHERE m.partenaire_destination_id = $1
        AND c.statut IN ('en_transit', 'livre')
      ORDER BY c.updated_at DESC
    `, [req.user.id]);
    res.json({ colis: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Chercher un colis par QR (référence) pour la réception
router.get('/reception/scan/:reference', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, m.id as mission_id, m.livreur_id,
             p.nom as partenaire_depart_nom
      FROM colis c
      JOIN missions m ON m.colis_id = c.id
      JOIN partenaires p ON m.partenaire_depart_id = p.id
      WHERE c.reference = $1
        AND m.partenaire_destination_id = $2
      LIMIT 1
    `, [req.params.reference, req.user.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Colis introuvable ou non destiné à ce point relais' });
    res.json({ colis: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Confirmer la remise au destinataire → colis 'paye' + paiement + clôture mission + gain livreur
router.post('/reception/remettre/:reference', auth, async (req, res) => {
  try {
    const colisRes = await db.query(`
      SELECT c.*, m.id as mission_id, m.livreur_id, m.gain_livreur
      FROM colis c
      JOIN missions m ON m.colis_id = c.id
      WHERE c.reference = $1 AND m.partenaire_destination_id = $2
      LIMIT 1
    `, [req.params.reference, req.user.id]);

    if (colisRes.rows.length === 0)
      return res.status(404).json({ message: 'Colis introuvable' });

    const colis = colisRes.rows[0];
    if (colis.statut === 'paye')
      return res.status(400).json({ message: 'Ce colis a deja ete remis' });

    const prix = parseFloat(colis.prix);
    const avecLivreur = !!colis.livreur_id;

    const TAUX = avecLivreur
      ? { partenaire_exp: 0.25, partenaire_rec: 0.25, livreur: 0.30, mayrelay: 0.20 }
      : { partenaire_exp: 0.45, partenaire_rec: 0, livreur: 0, mayrelay: 0.55 };

    await db.query(`
      INSERT INTO paiements
        (colis_id, partenaire_id, montant_total, part_partenaire_exp, part_partenaire_rec, part_livreur, part_mayrelay, avec_livreur, statut)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'encaisse')
      ON CONFLICT DO NOTHING
    `, [colis.id, req.user.id, prix,
        +(prix * TAUX.partenaire_exp).toFixed(2),
        +(prix * TAUX.partenaire_rec).toFixed(2),
        +(prix * TAUX.livreur).toFixed(2),
        +(prix * TAUX.mayrelay).toFixed(2),
        avecLivreur]);

    await db.query("UPDATE colis SET statut='paye', updated_at=NOW() WHERE id=$1", [colis.id]);

    // Clôturer la mission et créditer le gain du livreur
    await db.query("UPDATE missions SET statut='termine', updated_at=NOW() WHERE id=$1", [colis.mission_id]);
    if (avecLivreur) {
      await db.query("UPDATE livreurs SET solde = solde + $1 WHERE id=$2", [
        parseFloat(colis.gain_livreur || 0),
        colis.livreur_id
      ]);
    }

    // Email confirmation au destinataire
    if (colis.email_destinataire) {
      const sujet = 'MayRelay – Votre ' + colis.type.toLowerCase() + ' ' + colis.reference + ' a été récupéré';
      const corps = 'Bonjour ' + colis.nom_destinataire + ',\n\nVotre ' + colis.type.toLowerCase() + ' ' + colis.reference + ' a bien été récupéré. Merci d\'avoir choisi MayRelay !\n\nL\'équipe MayRelay';
      await envoyerEmail(colis.email_destinataire, sujet, corps).catch(() => {});
    }

    res.json({ message: 'Remise confirmee', reference: colis.reference });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/:reference', auth, getColisByReference);
router.put('/:reference/statut', auth, updateStatutColis);

module.exports = router;
