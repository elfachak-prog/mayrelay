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

const TEMPLATES_SMS = [
  { cle: 'depot_destinataire',     label: 'SMS Dépôt — destinataire',    variables: 'nom_destinataire, type, partenaire_nom, zone, reference, horaires', contenu: 'Bonjour {nom_destinataire}, votre {type} MayRelay est arrive au point relais {partenaire_nom} ({zone}). Reference: {reference}. Suivez: mayrelay.vercel.app/suivi . Horaires: {horaires}' },
  { cle: 'rappel_j5_destinataire', label: 'SMS Rappel J+5 — destinataire', variables: 'type, reference',                                                contenu: 'Rappel MayRelay: Votre {type} {reference} est disponible au point relais. Il sera retourne dans 2 jours. Suivez: mayrelay.vercel.app/suivi' },
  { cle: 'retour_expediteur',      label: 'SMS Retour J+7 — expéditeur',  variables: 'reference',                                                        contenu: 'MayRelay: Votre envoi {reference} n a pas ete recupere apres 7 jours. Il a ete retourne a votre point relais.' },
];

app.listen(PORT, async () => {
  console.log('Serveur MayRelay demarre sur le port ' + PORT);
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS parametres (
      cle TEXT PRIMARY KEY,
      valeur TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.query('ALTER TABLE parametres ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()');
    console.log('Migration parametres schema OK');
  } catch (err) {
    console.error('Migration parametres schema:', err.message);
  }
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
    // Supprimer les anciens templates SMS devenus inutiles (remplacés par email)
    await db.query(`DELETE FROM sms_templates WHERE cle IN ('depot_expediteur','recuperation','rappel_j2_destinataire','rappel_j2_expediteur','retour_destinataire')`);
    for (const t of TEMPLATES_SMS) {
      await db.query(
        `INSERT INTO sms_templates (cle, label, contenu, variables)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cle) DO UPDATE SET label = $2, variables = $4`,
        [t.cle, t.label, t.contenu, t.variables]
      );
    }
    console.log('Migration SMS tables OK');
  } catch (err) {
    console.error('Migration SMS:', err.message);
  }
  try {
    await db.query('ALTER TABLE colis ADD COLUMN IF NOT EXISTS date_notification_j5 TIMESTAMP');
    console.log('Migration colis.date_notification_j5 OK');
  } catch (err) {
    console.error('Migration colis.date_notification_j5:', err.message);
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
