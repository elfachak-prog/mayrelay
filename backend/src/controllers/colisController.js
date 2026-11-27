const db = require('../config/database');
const QRCode = require('qrcode');
const { envoyerSMS } = require('../config/sms');
const { envoyerEmail } = require('../config/email');
const { envoyerPushARole } = require('../services/pushService');

const genererReference = () => {
  const annee = new Date().getFullYear();
  const numero = Math.floor(Math.random() * 9000) + 1000;
  return "MR-" + annee + "-" + numero;
};

const creerColis = async (req, res) => {
  const { nom_destinataire, prenom_destinataire, telephone_destinataire, telephone2_destinataire, email_destinataire, adresse_destinataire, quartier, type, notes, nom_expediteur, telephone_expediteur, email_expediteur, poids, assurance_niveau, partenaire_destination_id } = req.body;
  try {
    const reference = genererReference();
    const partenaire_id = req.user.id;

    let prix_base;
    if (type === 'Courrier') {
      prix_base = 3.00;
    } else if (type === 'Volumineux') {
      const paramsRes = await db.query("SELECT cle, valeur FROM parametres WHERE cle IN ('prix_volumineux_base','prix_volumineux_par_kg')");
      const p = {};
      paramsRes.rows.forEach(r => { p[r.cle] = parseFloat(r.valeur) || 0; });
      const base = p.prix_volumineux_base || 8;
      const parKg = p.prix_volumineux_par_kg || 1.5;
      const poidsVal = parseFloat(poids) || 0;
      prix_base = poidsVal > 5 ? +(base + (poidsVal - 5) * parKg).toFixed(2) : base;
    } else {
      prix_base = 5.00;
    }

    const niveauMap = { standard: 0.50, premium: 1.50 };
    const assurance_supplement = niveauMap[assurance_niveau] || 0;
    const assurance_niveau_val = ['none', 'standard', 'premium'].includes(assurance_niveau) ? assurance_niveau : 'none';
    const prix = +(prix_base + assurance_supplement).toFixed(2);

    const qrData = JSON.stringify({ reference, partenaire_id });
    const qr_code = await QRCode.toDataURL(qrData);

    const result = await db.query(
      "INSERT INTO colis (reference, partenaire_id, nom_destinataire, prenom_destinataire, telephone_destinataire, telephone2_destinataire, email_destinataire, adresse_destinataire, quartier, type, prix, qr_code, notes, nom_expediteur, telephone_expediteur, email_expediteur, poids, assurance_niveau, assurance_supplement) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *",
      [reference, partenaire_id, nom_destinataire, prenom_destinataire, telephone_destinataire, telephone2_destinataire, email_destinataire, adresse_destinataire || null, quartier, type, prix, qr_code, notes, nom_expediteur, telephone_expediteur, email_expediteur, poids || null, assurance_niveau_val, assurance_supplement]
    );

    const colis = result.rows[0];

    const gain_livreur = parseFloat((prix_base * 0.30).toFixed(2));
    const dest_id = partenaire_destination_id || partenaire_id;
    await db.query(
      "INSERT INTO missions (colis_id, partenaire_depart_id, partenaire_destination_id, statut, gain_livreur) VALUES ($1, $2, $3, 'disponible', $4)",
      [colis.id, partenaire_id, dest_id, gain_livreur]
    );

    const partInfo = await db.query("SELECT nom, zone, horaires FROM partenaires WHERE id = $1", [partenaire_id]);
    const partenaire = partInfo.rows[0];

    const msgDest = "Bonjour " + nom_destinataire + ", votre " + type.toLowerCase() + " MayRelay est arrive au point relais " + partenaire.nom + " (" + partenaire.zone + "). Reference: " + reference + ". Suivez: mayrelay.vercel.app/suivi . Horaires: " + partenaire.horaires;
    await envoyerSMS(telephone_destinataire, msgDest);

    if (telephone2_destinataire) {
      await envoyerSMS(telephone2_destinataire, msgDest);
    }

    if (email_expediteur) {
      const sujet = 'MayRelay – Votre envoi ' + reference + ' a été enregistré';
      const corps = 'Bonjour,\n\nVotre envoi de ' + type.toLowerCase() + ' pour ' + nom_destinataire + ' a été enregistré avec succès.\n\nRéférence : ' + reference + '\nLe destinataire a été notifié par SMS.\n\nSuivi : mayrelay.vercel.app/suivi\n\nL\'équipe MayRelay';
      await envoyerEmail(email_expediteur, sujet, corps).catch(() => {});
    }

    await db.query(
      "INSERT INTO notifications (colis_id, telephone, message, statut) VALUES ($1, $2, $3, $4)",
      [colis.id, telephone_destinataire, msgDest, 'envoye']
    );

    envoyerPushARole('livreur', '🛵 Nouvelle mission disponible', `${type} à livrer — ${partenaire.nom} (${partenaire.zone})`).catch(() => {});

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
