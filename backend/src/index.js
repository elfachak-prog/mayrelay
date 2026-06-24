const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();
require('./config/database');

const authRoutes = require('./routes/auth');
const colisRoutes = require('./routes/colis');
const missionsRoutes = require('./routes/missions');
const casiersRoutes = require('./routes/casiers');
const adminRoutes = require('./routes/admin');
const paiementsRoutes = require('./routes/paiements');
const parametresRoutes = require('./routes/parametres');
const suiviRoutes = require('./routes/suivi');
const livreursRoutes = require('./routes/livreurs');
const smsAdminRoutes = require('./routes/sms_admin');
const inscriptionRoutes = require('./routes/inscription');
const { verifierColisNonRecuperes } = require('./services/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l API MayRelay',
    version: '1.0.0',
    status: 'en ligne'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/colis', colisRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/casiers', casiersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/parametres', parametresRoutes);
app.use('/api/suivi', suiviRoutes);
app.use('/api/livreurs', livreursRoutes);
app.use('/api/admin/sms', smsAdminRoutes);
app.use('/api/inscription', inscriptionRoutes);

if (process.env.NOTIFICATIONS_ACTIVES !== 'false') {
  cron.schedule('0 * * * *', () => {
    console.log('Job cron - verification colis non recuperes');
    verifierColisNonRecuperes();
  });
} else {
  console.log('Notifications automatiques desactivees (NOTIFICATIONS_ACTIVES=false)');
}

const db = require('./config/database');

const TEMPLATES_DEFAUT = [
  { cle: 'depot_destinataire',     label: 'Dépôt — destinataire',      variables: 'nom_destinataire, type, partenaire_nom, zone, reference, horaires',   contenu: 'Bonjour {nom_destinataire}, votre {type} MayRelay est arrive au point relais {partenaire_nom} ({zone}). Reference: {reference}. Suivez: mayrelay.vercel.app/suivi . Horaires: {horaires}' },
  { cle: 'depot_expediteur',       label: 'Dépôt — expéditeur',        variables: 'type, nom_destinataire, reference',                                     contenu: 'MayRelay: Votre envoi de {type} pour {nom_destinataire} a ete enregistre. Reference: {reference}. Le destinataire a ete notifie. Suivez: mayrelay.vercel.app/suivi' },
  { cle: 'recuperation',           label: 'Récupération colis',         variables: 'reference',                                                             contenu: 'MayRelay : Votre colis {reference} a ete recupere. Merci de votre confiance.' },
  { cle: 'rappel_j2_destinataire', label: 'Rappel J+2 — destinataire', variables: 'type, reference',                                                       contenu: 'Rappel MayRelay: Votre {type} {reference} est disponible depuis 2 jours. Il sera garde encore 5 jours. Suivez: mayrelay.vercel.app/suivi' },
  { cle: 'rappel_j2_expediteur',   label: 'Rappel J+2 — expéditeur',   variables: 'reference, nom_destinataire',                                           contenu: 'MayRelay: Votre envoi {reference} pour {nom_destinataire} n a pas ete recupere apres 2 jours. Le destinataire a ete notifie.' },
  { cle: 'retour_expediteur',      label: 'Retour J+7 — expéditeur',   variables: 'reference',                                                             contenu: 'MayRelay: Votre envoi {reference} n a pas ete recupere apres 7 jours. Il a ete retourne a votre point relais.' },
  { cle: 'retour_destinataire',    label: 'Retour J+7 — destinataire', variables: 'type, reference',                                                       contenu: 'MayRelay: Votre {type} {reference} n a pas ete recupere et a ete retourne a l expediteur.' },
];

app.listen(PORT, async () => {
  console.log('Serveur MayRelay demarre sur le port ' + PORT);
  try {
    await db.query('ALTER TABLE livreurs ADD COLUMN IF NOT EXISTS photo_url TEXT');
    console.log('Migration livreurs.photo_url OK');
  } catch (err) {
    console.error('Migration photo_url:', err.message);
  }
  try {
    await db.query('ALTER TABLE livreurs ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION');
    await db.query('ALTER TABLE livreurs ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION');
    await db.query('ALTER TABLE livreurs ADD COLUMN IF NOT EXISTS position_updated_at TIMESTAMP');
    console.log('Migration livreurs.gps OK');
  } catch (err) {
    console.error('Migration livreurs.gps:', err.message);
  }
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      colis_id INTEGER REFERENCES colis(id) ON DELETE SET NULL,
      telephone TEXT NOT NULL,
      message TEXT,
      statut TEXT NOT NULL DEFAULT 'envoye',
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log('Migration notifications OK');
  } catch (err) {
    console.error('Migration notifications:', err.message);
  }
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS config (
      cle TEXT PRIMARY KEY,
      valeur TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS sms_templates (
      cle TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      contenu TEXT NOT NULL,
      variables TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    for (const t of TEMPLATES_DEFAUT) {
      await db.query(
        `INSERT INTO sms_templates (cle, label, contenu, variables)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cle) DO NOTHING`,
        [t.cle, t.label, t.contenu, t.variables]
      );
    }
    console.log('Migration SMS tables OK');
  } catch (err) {
    console.error('Migration SMS:', err.message);
  }
  try {
    await db.query('ALTER TABLE colis ADD COLUMN IF NOT EXISTS archive BOOLEAN DEFAULT FALSE');
    console.log('Migration colis.archive OK');
  } catch (err) {
    console.error('Migration colis.archive:', err.message);
  }
  try {
    await db.query(`INSERT INTO parametres (cle, valeur) VALUES ('logo_url', '') ON CONFLICT (cle) DO NOTHING`);
    console.log('Migration parametres.logo_url OK');
  } catch (err) {
    console.error('Migration logo_url:', err.message);
  }
  try {
    await db.query(`INSERT INTO parametres (cle, valeur) VALUES ('prix_colis_lourd', '8') ON CONFLICT (cle) DO NOTHING`);
    await db.query(`INSERT INTO parametres (cle, valeur) VALUES ('prix_palette', '20') ON CONFLICT (cle) DO NOTHING`);
    await db.query(`INSERT INTO parametres (cle, valeur) VALUES ('majoration_urgence', '30') ON CONFLICT (cle) DO NOTHING`);
    console.log('Migration parametres tarifs OK');
  } catch (err) {
    console.error('Migration parametres tarifs:', err.message);
  }
  try {
    await db.query(`INSERT INTO parametres (cle, valeur) VALUES ('prix_volumineux_base', '8') ON CONFLICT (cle) DO NOTHING`);
    await db.query(`INSERT INTO parametres (cle, valeur) VALUES ('prix_volumineux_par_kg', '1.5') ON CONFLICT (cle) DO NOTHING`);
    console.log('Migration parametres volumineux OK');
  } catch (err) {
    console.error('Migration parametres volumineux:', err.message);
  }
  try {
    await db.query('ALTER TABLE colis ADD COLUMN IF NOT EXISTS poids NUMERIC(6,2)');
    console.log('Migration colis.poids OK');
  } catch (err) {
    console.error('Migration colis.poids:', err.message);
  }
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS demandes_inscription (
      id SERIAL PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('partenaire', 'livreur')),
      statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'accepte', 'refuse')),
      nom TEXT NOT NULL,
      telephone TEXT NOT NULL,
      email TEXT,
      nom_commerce TEXT,
      adresse TEXT,
      quartier TEXT,
      type_commerce TEXT,
      capacite_stockage TEXT,
      zone_couverture TEXT,
      type_vehicule TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log('Migration demandes_inscription OK');
  } catch (err) {
    console.error('Migration demandes_inscription:', err.message);
  }
});
