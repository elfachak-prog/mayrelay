import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import QRScanner from '../components/QRScanner';

const C = {
  bg: '#F0F2F5', white: '#FFFFFF', dark: '#0D1F2D', mid: '#4A7B94',
  border: '#E2E8F0', coral: '#E8613A', green: '#10B981', amber: '#F59E0B',
  red: '#EF4444', ocean: '#0A4B6E', lagoon: '#1A7FA8', foam: '#EAF6FB',
};

const statutLabel = { en_attente: 'En attente', en_transit: 'En transit', livre: 'Livré', paye: 'Remis' };
const statutColor = { en_attente: C.amber, en_transit: C.lagoon, livre: C.green, paye: C.mid };
const statutBg   = { en_attente: '#FEF3C7', en_transit: C.foam, livre: '#D1FAE5', paye: '#F0F2F5' };

function Tag({ statut }) {
  return (
    <span style={{ background: statutBg[statut] || '#eee', color: statutColor[statut] || '#666',
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, fontFamily: 'sans-serif' }}>
      {statutLabel[statut] || statut}
    </span>
  );
}

function FicheColis({ colis, onRemettre, onFermer }) {
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [confirme, setConfirme] = useState(false);

  const handleRemettre = async () => {
    setLoading(true); setErreur('');
    try {
      await API.post(`/colis/reception/remettre/${colis.reference}`);
      setConfirme(true);
      setTimeout(() => { onRemettre(); onFermer(); }, 2000);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la remise');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        {confirme ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.green, fontFamily: 'Georgia, serif' }}>Remise confirmée !</div>
            <div style={{ fontSize: 13, color: C.mid, marginTop: 8, fontFamily: 'sans-serif' }}>SMS envoyé au destinataire</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.dark, fontFamily: 'Georgia, serif' }}>Fiche colis</div>
              <div onClick={onFermer} style={{ cursor: 'pointer', color: C.mid, fontSize: 22, lineHeight: 1 }}>×</div>
            </div>

            <div style={{ background: C.foam, borderRadius: 12, padding: '14px 16px', marginBottom: 16, borderLeft: `3px solid ${C.lagoon}` }}>
              <div style={{ fontSize: 11, color: C.mid, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>Référence</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ocean, fontFamily: 'monospace', marginTop: 2 }}>{colis.reference}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Destinataire', `${colis.nom_destinataire}${colis.prenom_destinataire ? ' ' + colis.prenom_destinataire : ''}`],
                ['Téléphone', colis.telephone_destinataire],
                ['Quartier', colis.quartier],
                ['Type', `${colis.type === 'Colis' ? '📦' : '✉️'} ${colis.type}`],
              ].map(([label, val]) => (
                <div key={label} style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: C.mid, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'sans-serif' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginTop: 3, fontFamily: 'sans-serif' }}>{val}</div>
                </div>
              ))}
            </div>

            {colis.notes && (
              <div style={{ background: '#FFF8F0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400E', fontFamily: 'sans-serif' }}>
                📝 {colis.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Tag statut={colis.statut} />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ocean, fontFamily: 'sans-serif' }}>{colis.prix} €</div>
            </div>

            {erreur && <div style={{ background: '#FEE2E2', color: C.red, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, fontFamily: 'sans-serif' }}>{erreur}</div>}

            {colis.statut === 'paye' ? (
              <div style={{ background: '#D1FAE5', color: C.green, padding: '12px 16px', borderRadius: 10, textAlign: 'center', fontWeight: 700, fontFamily: 'sans-serif' }}>
                ✅ Ce colis a déjà été remis
              </div>
            ) : (
              <button onClick={handleRemettre} disabled={loading}
                style={{ width: '100%', padding: 14, background: loading ? '#ccc' : C.coral, border: 'none', borderRadius: 12,
                  color: C.white, fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'sans-serif' }}>
                {loading ? 'Confirmation...' : '✋ Remettre au destinataire'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Reception() {
  const [colisListe, setColisListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [colisScanne, setColisScanne] = useState(null);
  const [erreurScan, setErreurScan] = useState('');
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await API.get('/colis/reception/a-remettre');
      setColisListe(res.data.colis);
    } catch (err) { console.error(err); }
    setChargement(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const handleScan = async (raw) => {
    setShowScanner(false);
    setErreurScan('');
    let reference = raw;
    try {
      const parsed = JSON.parse(raw);
      reference = parsed.reference || raw;
    } catch {}

    try {
      const res = await API.get(`/colis/reception/scan/${reference}`);
      setColisScanne(res.data.colis);
    } catch (err) {
      setErreurScan(err.response?.data?.message || `Colis "${reference}" non trouvé pour ce point relais`);
    }
  };

  const handleRechercheManuelle = async () => {
    if (!recherche.trim()) return;
    setErreurScan('');
    try {
      const res = await API.get(`/colis/reception/scan/${recherche.trim().toUpperCase()}`);
      setColisScanne(res.data.colis);
      setRecherche('');
    } catch (err) {
      setErreurScan(err.response?.data?.message || `Référence "${recherche}" introuvable`);
    }
  };

  const colisFiltre = colisListe.filter(c =>
    recherche === '' ||
    c.reference?.toLowerCase().includes(recherche.toLowerCase()) ||
    c.nom_destinataire?.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>Réception colis</h2>
        <div style={{ fontSize: 13, color: '#888', fontFamily: 'sans-serif' }}>
          {chargement ? 'Chargement...' : `${colisListe.length} colis à remettre`}
        </div>
      </div>

      {/* Bouton scanner + recherche manuelle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => { setErreurScan(''); setShowScanner(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.coral, color: C.white,
            border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
          📷 Scanner QR
        </button>
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRechercheManuelle()}
          placeholder="Référence MR-2026-XXXX"
          style={{ flex: 1, padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 12,
            fontSize: 13, color: C.dark, outline: 'none', fontFamily: 'monospace', background: C.white }}
        />
        <button onClick={handleRechercheManuelle}
          style={{ background: C.ocean, color: C.white, border: 'none', borderRadius: 12,
            padding: '12px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
          Chercher
        </button>
      </div>

      {erreurScan && (
        <div style={{ background: '#FEE2E2', color: C.red, padding: '12px 16px', borderRadius: 10,
          fontSize: 13, marginBottom: 16, fontFamily: 'sans-serif' }}>
          ⚠️ {erreurScan}
        </div>
      )}

      {/* Liste des colis à remettre */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {chargement ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: 'sans-serif' }}>Chargement...</div>
        ) : colisFiltre.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: 'Georgia, serif' }}>Aucun colis à remettre</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 6, fontFamily: 'sans-serif' }}>
              Les colis livrés par le livreur apparaîtront ici
            </div>
          </div>
        ) : (
          colisFiltre.map((c, i) => (
            <div key={c.id} onClick={() => { setErreurScan(''); setColisScanne(c); }}
              style={{ padding: '16px 20px', borderBottom: i < colisFiltre.length - 1 ? `1px solid ${C.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                background: 'white', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.foam}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ fontSize: 28 }}>{c.type === 'Colis' ? '📦' : '✉️'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.lagoon, fontWeight: 700 }}>{c.reference}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginTop: 2, fontFamily: 'sans-serif' }}>
                  {c.nom_destinataire}{c.prenom_destinataire ? ' ' + c.prenom_destinataire : ''}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 1, fontFamily: 'sans-serif' }}>
                  {c.telephone_destinataire} · {c.quartier}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Tag statut={c.statut} />
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ocean, fontFamily: 'sans-serif' }}>{c.prix} €</div>
              </div>
              <div style={{ color: C.coral, fontSize: 20 }}>›</div>
            </div>
          ))
        )}
      </div>

      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {colisScanne && (
        <FicheColis
          colis={colisScanne}
          onRemettre={charger}
          onFermer={() => setColisScanne(null)}
        />
      )}
    </div>
  );
}
