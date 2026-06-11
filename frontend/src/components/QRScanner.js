import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const runningRef = useRef(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 200, height: 200 } },
      (decodedText) => {
        if (!runningRef.current) return;
        runningRef.current = false;
        scanner.stop()
          .then(() => onScan(decodedText))
          .catch(() => onScan(decodedText));
      },
      () => {}
    )
      .then(() => {
        runningRef.current = true;
        // Zoom automatique pour lire les QR codes à distance
        const video = document.querySelector('#qr-reader video');
        if (video?.srcObject) {
          const track = video.srcObject.getVideoTracks()[0];
          const caps = track?.getCapabilities?.();
          if (caps?.zoom) {
            const zoom = Math.min(caps.zoom.max, caps.zoom.min * 2.5);
            track.applyConstraints({ advanced: [{ zoom }] }).catch(() => {});
          }
        }
      })
      .catch(err => { setErreur('Camera inaccessible: ' + err); });

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
