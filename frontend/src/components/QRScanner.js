import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const bip = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 1050;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
};

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const runningRef = useRef(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      { fps: 10, qrbox: { width: 280, height: 280 } },
      (decodedText) => {
        if (!runningRef.current) return;
        runningRef.current = false;
        bip();
        scanner.stop()
          .then(() => onScan(decodedText))
          .catch(() => onScan(decodedText));
      },
      () => {}
    )
      .then(() => {
        runningRef.current = true;
        // Zoom matériel si supporté par le navigateur/appareil
        const video = document.querySelector('#qr-reader video');
        if (video?.srcObject) {
          const track = video.srcObject.getVideoTracks()[0];
          const caps = track?.getCapabilities?.();
          if (caps?.zoom) {
            const zoom = Math.min(caps.zoom.max, caps.zoom.min * 3);
            track.applyConstraints({ advanced: [{ zoom }] }).catch(() => {});
          }
        }
      })
      .catch(err => { setErreur('Caméra inaccessible : ' + err); });

    return () => {
      if (runningRef.current) {
        runningRef.current = false;
        scanner.stop().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFermer = () => {
    if (runningRef.current) {
      runningRef.current = false;
      scannerRef.current?.stop().catch(() => {});
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 20, fontFamily: 'sans-serif' }}>📷 Scanner le QR code du colis</div>
      <div id="qr-reader" style={{ width: 300, borderRadius: 12, overflow: 'hidden' }} />
      {erreur && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 16, textAlign: 'center', fontFamily: 'sans-serif' }}>{erreur}</div>}
      <button onClick={handleFermer} style={{ marginTop: 24, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '12px 28px', fontSize: 14, cursor: 'pointer', fontFamily: 'sans-serif' }}>Annuler</button>
    </div>
  );
}
