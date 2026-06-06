const db = require('../config/database');
const QRCode = require('qrcode');
const { envoyerSMS } = require('../config/sms');

const genererReference = () => {
  const date = new Date();
  const annee = date.getFullYear();
  const numero = Math.floor(Math.random() * 9000) + 1000;
  return `MR-${annee}-${numero}`;
};

const creerColis = async (req, res) => {
  const {
    nom_destinataire,
    prenom_destinataire,
    telephone_destinataire,
    telephone2_destinataire,
    email_destinataire,
    quartier,
    type,
    notes
  } = req.body;

  try {
    const reference = genererReference();
    const prix = type === 'Courrier' ? 3.00 : 5.00;
    const partenaire_id = req.user.id;

    const qrData = JSON.stringify({ reference, partenaire_id });
    const qr_code = await QRCode.toDataURL(qrData);

    const result = await db.query(
      `INSERT INTO colis 
        (reference, partenaire_id, nom_destinataire, prenom_destinataire, 
         telephone_destinataire, telephone2_destinataire, email_destinataire, 
         quartier, type, prix, qr_code, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [reference, partenaire_id, nom_destinataire, prenom_destinataire,
       telephone_destinataire, telephone2_destinataire, email_destinataire,
       quartier, type, prix, qr_code, notes]
    );

    const colis = result.rows[0];

    const message = `Bonjour ${nom_destinataire}, votre ${type.toLowerCase()} MayRelay est arrive au point relais de ${quartier}. Reference: ${reference}. Venez le recuperer avec cette reference. Merci`;

    const smsResult = await envoyerSMS(telephone_destinataire, message);

    await db.query(
      'INSERT INTO notifications (colis_id, telephone, message, statut) VALUES ($1, $2, $3, $4)',
      [colis.id, telephone_destinataire, message, smsResult.succes ? 'envoye' : 'echec']
    );

    res.status(201).json({
      message: 'Colis enregistre avec succes',
      colis,
      sms: smsResult.succes ? 'SMS envoye au destinataire' : 'SMS en attente'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getMesColis = async (req, res) => {
  try {
    const partenaire_id = req.user.id;
    const result = await db.query(
      'SELECT * FROM colis WHERE partenaire_id = $1 ORDER BY created_at DESC',
      [partenaire_id]
    );
    res.json({ colis: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getColisByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await db.query(
      'SELECT * FROM colis WHERE reference = $1',
      [reference]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Colis non trouve' });
    }
    res.json({ colis: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateStatutColis = async (req, res) => {
  try {
    const { reference } = req.params;
    const { statut } = req.body;

    const result = await db.query(
      'UPDATE colis SET statut = $1, updated_at = NOW() WHERE reference = $2 RETURNING *',
      [statut, reference]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Colis non trouve' });
    }

    res.json({
      message: 'Statut mis a jour',
      colis: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { creerColis, getMesColis, getColisByReference, updateStatutColis };
