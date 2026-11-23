import { useState, useEffect } from 'react';
import API from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export default function usePushNotifications() {
  const [abonne, setAbonne] = useState(false);
  const [supported, setSupported] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      navigator.serviceWorker.register('/sw.js').then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setAbonne(!!sub);
      }).catch(() => {});
    }
  }, []);

  const sAbonner = async () => {
    setChargement(true);
    try {
      const { data } = await API.get('/push/vapid-public-key');
      if (!data.publicKey) throw new Error('Clé VAPID manquante');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
      await API.post('/push/subscribe', sub.toJSON());
      setAbonne(true);
    } catch (err) {
      console.error('Erreur abonnement push:', err);
    }
    setChargement(false);
  };

  const seDesabonner = async () => {
    setChargement(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await API.post('/push/unsubscribe', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setAbonne(false);
    } catch (err) {
      console.error('Erreur désabonnement push:', err);
    }
    setChargement(false);
  };

  return { abonne, supported, chargement, sAbonner, seDesabonner };
}
