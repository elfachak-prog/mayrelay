import { useState, useEffect, useMemo } from 'react';
import { getMissionsDisponibles, accepterMission, getMesMissions, confirmerLivraison, getProfilLivreur, updatePhotoLivreur } from '../services/api';
import QRScanner from '../components/QRScanner';
import MapItineraire from '../components/MapItineraire';
import QRCode from 'qrcode';

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

export default function Livreur({ user, onLogout, logo }) {
  const [onglet, setOnglet] = useState('missions');
  const [missions, setMissions] = useState([]);
  const [missionEnCours, setMissionEnCours] = useState(null);
  const [etape, setEtape] = useState('aller_chercher');
  const [showQR, setShowQR] = useState(false);


  const [rated, setRated] = useState(false);
  const [stars, setStars] = useState(0);
  const [qrErreur, setQrErreur] = useState('');
  const [livraisonErreur, setLivraisonErreur] = useState('');
  const [historique, setHistorique] = useState([]);
  const [showTestQR, setShowTestQR] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [qrTestImg, setQrTestImg] = useState('');
  const [position, setPosition] = useState(null);
  const [geoErreur, setGeoErreur] = useState('');
  const [profil, setProfil] = useState(null);
  const [editPhoto, setEditPhoto] = useState(false);
  const [photoInput, setPhotoInput] = useState('');

  useEffect(() => {
    chargerMissions();
    chargerHistorique();
    chargerProfil();
    demarrerGeo();
    QRCode.toDataURL(JSON.stringify({ reference: 'MR-TEST-0000', partenaire_id: 0 }), { width: 220, margin: 2 })
      .then(url => setQrTestImg(url));
  }, []);

  const chargerProfil = async () => {
    try {
      const res = await getProfilLivreur();
      setProfil(res.data.profil);
    } catch (err) { console.error(err); }
  };

  const chargerHistorique = async () => {
    try {
      const res = await getMesMissions();
      setHistorique(res.data.missions.filter(m => m.statut === 'termine'));
    } catch (err) { console.error(err); }
  };

  const demarrerGeo = () => {
    if (!navigator.geolocation) { setGeoErreur('Geolocalisation non supportee'); return; }
    navigator.geolocation.watchPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, precision: Math.round(pos.coords.accuracy) }),
      () => setGeoErreur('Position indisponible'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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

  const lancerScan = () => { setQrErreur(''); setShowQR(true); };

  const confirmerScan = (data) => {
    if (!missionEnCours) return;
    if (!data.includes(missionEnCours.reference)) {
      setQrErreur(`QR code invalide — ce colis ne correspond pas à la mission (réf. ${missionEnCours.reference})`);
      return;
    }
    setQrErreur('');
    if (etape === 'aller_chercher') setEtape('en_route');
    else if (etape === 'deposer') setEtape('termine');
  };

  const handleEnvoyerEvaluation = async () => {
    try {
      setLivraisonErreur('');
      await confirmerLivraison(missionEnCours.id, { note_partenaire: stars });
      await chargerHistorique();
      setRated(true);
    } catch (err) {
      console.error(err);
      setLivraisonErreur('Erreur lors de la confirmation — réessaie.');
    }
  };

  const destinationCarte = useMemo(() => missionEnCours ? {
    lat: parseFloat(missionEnCours.lat_destination),
    lng: parseFloat(missionEnCours.lng_destination),
    nom: missionEnCours.partenaire_destination,
  } : null, [missionEnCours]);

  const tabs = [
    { key: 'missions', icon: '🗺️', label: 'Missions' },
    { key: 'en_cours', icon: '🛵', label: 'En cours' },
    { key: 'historique', icon: '📋', label: 'Historique' },
    { key: 'gains', icon: '💰', label: 'Gains' },
    { key: 'profil', icon: '👤', label: 'Profil' },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {logo
            ? <img src={logo} alt="Logo" style={{ maxHeight: 36, maxWidth: 120, objectFit: 'contain', display: 'block' }} />
            : <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: 'Georgia, serif' }}>🏝️ MayRelay</div>
          }
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

                {/* Carte itinéraire */}
                {etape !== 'termine' && (
                  <MapItineraire
                    positionLivreur={position}
                    destination={destinationCarte}
                  />
                )}

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

                {/* Erreur QR */}
                {qrErreur && (
                  <div style={{ background: C.red + '22', borderRadius: 10, padding: 12, marginBottom: 12, border: `1px solid ${C.red}44`, fontSize: 12, color: C.red, fontFamily: 'sans-serif', textAlign: 'center' }}>
                    ⚠️ {qrErreur}
                  </div>
                )}

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
                        {livraisonErreur && <div style={{ fontSize: 11, color: C.red, fontFamily: 'sans-serif', marginBottom: 8, textAlign: 'center' }}>{livraisonErreur}</div>}
                        <button onClick={handleEnvoyerEvaluation} disabled={stars === 0} style={{ width: '100%', padding: 10, background: stars === 0 ? C.border : C.accent, border: 'none', borderRadius: 10, color: stars === 0 ? C.muted : '#000', fontSize: 13, fontWeight: 700, cursor: stars === 0 ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
                          Envoyer mon evaluation
                        </button>
                      </div>
                    )}
                    {rated && <div style={{ fontSize: 12, color: C.green, fontFamily: 'sans-serif', marginBottom: 16 }}>Evaluation envoyee — gain credite !</div>}
                    <button onClick={() => { setMissionEnCours(null); setEtape('aller_chercher'); setRated(false); setStars(0); setQrErreur(''); setLivraisonErreur(''); setOnglet('missions'); }} style={{ width: '100%', padding: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.white, fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                      Retour aux missions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Historique */}
        {onglet === 'historique' && (
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 16 }}>📋 Mes missions terminées</div>
            {/* Géolocalisation */}
            <div style={{ background: C.card, borderRadius: 12, padding: 12, border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 20 }}>📍</div>
              <div>
                {position ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: 'sans-serif' }}>Position active</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{position.lat.toFixed(5)}, {position.lng.toFixed(5)} — ±{position.precision}m</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: geoErreur ? C.red : C.muted, fontFamily: 'sans-serif' }}>{geoErreur || 'Recherche de position...'}</div>
                )}
              </div>
            </div>
            {historique.length === 0 ? (
              <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏁</div>
                <div style={{ fontSize: 13, color: C.muted, fontFamily: 'sans-serif' }}>Aucune mission terminée pour l'instant</div>
              </div>
            ) : (
              historique.map((m, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.white, fontFamily: 'monospace' }}>{m.reference}</div>
                    <div style={{ fontSize: 11, background: C.green + '22', color: C.green, borderRadius: 6, padding: '3px 8px', fontFamily: 'sans-serif' }}>✅ Terminée</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif', marginBottom: 4 }}>
                    📦 {m.partenaire_depart} → {m.partenaire_destination}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>{new Date(m.created_at).toLocaleDateString('fr-FR')}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, fontFamily: 'sans-serif' }}>+{m.gain_livreur}€</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* Gains */}
        {/* Test caméra et QR */}
        {onglet === 'test' && (
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 8 }}>🧪 Zone de test</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 20 }}>Teste la caméra et le scanner QR sans avoir besoin d'une mission.</div>

            {/* QR code de test à scanner */}
            <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 6 }}>🏷️ QR code de démonstration</div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif', marginBottom: 14 }}>Imprime ou affiche ce QR sur un autre écran, puis scanne-le avec le bouton ci-dessous.</div>
              {qrTestImg && (
                <div style={{ display: 'inline-block', background: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                  <img src={qrTestImg} alt="QR test" style={{ display: 'block', width: 200, height: 200 }} />
                </div>
              )}
              <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', marginBottom: 4 }}>Réf. : MR-TEST-0000</div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif', marginBottom: 0 }}>Aucun SMS, aucune base de données</div>
            </div>

            {/* Test QR Scanner */}
            <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 8 }}>📷 Test Scanner QR</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 14 }}>Appuie sur le bouton pour ouvrir la caméra et scanner n'importe quel QR code.</div>
              {testResult ? (
                <div style={{ background: C.green + '22', borderRadius: 10, padding: 12, marginBottom: 12, border: `1px solid ${C.green}44` }}>
                  <div style={{ fontSize: 11, color: C.green, fontFamily: 'sans-serif', fontWeight: 700, marginBottom: 4 }}>✅ QR Code détecté !</div>
                  <div style={{ fontSize: 12, color: C.white, fontFamily: 'monospace', wordBreak: 'break-all' }}>{testResult}</div>
                  <button onClick={() => setTestResult('')} style={{ marginTop: 10, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 11, padding: '6px 12px', cursor: 'pointer', fontFamily: 'sans-serif' }}>Réinitialiser</button>
                </div>
              ) : null}
              <button onClick={() => setShowTestQR(true)} style={{ width: '100%', padding: 14, background: C.accent, border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                📷 Ouvrir la caméra
              </button>
            </div>

            {/* Info géoloc */}
            <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 8 }}>📍 Test Géolocalisation</div>
              {position ? (
                <>
                  <div style={{ fontSize: 12, color: C.green, fontFamily: 'sans-serif', fontWeight: 700, marginBottom: 6 }}>✅ GPS actif</div>
                  <div style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace', marginBottom: 4 }}>Lat: {position.lat.toFixed(6)}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace', marginBottom: 4 }}>Lng: {position.lng.toFixed(6)}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>Précision: ±{position.precision}m</div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: geoErreur ? C.red : C.muted, fontFamily: 'sans-serif' }}>{geoErreur || '⏳ Recherche GPS...'}</div>
              )}
            </div>
          </div>
        )}
        {onglet === 'profil' && (
          <div style={{ padding: 16 }}>
            {/* Avatar + nom */}
            <div style={{ background: 'linear-gradient(135deg, #1A3A50 0%, #0F2535 100%)', borderRadius: 20, padding: 28, border: `1px solid ${C.border}`, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
                {profil?.photo_url ? (
                  <img src={profil.photo_url} alt="avatar" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.accent}` }} onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #E84A2A)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff', border: `3px solid ${C.accent}33` }}>
                    {(profil?.nom || user.nom || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div onClick={() => { setEditPhoto(true); setPhotoInput(profil?.photo_url || ''); }} style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}>✏️</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: 'Georgia, serif', marginBottom: 4 }}>{profil?.nom || user.nom}</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>
                {profil?.zone && <span style={{ marginRight: 8 }}>📍 {profil.zone}</span>}
                {profil?.vehicule && <span>🛵 {profil.vehicule}</span>}
              </div>
            </div>

            {/* 3 stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: C.card, borderRadius: 14, padding: '16px 10px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.accent, fontFamily: 'Georgia, serif' }}>{profil ? Number(profil.nb_missions) : '—'}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif', marginTop: 4, lineHeight: 1.3 }}>Missions effectuées</div>
              </div>
              <div style={{ background: C.card, borderRadius: 14, padding: '16px 10px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.green, fontFamily: 'Georgia, serif' }}>{profil ? Number(profil.gains_totaux).toFixed(2) + '€' : '—'}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif', marginTop: 4, lineHeight: 1.3 }}>Gains totaux</div>
              </div>
              <div style={{ background: C.card, borderRadius: 14, padding: '16px 10px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.blue, fontFamily: 'Georgia, serif' }}>
                  {profil && Number(profil.note_moyenne) > 0 ? Number(profil.note_moyenne).toFixed(1) + ' ⭐' : '—'}
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif', marginTop: 4, lineHeight: 1.3 }}>Note moyenne</div>
              </div>
            </div>

            {/* Infos du compte */}
            <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 12 }}>Informations du compte</div>
              {[
                { label: 'Email', value: profil?.email },
                { label: 'Téléphone', value: profil?.telephone || '—' },
                { label: 'Zone', value: profil?.zone || '—' },
                { label: 'Véhicule', value: profil?.vehicule || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>{label}</div>
                  <div style={{ fontSize: 12, color: C.white, fontFamily: 'sans-serif', textAlign: 'right' }}>{value}</div>
                </div>
              ))}
              <button onClick={chargerProfil} style={{ width: '100%', marginTop: 4, padding: '10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'sans-serif' }}>↻ Actualiser</button>
            </div>
          </div>
        )}

        {/* Modal photo */}
        {editPhoto && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: C.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: 'sans-serif', marginBottom: 16 }}>Modifier la photo</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 10 }}>Colle l'URL de ton image (ex: depuis Google Photos, Imgur…)</div>
              <input
                value={photoInput}
                onChange={e => setPhotoInput(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '10px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.white, fontSize: 13, fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none', marginBottom: 16 }}
              />
              {photoInput && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img src={photoInput} alt="preview" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.accent}` }} onError={e => { e.target.style.opacity = 0.2; }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditPhoto(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>Annuler</button>
                <button onClick={async () => {
                  try {
                    await updatePhotoLivreur(photoInput);
                    await chargerProfil();
                    setEditPhoto(false);
                  } catch (err) { console.error(err); }
                }} style={{ flex: 2, padding: 12, background: C.accent, border: 'none', borderRadius: 10, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

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

      {/* QR Scanner Test */}
      {showTestQR && (
        <QRScanner
          onScan={(data) => {
            setShowTestQR(false);
            setTestResult(data);
          }}
          onClose={() => setShowTestQR(false)}
        />
      )}
      {/* QR Scanner */}
      {showQR && (
        <QRScanner
          onScan={(data) => {
            setShowQR(false);
            setTimeout(() => confirmerScan(data), 0);
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
