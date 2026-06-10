import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [erreur, setErreur] = useState('');
  const [actif, setActif] = useState(false);

  const demarrerScanner = useCallback(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => { scanner.stop().then(() => { onScan(decodedText); }); },
      () => {}
    ).then(() => { setActif(true); }).catch(err => { setErreur('Camera inaccessible: ' + err); });
  }, [onScan]);

  useEffect(() => {
    demarrerScanner();
    return () => { if (scannerRef.current && actif) { scannerRef.current.stop().catch(() => {}); } };
  }, [demarrerScanner, actif]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 20, fontFamily: 'sans-serif' }}>📷 Scanner le QR code du colis</div>
      <div id="qr-reader" style={{ width: 300, borderRadius: 12, overflow: 'hidden' }} />
      {erreur && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 16, textAlign: 'center', fontFamily: 'sans-serif' }}>{erreur}</div>}
      <button onClick={() => { if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); } onClose(); }} style={{ marginTop: 24, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '12px 28px', fontSize: 14, cursor: 'pointer', fontFamily: 'sans-serif' }}>Annuler</button>
    </div>
  );
}
