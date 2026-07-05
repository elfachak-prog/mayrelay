import { useState, useEffect } from 'react';
import API from '../services/api';

const isMobileScreen = () => window.innerWidth < 768;

const C = {
  dark: "#0D1F2D",
  lagoon: "#1A7FA8",
  coral: "#E8613A",
  mid: "#4A7B94",
  white: "#FFFFFF",
  green: "#2EAF7D",
};

const TAILLES = ['Petit', 'Moyen', 'Grand', 'Volumineux'];

const casierColor = { libre: '#2EAF7D', occupe: '#E8613A', hors_service: '#AAA' };
const casierBg = { libre: '#E0F5EE', occupe: '#FDEEE9', hors_service: '#F5F5F5' };
const statutLabel = { libre: 'Disponible', occupe: 'Occupé', hors_service: 'Hors service' };

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8EE', borderRadius: 8,
  fontSize: 13, color: '#0D1F2D', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'sans-serif', marginTop: 6, background: '#FAFBFC',
};

export default function Casiers() {
  const [casiers, setCasiers] = useState([]);
  const [modal, setModal] = useState(null); // null | 'creer' | 'modifier' | 'assigner' | 'liberer' | 'confirmer_suppr'
  const [selected, setSelected] = useState(null);
  const [casierForm, setCasierForm] = useState({ numero: '', taille: 'Petit' });
  const [assignRef, setAssignRef] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState(isMobileScreen());

  useEffect(() => {
    const handler = () => setMobile(isMobileScreen());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const res = await API.get('/casiers');
      setCasiers(res.data.casiers);
    } catch {}
  };

  const fermer = () => { setModal(null); setErreur(''); };

  const ouvrirCreer = () => {
    setCasierForm({ numero: '', taille: 'Petit' });
    setErreur('');
    setModal('creer');
  };

  const ouvrirModifier = (c, e) => {
    e.stopPropagation();
    setSelected(c);
    setCasierForm({ numero: c.numero, taille: c.taille || 'Petit' });
    setErreur('');
    setModal('modifier');
  };

  const ouvrirSuppression = (c, e) => {
    e.stopPropagation();
    setSelected(c);
    setErreur('');
    setModal('confirmer_suppr');
  };

  const ouvrirAction = (c) => {
    if (c.statut === 'hors_service') return;
    setSelected(c);
    setErreur('');
    if (c.statut === 'libre') { setAssignRef(''); setModal('assigner'); }
    else setModal('liberer');
  };

  const handleSauvegarder = async () => {
    if (!casierForm.numero.trim() || !casierForm.taille) { setErreur('Champs obligatoires'); return; }
    setLoading(true); setErreur('');
    try {
      if (modal === 'creer') {
        await API.post('/casiers', casierForm);
      } else {
        await API.put(`/casiers/${selected.id}`, casierForm);
      }
      fermer();
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const handleSupprimer = async () => {
    setLoading(true); setErreur('');
    try {
      await API.delete(`/casiers/${selected.id}`);
      fermer();
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const handleAssigner = async () => {
    if (!assignRef.trim()) { setErreur('Référence requise'); return; }
    setLoading(true); setErreur('');
    try {
      await API.put(`/casiers/${selected.id}/assigner`, { ref: assignRef });
      fermer();
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Colis introuvable');
    }
    setLoading(false);
  };

  const handleLiberer = async () => {
    setLoading(true);
    try {
      await API.put(`/casiers/${selected.id}/liberer`);
      fermer();
      charger();
    } catch {}
    setLoading(false);
  };

  const libres = casiers.filter(c => c.statut === 'libre').length;
  const occupes = casiers.filter(c => c.statut === 'occupe').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.dark, marginBottom: 2 }}>Mes casiers</h2>
          <div style={{ fontSize: 13, color: '#888' }}>
            {casiers.length} casier{casiers.length !== 1 ? 's' : ''} —
            <span style={{ color: C.green, fontWeight: 600 }}> {libres} libre{libres !== 1 ? 's' : ''}</span> ·
            <span style={{ color: C.coral, fontWeight: 600 }}> {occupes} occupé{occupes !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button onClick={ouvrirCreer} style={{ background: C.lagoon, color: C.white, border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
          + Ajouter
        </button>
      </div>

      {/* Empty state */}
      {casiers.length === 0 && (
        <div style={{ background: C.white, borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid #EEF2F5' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🗃️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Aucun casier créé</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Créez vos casiers numérotés pour gérer les colis de votre point relais.</div>
          <button onClick={ouvrirCreer} style={{ background: C.lagoon, color: C.white, border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
            Créer mon premier casier
          </button>
        </div>
      )}

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        {casiers.map(c => {
          const color = casierColor[c.statut] || '#AAA';
          const bg = casierBg[c.statut] || '#F5F5F5';
          return (
            <div key={c.id} style={{ background: bg, borderRadius: 14, border: `2px solid ${color}44`, overflow: 'hidden' }}>
              {/* Zone cliquable pour assigner / libérer */}
              <div
                onClick={() => ouvrirAction(c)}
                style={{ padding: '18px 14px 12px', textAlign: 'center', cursor: c.statut !== 'hors_service' ? 'pointer' : 'default' }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{c.numero}</div>
                <div style={{ display: 'inline-block', background: color + '22', color, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: 1, textTransform: 'uppercase', marginTop: 5 }}>
                  {c.taille || 'Petit'}
                </div>
                <div style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6, fontWeight: 600 }}>
                  {statutLabel[c.statut] || c.statut}
                </div>
                {c.nom_destinataire && (
                  <div style={{ fontSize: 11, color: '#555', marginTop: 7, fontWeight: 600 }}>{c.nom_destinataire}</div>
                )}
                {c.reference && (
                  <div style={{ fontSize: 9, color: '#AAA', fontFamily: 'monospace', marginTop: 2 }}>{c.reference}</div>
                )}
              </div>
              {/* Boutons modifier / supprimer */}
              <div style={{ display: 'flex', borderTop: `1px solid ${color}22` }}>
                <button
                  onClick={(e) => ouvrirModifier(c, e)}
                  title="Modifier"
                  style={{ flex: 1, background: 'transparent', border: 'none', borderRight: `1px solid ${color}22`, padding: '8px 0', cursor: 'pointer', fontSize: 15, color: '#888' }}
                >
                  ✎
                </button>
                <button
                  onClick={(e) => ouvrirSuppression(c, e)}
                  title="Supprimer"
                  disabled={c.statut === 'occupe'}
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 0', cursor: c.statut === 'occupe' ? 'not-allowed' : 'pointer', fontSize: 13, color: c.statut === 'occupe' ? '#DDD' : C.coral }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: C.white, borderRadius: 20, padding: mobile ? 24 : 36, width: mobile ? 'calc(100vw - 32px)' : 400, maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>

            {/* Créer / Modifier */}
            {(modal === 'creer' || modal === 'modifier') && (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 20, fontFamily: 'Georgia, serif' }}>
                  {modal === 'creer' ? 'Nouveau casier' : `Modifier le casier ${selected?.numero}`}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, color: C.mid, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, fontFamily: 'sans-serif' }}>Numéro *</label>
                  <input
                    style={inputStyle}
                    value={casierForm.numero}
                    onChange={e => setCasierForm({ ...casierForm, numero: e.target.value })}
                    placeholder="A1, B2, C3…"
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, color: C.mid, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, fontFamily: 'sans-serif' }}>Taille *</label>
                  <select style={{ ...inputStyle, appearance: 'none' }} value={casierForm.taille} onChange={e => setCasierForm({ ...casierForm, taille: e.target.value })}>
                    {TAILLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {erreur && <div style={{ background: '#FEE2E2', color: C.coral, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, fontFamily: 'sans-serif' }}>{erreur}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={fermer} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#666', fontFamily: 'sans-serif' }}>Annuler</button>
                  <button onClick={handleSauvegarder} disabled={loading} style={{ flex: 1, padding: 12, background: C.lagoon, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: C.white, fontFamily: 'sans-serif' }}>
                    {loading ? '…' : modal === 'creer' ? 'Créer' : 'Enregistrer'}
                  </button>
                </div>
              </>
            )}

            {/* Confirmer suppression */}
            {modal === 'confirmer_suppr' && (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 8, fontFamily: 'Georgia, serif' }}>Supprimer le casier {selected?.numero} ?</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20, fontFamily: 'sans-serif' }}>Cette action est irréversible.</div>
                {erreur && <div style={{ background: '#FEE2E2', color: C.coral, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, fontFamily: 'sans-serif' }}>{erreur}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={fermer} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#666', fontFamily: 'sans-serif' }}>Annuler</button>
                  <button onClick={handleSupprimer} disabled={loading} style={{ flex: 1, padding: 12, background: C.coral, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: C.white, fontFamily: 'sans-serif' }}>
                    {loading ? '…' : 'Supprimer'}
                  </button>
                </div>
              </>
            )}

            {/* Assigner */}
            {modal === 'assigner' && (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Assigner le casier {selected?.numero}</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20, fontFamily: 'sans-serif' }}>Entrez la référence du colis à placer dans ce casier.</div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, color: C.mid, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, fontFamily: 'sans-serif' }}>Référence du colis *</label>
                  <input style={inputStyle} value={assignRef} onChange={e => setAssignRef(e.target.value)} placeholder="MR-2026-XXXX" autoFocus />
                </div>
                {erreur && <div style={{ background: '#FEE2E2', color: C.coral, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, fontFamily: 'sans-serif' }}>{erreur}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={fermer} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#666', fontFamily: 'sans-serif' }}>Annuler</button>
                  <button onClick={handleAssigner} disabled={loading} style={{ flex: 1, padding: 12, background: C.lagoon, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: C.white, fontFamily: 'sans-serif' }}>
                    {loading ? '…' : 'Assigner'}
                  </button>
                </div>
              </>
            )}

            {/* Libérer */}
            {modal === 'liberer' && (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 12, fontFamily: 'Georgia, serif' }}>Libérer le casier {selected?.numero}</div>
                <div style={{ background: '#FEF3DC', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, fontFamily: 'sans-serif' }}>{selected?.nom_destinataire}</div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', marginTop: 2 }}>{selected?.reference}</div>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 24, fontFamily: 'sans-serif' }}>Confirmez-vous que le destinataire a récupéré son colis ?</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={fermer} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#666', fontFamily: 'sans-serif' }}>Annuler</button>
                  <button onClick={handleLiberer} disabled={loading} style={{ flex: 1, padding: 12, background: C.green, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: C.white, fontFamily: 'sans-serif' }}>
                    {loading ? '…' : 'Confirmer'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
