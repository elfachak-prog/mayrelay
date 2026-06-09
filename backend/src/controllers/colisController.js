const db = require('../config/database');
const QRCode = require('qrcode');
const { envoyerSMS } = require('../config/sms');

const genererReference = () => {
  const annee = new Date().getFullYear();
  const numero = Math.floor(Math.random() * 9000) + 1000;
  return "MR-" + annee + "-" + numero;
};

const creerColis = async (req, res) => {
  const { nom_destinataire, prenom_destinataire, telephone_destinataire, telephone2_destinataire, email_destinataire, quartier, type, notes, nom_expediteur, telephone_expediteur, email_expediteur } = req.body;
  try {
    const reference = genererReference();
    const prix = type === 'Courrier' ? 3.00 : 5.00;
    const partenaire_id = req.user.id;
    const qrData = JSON.stringify({ reference, partenaire_id });
    const qr_code = await QRCode.toDataURL(qrData);

    const result = await db.query(
      "INSERT INTO colis (reference, partenaire_id, nom_destinataire, prenom_destinataire, telephone_destinataire, telephone2_destinataire, email_destinataire, quartier, type, prix, qr_code, notes, nom_expediteur, telephone_expediteur, email_expediteur) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *",
      [reference, partenaire_id, nom_destinataire, prenom_destinataire, telephone_destinataire, telephone2_destinataire, email_destinataire, quartier, type, prix, qr_code, notes, nom_expediteur, telephone_expediteur, email_expediteur]
    );

    const colis = result.rows[0];

    const gain_livreur = parseFloat((prix * 0.30).toFixed(2));
    await db.query(
      "INSERT INTO missions (colis_id, partenaire_depart_id, partenaire_destination_id, statut, gain_livreur) VALUES ($1, $2, $2, 'disponible', $3)",
      [colis.id, partenaire_id, gain_livreur]
    );

    const partInfo = await db.query("SELECT nom, zone, horaires FROM partenaires WHERE id = $1", [partenaire_id]);
    const partenaire = partInfo.rows[0];

    const msgDest = "Bonjour " + nom_destinataire + ", votre " + type.toLowerCase() + " MayRelay est arrive au point relais " + partenaire.nom + " (" + partenaire.zone + "). Reference: " + reference + ". Suivez: mayrelay.vercel.app/suivi . Horaires: " + partenaire.horaires;
    await envoyerSMS(telephone_destinataire, msgDest);

    if (telephone2_destinataire) {
      await envoyerSMS(telephone2_destinataire, msgDest);
    }

    if (telephone_expediteur) {
      const msgExp = "MayRelay: Votre envoi de " + type.toLowerCase() + " pour " + nom_destinataire + " a ete enregistre. Reference: " + reference + ". Le destinataire a ete notifie. Suivez: mayrelay.vercel.app/suivi";
      await envoyerSMS(telephone_expediteur, msgExp);
    }

    await db.query(
      "INSERT INTO notifications (colis_id, telephone, message, statut) VALUES ($1, $2, $3, $4)",
      [colis.id, telephone_destinataire, msgDest, 'envoye']
    );

    res.status(201).json({ message: 'Colis enregistre avec succes', colis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getMesColis = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM colis WHERE partenaire_id = $1 ORDER BY created_at DESC", [req.user.id]);
    res.json({ colis: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getColisByReference = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM colis WHERE reference = $1", [req.params.reference]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Colis non trouve' });
    res.json({ colis: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateStatutColis = async (req, res) => {
  try {
    const result = await db.query(
      "UPDATE colis SET statut = $1, updated_at = NOW() WHERE reference = $2 RETURNING *",
      [req.body.statut, req.params.reference]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Colis non trouve' });
    res.json({ message: 'Statut mis a jour', colis: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { creerColis, getMesColis, getColisByReference, updateStatutColis };
