const db = require('../config/database');
const { envoyerSMS } = require('../config/sms');
const { envoyerEmail } = require('../config/email');

const verifierColisNonRecuperes = async () => {
  console.log('Verification des colis non recuperes...');
  const maintenant = new Date();
  try {
    const colis = await db.query("SELECT * FROM colis WHERE statut IN ('en_attente', 'en_transit') AND created_at IS NOT NULL");
    for (const c of colis.rows) {
      const joursEcoules = Math.floor((maintenant - new Date(c.created_at)) / (1000 * 60 * 60 * 24));

      // J+5 : SMS au destinataire + email à l'expéditeur
      if (joursEcoules >= 5 && !c.date_notification_j5) {
        const msgDest = 'Rappel MayRelay: Votre ' + c.type.toLowerCase() + ' ' + c.reference + ' est disponible au point relais. Il sera retourne dans 2 jours. Suivez: mayrelay.vercel.app/suivi';
        await envoyerSMS(c.telephone_destinataire, msgDest);
        if (c.telephone2_destinataire) {
          await envoyerSMS(c.telephone2_destinataire, msgDest);
        }
        if (c.email_expediteur) {
          const sujet = 'MayRelay – Colis ' + c.reference + ' non recupéré (J+5)';
          const corps = 'Bonjour,\n\nVotre envoi ' + c.reference + ' pour ' + c.nom_destinataire + ' n\'a pas été récupéré après 5 jours. Le destinataire a été relancé par SMS.\n\nSi le colis n\'est pas récupéré dans 2 jours, il sera retourné à votre point relais.\n\nSuivi : mayrelay.vercel.app/suivi\n\nL\'équipe MayRelay';
          await envoyerEmail(c.email_expediteur, sujet, corps);
        }
        await db.query("UPDATE colis SET date_notification_j5 = NOW() WHERE id = $1", [c.id]);
      }

      // J+7 : retour + SMS à l'expéditeur + email au destinataire
      if (joursEcoules >= 7 && c.statut !== 'retourne') {
        await db.query("UPDATE colis SET statut = 'retourne', date_retour = NOW() WHERE id = $1", [c.id]);
        if (c.telephone_expediteur) {
          const msgRetour = 'MayRelay: Votre envoi ' + c.reference + ' n a pas ete recupere apres 7 jours. Il a ete retourne a votre point relais.';
          await envoyerSMS(c.telephone_expediteur, msgRetour);
        }
        if (c.email_destinataire) {
          const sujet = 'MayRelay – Votre ' + c.type.toLowerCase() + ' ' + c.reference + ' a été retourné';
          const corps = 'Bonjour ' + c.nom_destinataire + ',\n\nVotre ' + c.type.toLowerCase() + ' ' + c.reference + ' n\'a pas été récupéré au point relais et a été retourné à l\'expéditeur.\n\nSuivi : mayrelay.vercel.app/suivi\n\nL\'équipe MayRelay';
          await envoyerEmail(c.email_destinataire, sujet, corps);
        }
      }
    }
    console.log('Verification terminee.');
  } catch (err) {
    console.error('Erreur:', err.message);
  }
};

module.exports = { verifierColisNonRecuperes };
