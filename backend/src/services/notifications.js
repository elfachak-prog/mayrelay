const db = require('../config/database');
const { envoyerSMS } = require('../config/sms');

const verifierColisNonRecuperes = async () => {
  console.log('Verification des colis non recuperes...');
  const maintenant = new Date();
  try {
    const colis = await db.query("SELECT * FROM colis WHERE statut IN ('en_attente', 'en_transit') AND created_at IS NOT NULL");
    for (const c of colis.rows) {
      const joursEcoules = Math.floor((maintenant - new Date(c.created_at)) / (1000 * 60 * 60 * 24));
      if (joursEcoules >= 2 && !c.date_notification_j2) {
        const msgDest = 'Rappel MayRelay: Votre ' + c.type.toLowerCase() + ' ' + c.reference + ' est disponible depuis 2 jours. Il sera garde encore 5 jours. Suivez: mayrelay.vercel.app/suivi';
        await envoyerSMS(c.telephone_destinataire, msgDest);
        if (c.telephone_expediteur) {
          const msgExp = 'MayRelay: Votre envoi ' + c.reference + ' pour ' + c.nom_destinataire + ' n a pas ete recupere apres 2 jours. Le destinataire a ete notifie.';
          await envoyerSMS(c.telephone_expediteur, msgExp);
        }
        await db.query("UPDATE colis SET date_notification_j2 = NOW() WHERE id = $1", [c.id]);
      }
      if (joursEcoules >= 7 && c.statut !== 'retourne') {
        await db.query("UPDATE colis SET statut = 'retourne', date_retour = NOW() WHERE id = $1", [c.id]);
        if (c.telephone_expediteur) {
          const msgRetour = 'MayRelay: Votre envoi ' + c.reference + ' n a pas ete recupere apres 7 jours. Il a ete retourne a votre point relais.';
          await envoyerSMS(c.telephone_expediteur, msgRetour);
        }
        const msgDestRetour = 'MayRelay: Votre ' + c.type.toLowerCase() + ' ' + c.reference + ' n a pas ete recupere et a ete retourne a l expediteur.';
        await envoyerSMS(c.telephone_destinataire, msgDestRetour);
      }
    }
    console.log('Verification terminee.');
  } catch (err) {
    console.error('Erreur:', err.message);
  }
};

module.exports = { verifierColisNonRecuperes };
