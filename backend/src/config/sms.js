const twilio = require('twilio');

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

const envoyerSMS = async (telephone, message) => {
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

module.exports = { envoyerSMS };
