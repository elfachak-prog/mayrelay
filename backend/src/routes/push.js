const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Données de subscription invalides' });
    }
    await db.query(`
      INSERT INTO push_subscriptions (user_id, user_role, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = $1, user_role = $2, p256dh = $4, auth = $5, updated_at = NOW()
    `, [req.user.id, req.user.role, endpoint, keys.p256dh, keys.auth]);
    res.json({ message: 'Abonnement enregistré' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await db.query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [endpoint, req.user.id]
    );
    res.json({ message: 'Désabonnement effectué' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
