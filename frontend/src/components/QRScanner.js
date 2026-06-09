import { useEffect, useRef, useState } from 'react';

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [erreur, setErreur] = useState('');
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let localStream;
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    }).then(s => {
      localStream = s;
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
    }).catch(err => {
      setErreur('Camera non accessible: ' + err.message);
    });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    onClose();
  };

  const handleManuel = () => {
    const ref = prompt('Entrez la reference du colis manuellement:');
    if (ref && ref.trim()) {
      if (stream) stream.getTracks().forEach(t => t.stop());
      onScan(JSON.stringify({ reference: ref.trim().toUpperCase() }));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16, fontFamily: 'sans-serif' }}>
        📷 Scanner le QR code
      </div>
      {erreur ? (
        <div style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', padding: '0 24px', fontFamily: 'sans-serif', marginBottom: 20 }}>
          {erreur}
        </div>
      ) : (
        <video ref={videoRef} style={{ width: 300, height: 300, objectFit: 'cover', borderRadius: 12, border: '3px solid #F5A623' }} playsInline autoPlay muted />
      )}
      <div style={{ color: '#888', fontSize: 12, margin: '12px 0', fontFamily: 'sans-serif' }}>
        Pointez vers le QR code du colis
      </div>
      <button onClick={handleManuel} style={{ margin: '8px 0', background: '#F5A623', color: '#000', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
        ✍️ Saisir la reference manuellement
      </button>
      <button onClick={handleStop} style={{ margin: '8px 0', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '12px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'sans-serif' }}>
        Annuler
      </button>
    </div>
  );
}
