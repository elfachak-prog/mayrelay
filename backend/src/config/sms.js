const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const envoyerSMS = async (telephone, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telephone
    });
    console.log('SMS envoye - SID:', result.sid);
    return { succes: true, sid: result.sid };
  } catch (err) {
    console.error('Erreur SMS:', err.message);
    return { succes: false, erreur: err.message };
  }
};

module.exports = { envoyerSMS };
