const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const db = require('../config/database');
const { notificationsActives } = require('../config/sms');

const twilioClient = () => twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function fetchTauxEUR(devise) {
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${devise}`);
    const data = await res.json();
    return data.rates?.EUR ?? null;
  } catch (e) {
    return null;
  }
}

function convertirEUR(montant, taux) {
  if (montant === null || montant === undefined || taux === null) return null;
  return parseFloat((Math.abs(parseFloat(montant)) * taux).toFixed(4));
}

// GET /admin/sms/statut — état global + solde Twilio converti en EUR
router.get('/statut', async (req, res) => {
  try {
    const [actives, statsRes] = await Promise.all([
      notificationsActives(),
      db.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE statut = 'envoye')::int AS envoyes,
          COUNT(*) FILTER (WHERE statut = 'erreur')::int AS erreurs
        FROM notifications
      `)
    ]);

    let solde = null, devise = null, solde_eur = null, taux_eur = null;
    try {
      const bal = await twilioClient().balance.fetch();
      solde = parseFloat(bal.balance);
      devise = bal.currency;
      taux_eur = await fetchTauxEUR(devise);
      solde_eur = convertirEUR(solde, taux_eur);
    } catch (e) {}

    res.json({
      notifications_actives: actives,
      twilio_phone: process.env.TWILIO_PHONE_NUMBER || null,
      solde, devise, solde_eur, taux_eur,
      stats: statsRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /admin/sms/toggle — activer / désactiver les SMS
router.post('/toggle', async (req, res) => {
  try {
    const actuel = await notificationsActives();
    const nouveau = !actuel;
    await db.query(
      `INSERT INTO config (cle, valeur, updated_at) VALUES ('notifications_actives', $1, NOW())
       ON CONFLICT (cle) DO UPDATE SET valeur = $1, updated_at = NOW()`,
      [nouveau.toString()]
    );
    res.json({ notifications_actives: nouveau });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /admin/sms/solde — solde Twilio en temps réel converti en EUR
router.get('/solde', async (req, res) => {
  try {
    const bal = await twilioClient().balance.fetch();
    const solde = parseFloat(bal.balance);
    const devise = bal.currency;
    const taux_eur = await fetchTauxEUR(devise);
    const solde_eur = convertirEUR(solde, taux_eur);
    res.json({ solde, devise, solde_eur, taux_eur });
  } catch (err) {
    res.status(502).json({ message: 'Impossible de joindre Twilio', detail: err.message });
  }
});

// GET /admin/sms/logs — historique SMS (Twilio API + table locale)
router.get('/logs', async (req, res) => {
  try {
    let twilioLogs = [];
    try {
      const messages = await twilioClient().messages.list({ limit: 50 });

      let taux_eur = null;
      if (messages.length > 0 && messages[0].priceUnit) {
        taux_eur = await fetchTauxEUR(messages[0].priceUnit);
      }

      twilioLogs = messages.map(m => ({
        sid: m.sid,
        telephone: m.to,
        corps: m.body,
        statut: m.status,
        cout: m.price ? Math.abs(parseFloat(m.price)).toFixed(4) : null,
        cout_eur: m.price ? convertirEUR(m.price, taux_eur) : null,
        taux_eur,
        date: m.dateSent || m.dateCreated,
        direction: m.direction,
      }));
    } catch (e) {}

    const localRes = await db.query(`
      SELECT n.id, n.telephone, n.message, n.statut, n.created_at,
             c.reference, c.nom_destinataire
      FROM notifications n
      LEFT JOIN colis c ON n.colis_id = c.id
      ORDER BY n.created_at DESC
      LIMIT 50
    `);

    res.json({ twilio: twilioLogs, local: localRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /admin/sms/templates
router.get('/templates', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sms_templates ORDER BY cle');
    res.json({ templates: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /admin/sms/templates/:cle
router.put('/templates/:cle', async (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim()) return res.status(400).json({ message: 'Contenu requis' });
  try {
    const r = await db.query(
      'UPDATE sms_templates SET contenu = $1, updated_at = NOW() WHERE cle = $2 RETURNING cle',
      [contenu.trim(), req.params.cle]
    );
    if (r.rowCount === 0) return res.status(404).json({ message: 'Template introuvable' });
    res.json({ message: 'Template mis a jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
