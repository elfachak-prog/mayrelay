const nodemailer = require('nodemailer');

const isConfigured = () => !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

const envoyerEmail = async (destinataire, sujet, texte) => {
  if (!destinataire) return { succes: false, raison: 'Pas de destinataire' };
  if (!isConfigured()) {
    console.log('Email non configure - non envoye vers:', destinataire);
    return { succes: false, raison: 'Non configure' };
  }
  try {
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    await transport.sendMail({ from, to: destinataire, subject: sujet, text: texte });
    console.log('Email envoye a:', destinataire);
    return { succes: true };
  } catch (err) {
    console.error('Erreur email:', err.message);
    return { succes: false, erreur: err.message };
  }
};

module.exports = { envoyerEmail };
