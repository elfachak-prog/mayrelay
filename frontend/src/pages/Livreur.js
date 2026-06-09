import { useState, useEffect } from 'react';
import { getMissionsDisponibles, accepterMission } from '../services/api';
import QRScanner from '../components/QRScanner';

const C = {
  bg: "#0F1923", surface: "#17242F", card: "#1E3040",
  border: "#263D50", accent: "#F5A623", green: "#27C97A",
  red: "#E8503A", blue: "#3A9FE8", muted: "#6B8FA8",
  white: "#FFFFFF",
};

function MissionCard({ mission, onAccepter }) {
  const [chargement, setChargement] = useState(false);

  const handleAccepter = async () => {
    setChargement(true);
    try {
      await onAccepter(mission.id);
    } catch (err) {
      console.error(err);
    }
    setChargement(false);
  };

  return (
    <div style={{ margin: '0 0 12px', background: C.card, borderRadius: 16, border: `1px solid ${mission.urgent ? C.accent + '55' : C.border}`, overflow: 'hidden' }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.blue }} />
            <div style={{ width: 1, flex: 1, background: C.border, margin: '4px 0' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>Depart</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'sans-serif' }}>{mission.partenaire_depart}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>Arrivee</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'sans-serif' }}>{mission.partenaire_destination}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, fontFamily: 'Georgia, serif' }}>{mission.gain_livreur}€</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif' }}>gain</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, fontFamily: 'sans-serif' }}>
          Destinataire : <span style={{ color: C.white, fontWeight: 600 }}>{mission.nom_destinataire}</span>
          {' · '}<span style={{ fontFamily: 'monospace', color: C.accent }}>{mission.reference}</span>
          {' · '}<span style={{ color: C.muted }}>{mission.type}</span>
        </div>
        <button onClick={handleAccepter} disabled={chargement} style={{ width: '100%', padding: '12px', background: chargement ? C.muted : C.accent, border: 'none', borderRadius: 10, color: '#000', fontSize: 14, fontWeight: 700, cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
          {chargement ? 'Acceptation...' : 'Accepter cette mission →'}
        </button>
      </div>
    </div>
  );
}

export default function Livreur({ user, onLogout }) {
  const [onglet, setOnglet] = useState('missions');
  const [missions, setMissions] = useState([]);
  const [missionEnCours, setMissionEnCours] = useState(null);
  const [etape, setEtape] = useState('aller_chercher');
  const [showQR, setShowQR] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanDone, setScanDone] = useState(false);
  const [rated, setRated] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    chargerMissions();
  }, []);

  const chargerMissions = async () => {
    try {
      const res = await getMissionsDisponibles();
      setMissions(res.data.missions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccepter = async (id) => {
    try {
      await accepterMission(id);
      const mission = missions.find(m => m.id === id);
      setMissionEnCours(mission);
      setEtape('aller_chercher');
      setOnglet('en_cours');
      chargerMissions();
    } catch (err) {
      console.error(err);
    }
  };

  const lancerScan = () => {
    setShowQR(true);
    setScanProgress(0);
    setScanDone(false);
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(interval); setScanDone(true); return 100; }
        return p + 3;
      });
    }, 60);
  };

  const confirmerScan = () => {
    setShowQR(false);
    if (etape === 'aller_chercher') setEtape('en_route');
    else if (etape === 'deposer') setEtape('termine');
  };

  const tabs = [
    { key: 'missions', icon: '🗺️', label: 'Missions' },
    { key: 'en_cours', icon: '🛵', label: 'En cours' },
    { key: 'gains', icon: '💰', label: 'Gains' },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: 'Georgia, serif' }}>🏝️ MayRelay</div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>Espace Livreur — {user.nom}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: C.green + '22', border: `1px solid ${C.green}44`, borderRadius: 20, padding: '4px 12px', fontSize: 11, color: C.green, fontFamily: 'sans-serif', fontWeight: 700 }}>● En ligne</div>
          <div onClick={onLogout} style={{ fontSize: 11, color: C.muted, cursor: 'pointer', fontFamily: 'sans-serif' }}>Quitter</div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* Missions disponibles */}
        {onglet === 'missions' && (
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 4 }}>Missions disponibles</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 16 }}>{missions.length} mission(s) disponible(s)</div>
            {missions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛵</div>
                <div style={{ fontSize: 14, color: C.white, fontFamily: 'sans-serif', marginBottom: 8 }}>Aucune mission disponible</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>Revenez dans quelques instants</div>
                <button onClick={chargerMissions} style={{ marginTop: 16, padding: '10px 20px', background: C.accent, border: 'none', borderRadius: 10, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Actualiser</button>
              </div>
            ) : (
              missions.map(m => <MissionCard key={m.id} mission={m} onAccepter={handleAccepter} />)
            )}
          </div>
        )}

        {/* Mission en cours */}
        {onglet === 'en_cours' && (
          <div style={{ padding: 16 }}>
            {!missionEnCours ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛵</div>
                <div style={{ fontSize: 14, color: C.white, fontFamily: 'sans-serif' }}>Aucune mission en cours</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginTop: 8 }}>Acceptez une mission depuis l onglet Missions</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 16 }}>Mission en cours</div>

                {/* Trajet */}
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif' }}>Depart</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'sans-serif' }}>{missionEnCours.partenaire_depart}</div>
                    </div>
                    <div style={{ fontSize: 18, color: C.muted }}>→</div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif' }}>Arrivee</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'sans-serif' }}>{missionEnCours.partenaire_destination}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>
                    Ref: <span style={{ color: C.accent, fontFamily: 'monospace' }}>{missionEnCours.reference}</span>
                    {' · '}Gain: <span style={{ color: C.accent, fontWeight: 700 }}>{missionEnCours.gain_livreur}€</span>
                  </div>
                </div>

                {/* Etapes */}
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
                  {[
                    { key: 'aller_chercher', label: 'Scanner le colis au depart', icon: '📱' },
                    { key: 'en_route', label: 'En route vers destination', icon: '🛵' },
                    { key: 'deposer', label: 'Scanner a la livraison', icon: '📍' },
                    { key: 'termine', label: 'Mission terminee', icon: '✅' },
                  ].map((e, i, arr) => {
                    const idx = arr.findIndex(x => x.key === etape);
                    const done = i < idx;
                    const current = i === idx;
                    return (
                      <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? C.green : current ? C.accent : C.border, fontSize: 11, fontWeight: 700, color: done || current ? '#000' : C.muted, flexShrink: 0 }}>
                            {done ? '✓' : i + 1}
                          </div>
                          {i < arr.length - 1 && <div style={{ width: 1, height: 22, background: done ? C.green : C.border }} />}
                        </div>
                        <div style={{ paddingBottom: i < arr.length - 1 ? 10 : 0 }}>
                          <div style={{ fontSize: 13, fontWeight: current ? 700 : 400, color: done ? C.green : current ? C.white : C.muted, fontFamily: 'sans-serif' }}>{e.icon} {e.label}</div>
                          {current && <div style={{ fontSize: 10, color: C.accent, fontFamily: 'sans-serif', marginTop: 2 }}>← Etape actuelle</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                {etape === 'aller_chercher' && (
                  <button onClick={lancerScan} style={{ width: '100%', padding: 14, background: C.blue, border: 'none', borderRadius: 12, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                    📷 Scanner le QR code du colis
                  </button>
                )}
                {etape === 'en_route' && (
                  <button onClick={() => setEtape('deposer')} style={{ width: '100%', padding: 14, background: C.accent, border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                    🛵 Je suis arrive — Scanner a la livraison
                  </button>
                )}
                {etape === 'deposer' && (
                  <button onClick={lancerScan} style={{ width: '100%', padding: 14, background: C.green, border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                    📷 Scanner et confirmer la livraison
                  </button>
                )}
                {etape === 'termine' && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.green, fontFamily: 'Georgia, serif', marginBottom: 8 }}>Mission accomplie</div>
                    <div style={{ fontSize: 13, color: C.muted, fontFamily: 'sans-serif', marginBottom: 20 }}>Gain credite : <span style={{ color: C.accent, fontWeight: 700 }}>{missionEnCours.gain_livreur}€</span></div>
                    {!rated && (
                      <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 12 }}>Evaluez ce point relais</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                          {[1,2,3,4,5].map(s => (
                            <div key={s} onClick={() => setStars(s)} style={{ fontSize: 30, cursor: 'pointer' }}>
                              {stars >= s ? '⭐' : '☆'}
                            </div>
                          ))}
                        </div>
                        <button onClick={() => setRated(true)} disabled={stars === 0} style={{ width: '100%', padding: 10, background: stars === 0 ? C.border : C.accent, border: 'none', borderRadius: 10, color: stars === 0 ? C.muted : '#000', fontSize: 13, fontWeight: 700, cursor: stars === 0 ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
                          Envoyer mon evaluation
                        </button>
                      </div>
                    )}
                    {rated && <div style={{ fontSize: 12, color: C.green, fontFamily: 'sans-serif', marginBottom: 16 }}>Evaluation envoyee</div>}
                    <button onClick={() => { setMissionEnCours(null); setEtape('aller_chercher'); setRated(false); setStars(0); setOnglet('missions'); }} style={{ width: '100%', padding: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.white, fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                      Retour aux missions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Gains */}
        {onglet === 'gains' && (
          <div style={{ padding: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, #1A3A50 0%, #0F2535 100%)', borderRadius: 20, padding: 24, border: `1px solid ${C.accent}33`, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>Solde disponible</div>
              <div style={{ fontSize: 42, fontWeight: 700, color: C.accent, fontFamily: 'Georgia, serif', margin: '8px 0' }}>0,00€</div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>Seuil minimum de retrait : 10€</div>
            </div>
            <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.muted, fontFamily: 'sans-serif' }}>Acceptez vos premieres missions pour voir vos gains ici</div>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner */}
      {showQR && (
        <QRScanner
          onScan={(data) => {
            setShowQR(false);
            confirmerScan(data);
          }}
          onClose={() => setShowQR(false)}
        />
      )}
      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 50 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setOnglet(t.key)} style={{ flex: 1, padding: '12px 0 10px', textAlign: 'center', cursor: 'pointer', borderTop: onglet === t.key ? `2px solid ${C.accent}` : '2px solid transparent' }}>
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 10, color: onglet === t.key ? C.accent : C.muted, marginTop: 2, fontFamily: 'sans-serif', fontWeight: onglet === t.key ? 700 : 400 }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
