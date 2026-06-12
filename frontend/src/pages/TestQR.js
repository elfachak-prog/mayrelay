import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import QRScanner from '../components/QRScanner';

const C = {
  bg: '#F4F7FA',
  card: '#fff',
  border: '#E2E8F0',
  navy: '#0D1F2D',
  accent: '#E8613A',
  green: '#22C55E',
  red: '#EF4444',
  muted: '#64748B',
};

export default function TestQR() {
  const [qrTestImg, setQrTestImg] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [resultat, setResultat] = useState('');

  useEffect(() => {
    QRCode.toDataURL(JSON.stringify({ reference: 'MR-TEST-0000', partenaire_id: 0 }), { width: 220, margin: 2 })
      .then(url => setQrTestImg(url));
  }, []);

  const handleScan = (texte) => {
    setShowScanner(false);
    setResultat(texte);
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 6 }}>🧪 Test QR Code</div>
      <div style={{ fontSize: 14, color: C.muted, fontFamily: 'sans-serif', marginBottom: 28 }}>
        Testez le scanner sans envoyer de SMS ni toucher la base de données.
      </div>

      {/* QR code de démonstration */}
      <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif', marginBottom: 6 }}>🏷️ QR code de démonstration</div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 18 }}>
          Affichez ce QR sur un autre écran ou imprimez-le, puis scannez-le avec le bouton ci-dessous.
        </div>
        {qrTestImg && (
          <div style={{ display: 'inline-block', background: '#fff', borderRadius: 12, padding: 12, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <img src={qrTestImg} alt="QR test" style={{ display: 'block', width: 200, height: 200 }} />
          </div>
        )}
        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', marginBottom: 2 }}>Réf. : MR-TEST-0000</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>Aucun SMS · Aucune base de données</div>
      </div>

      {/* Scanner */}
      <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif', marginBottom: 8 }}>📷 Test Scanner</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: 'sans-serif', marginBottom: 16 }}>
          Appuyez sur le bouton pour ouvrir la caméra et scanner n'importe quel QR code.
        </div>

        {resultat && (
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14, marginBottom: 16, border: `1px solid ${C.green}44` }}>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 700, fontFamily: 'sans-serif', marginBottom: 6 }}>✅ QR Code détecté !</div>
            <div style={{ fontSize: 13, color: C.navy, fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 10 }}>{resultat}</div>
            <button
              onClick={() => setResultat('')}
              style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, padding: '6px 14px', cursor: 'pointer', fontFamily: 'sans-serif' }}
            >
              Réinitialiser
            </button>
          </div>
        )}

        <button
          onClick={() => setShowScanner(true)}
          style={{ width: '100%', padding: 14, background: C.accent, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}
        >
          📷 Ouvrir la caméra
        </button>
      </div>

      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
