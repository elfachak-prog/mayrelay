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
const { verifierColisNonRecuperes } = require('./services/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

if (process.env.NOTIFICATIONS_ACTIVES !== 'false') {
  cron.schedule('0 * * * *', () => {
    console.log('Job cron - verification colis non recuperes');
    verifierColisNonRecuperes();
  });
} else {
  console.log('Notifications automatiques desactivees (NOTIFICATIONS_ACTIVES=false)');
}

const db = require('./config/database');

app.listen(PORT, async () => {
  console.log('Serveur MayRelay demarre sur le port ' + PORT);
  try {
    await db.query('ALTER TABLE livreurs ADD COLUMN IF NOT EXISTS photo_url TEXT');
    console.log('Migration livreurs.photo_url OK');
  } catch (err) {
    console.error('Migration photo_url:', err.message);
  }
});
