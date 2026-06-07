const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/database');

const authRoutes = require('./routes/auth');
const colisRoutes = require('./routes/colis');
const missionsRoutes = require('./routes/missions');
const casiersRoutes = require('./routes/casiers');
const adminRoutes = require('./routes/admin');

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

app.listen(PORT, () => {
  console.log('Serveur MayRelay demarre sur le port ' + PORT);
});
