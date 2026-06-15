const twilio = require('twilio');
const db = require('./database');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const formaterNumero = (numero) => {
  const nettoye = numero.replace(/\s/g, '').replace(/\./g, '').replace(/-/g, '');
  if (nettoye.startsWith('+')) return nettoye;
  if (nettoye.startsWith('00')) return '+' + nettoye.slice(2);
  if (nettoye.startsWith('0')) return '+262' + nettoye.slice(1);
  return '+' + nettoye;
};

const notificationsActives = async () => {
  try {
    const res = await db.query("SELECT valeur FROM config WHERE cle = 'notifications_actives'");
    if (res.rows.length > 0) return res.rows[0].valeur === 'true';
  } catch (e) {}
  return process.env.NOTIFICATIONS_ACTIVES !== 'false';
};

const renderTemplate = async (cle, vars = {}) => {
  try {
    const res = await db.query('SELECT contenu FROM sms_templates WHERE cle = $1', [cle]);
    if (res.rows.length === 0) return null;
    let msg = res.rows[0].contenu;
    Object.entries(vars).forEach(([k, v]) => {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), v || '');
    });
    return msg;
  } catch (e) { return null; }
};

const envoyerSMS = async (telephone, message) => {
  const actives = await notificationsActives();
  if (!actives) {
    console.log('SMS desactivees (config) - non envoye vers:', telephone);
    return { succes: false, desactive: true };
  }
  try {
    const numeroFormate = formaterNumero(telephone);
    console.log('Envoi SMS vers:', numeroFormate);
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: numeroFormate
    });
    console.log('SMS envoye - SID:', result.sid);
    return { succes: true, sid: result.sid };
  } catch (err) {
    console.error('Erreur SMS:', err.message);
    return { succes: false, erreur: err.message };
  }
};

module.exports = { envoyerSMS, renderTemplate, notificationsActives };
