const webpush = require('web-push');
const db = require('../config/database');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'contact@mayrelay.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const _envoyer = async (sub, payload) => {
  const subscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  try {
    await webpush.sendNotification(subscription, payload);
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await db.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
    }
  }
};

const envoyerPushAUser = async (user_id, user_role, titre, body, data = {}) => {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  try {
    const result = await db.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1 AND user_role = $2',
      [user_id, user_role]
    );
    const payload = JSON.stringify({ titre, body, data });
    await Promise.allSettled(result.rows.map(sub => _envoyer(sub, payload)));
  } catch (err) {
    console.error('Push error:', err.message);
  }
};

const envoyerPushARole = async (role, titre, body, data = {}) => {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  try {
    const result = await db.query(
      'SELECT * FROM push_subscriptions WHERE user_role = $1',
      [role]
    );
    const payload = JSON.stringify({ titre, body, data });
    await Promise.allSettled(result.rows.map(sub => _envoyer(sub, payload)));
  } catch (err) {
    console.error('Push error:', err.message);
  }
};

module.exports = { envoyerPushAUser, envoyerPushARole };
