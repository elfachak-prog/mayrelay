import { useState, useEffect } from 'react';
import API from '../services/api';

const COLORS = {
  ocean: "#0A4B6E",
  coral: "#E8613A",
  lagoon: "#1A7FA8",
  foam: "#EAF6FB",
  dark: "#0D1F2D",
  mid: "#4A7B94",
  white: "#FFFFFF",
};

export default function Casiers({ user }) {
  const [casiers, setCasiers] = useState([]);
  const [modal, setModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ ref: '', nom: '' });
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    chargerCasiers();
  }, []);

  const chargerCasiers = async () => {
    try {
      const res = await API.get('/casiers');
      setCasiers(res.data.casiers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssigner = async () => {
    if (!assignForm.ref || !assignForm.nom) return;
    setChargement(true);
    try {
      await API.put(`/casiers/${modal.id}/assigner`, assignForm);
      setModal(null);
      chargerCasiers();
    } catch (err) {
      console.error(err);
    }
    setChargement(false);
  };

  const handleLiberer = async () => {
    setChargement(true);
    try {
      await API.put(`/casiers/${modal.id}/liberer`);
      setModal(null);
      chargerCasiers();
    } catch (err) {
      console.error(err);
    }
    setChargement(false);
  };

  const casierColor = { libre: '#2EAF7D', occupe: '#E8613A', hors_service: '#CCC' };
  const casierBg = { libre: '#E0F5EE', occupe: '#FDEEE9', hors_service: '#F5F5F5' };
  const libres = casiers.filter(c => c.statut === 'libre').length;
  const occupes = casiers.filter(c => c.statut === 'occupe').length;

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8EE', borderRadius: 8, fontSize: 13, color: COLORS.dark, outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', marginTop: 6 };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>Gestion des casiers</h2>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        {casiers.length} casiers —
        <span style={{ color: '#2EAF7D', fontWeight: 600 }}> {libres} libres</span> ·
        <span style={{ color: COLORS.coral, fontWeight: 600 }}> {occupes} occupes</span>
      </div>

      {casiers.length === 0 && (
        <div style={{ background: COLORS.white, borderRadius: 16, padding: 40, textAlign: 'center', border: '1px solid #EEF2F5' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.dark, marginBottom: 8 }}>Aucun casier configure</div>
          <div style={{ fontSize: 13, color: '#888' }}>L administrateur va configurer vos casiers prochainement.</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {casiers.map(c => (
          <div key={c.id} onClick={() => c.statut !== 'hors_service' && setModal(c)}
            style={{ background: casierBg[c.statut] || '#F5F5F5', borderRadius: 14, padding: '20px 16px', border: `2px solid ${casierColor[c.statut] || '#CCC'}44`, textAlign: 'center', cursor: c.statut === 'hors_service' ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: casierColor[c.statut], fontFamily: 'Georgia, serif' }}>{c.numero}</div>
            <div style={{ fontSize: 10, color: casierColor[c.statut], textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
              {c.statut === 'libre' ? 'Disponible' : c.statut === 'hors_service' ? 'Hors service' : 'Occupe'}
            </div>
            {c.nom_destinataire && <div style={{ fontSize: 11, color: '#666', marginTop: 8, fontWeight: 600 }}>{c.nom_destinataire}</div>}
            {c.reference && <div style={{ fontSize: 9, color: '#AAA', fontFamily: 'monospace', marginTop: 2 }}>{c.reference}</div>}
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: COLORS.white, borderRadius: 20, padding: 36, width: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            {modal.statut === 'libre' ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>Assigner le casier {modal.numero}</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Liez ce casier a un colis en attente</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, color: COLORS.mid, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Reference du colis *</label>
                  <input style={inputStyle} value={assignForm.ref} onChange={e => setAssignForm({ ...assignForm, ref: e.target.value })} placeholder="MR-2026-XXXX" />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, color: COLORS.mid, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Nom du destinataire *</label>
                  <input style={inputStyle} value={assignForm.nom} onChange={e => setAssignForm({ ...assignForm, nom: e.target.value })} placeholder="Mmadi Ali" />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#666' }}>Annuler</button>
                  <button onClick={handleAssigner} disabled={chargement} style={{ flex: 1, padding: 12, background: COLORS.lagoon, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: COLORS.white }}>
                    {chargement ? 'En cours...' : 'Assigner'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>Liberer le casier {modal.numero}</div>
                <div style={{ background: '#FEF3DC', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>{modal.nom_destinataire}</div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', marginTop: 2 }}>{modal.reference}</div>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>Confirmez-vous que le destinataire a recupere son colis ?</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#666' }}>Annuler</button>
                  <button onClick={handleLiberer} disabled={chargement} style={{ flex: 1, padding: 12, background: '#2EAF7D', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: COLORS.white }}>
                    {chargement ? 'En cours...' : 'Confirmer'}
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
