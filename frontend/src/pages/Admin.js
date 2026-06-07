import { useState, useEffect } from 'react';
import API from '../services/api';

const C = {
  bg: "#F0F2F5", white: "#FFFFFF", navy: "#0B1F3A",
  teal: "#0E9F8E", amber: "#F59E0B", red: "#EF4444",
  green: "#10B981", blue: "#3B82F6", muted: "#94A3B8",
  text: "#1E293B", border: "#E2E8F0", coral: "#E8613A",
};

const Tag = ({ label, color, bg }) => (
  <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, fontFamily: 'sans-serif' }}>{label}</span>
);

const statutConfig = {
  actif:      { label: 'Actif',      color: C.green, bg: '#D1FAE5' },
  suspendu:   { label: 'Suspendu',   color: C.red,   bg: '#FEE2E2' },
  en_attente: { label: 'En attente', color: C.amber, bg: '#FEF3C7' },
};

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: C.white, borderRadius: 20, padding: 36, width: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>{title}</div>
          <div onClick={onClose} style={{ cursor: 'pointer', color: C.muted, fontSize: 22 }}>×</div>
        </div>
        {children}
      </div>
    </div>
  );
}

function GestionPartenaires() {
  const [partenaires, setPartenaires] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '', telephone: '', zone: '', horaires: '08:00-20:00' });
  const [message, setMessage] = useState('');
  const [chargement, setChargement] = useState(false);

  const zones = ['Mamoudzou Centre', 'Kaweni', 'Bandraboua', 'Koungou', 'Pamandzi', 'Dzaoudzi', 'Labattoir', 'Labattoir Centre', 'Boueni', 'Chiconi', 'Sada', 'Tsingoni'];

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const res = await API.get('/admin/partenaires');
      setPartenaires(res.data.partenaires);
    } catch (err) { console.error(err); }
  };

  const handleCreer = async () => {
    if (!form.nom || !form.email || !form.mot_de_passe || !form.telephone || !form.zone) {
      setMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setChargement(true);
    try {
      await API.post('/admin/partenaires', form);
      setMessage('');
      setShowModal(false);
      setForm({ nom: '', email: '', mot_de_passe: '', telephone: '', zone: '', horaires: '08:00-20:00' });
      charger();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur');
    }
    setChargement(false);
  };

  const handleStatut = async (id, statut) => {
    try {
      await API.put(`/admin/partenaires/${id}/statut`, { statut });
      charger();
      setSelected(null);
    } catch (err) { console.error(err); }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.navy, outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', background: '#FAFBFC', marginTop: 4 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>Partenaires</h2>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2, fontFamily: 'sans-serif' }}>{partenaires.length} point(s) relais</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: C.teal, color: C.white, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
          + Nouveau partenaire
        </button>
      </div>

      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Nom', 'Email', 'Telephone', 'Zone', 'Horaires', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partenaires.map((p, i) => {
              const s = statutConfig[p.statut] || statutConfig.en_attente;
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif' }}>{p.nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{p.email}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{p.telephone}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{p.zone}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{p.horaires}</td>
                  <td style={{ padding: '13px 16px' }}><Tag {...s} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {p.statut !== 'actif' && (
                        <button onClick={() => handleStatut(p.id, 'actif')} style={{ background: '#D1FAE5', color: C.green, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Activer</button>
                      )}
                      {p.statut === 'actif' && (
                        <button onClick={() => handleStatut(p.id, 'suspendu')} style={{ background: '#FEE2E2', color: C.red, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Suspendre</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {partenaires.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: 'sans-serif' }}>Aucun partenaire pour l instant</div>}
      </div>

      {showModal && (
        <Modal title="Nouveau partenaire" onClose={() => { setShowModal(false); setMessage(''); }}>
          {[
            ['Nom du point relais *', 'nom', 'Aznovik Cyber', 'text'],
            ['Email *', 'email', 'contact@email.com', 'email'],
            ['Mot de passe *', 'mot_de_passe', '••••••••', 'password'],
            ['Telephone *', 'telephone', '0639 XX XX XX', 'text'],
          ].map(([label, key, placeholder, type]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{label}</label>
              <input type={type} style={inputStyle} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>Zone / Quartier *</label>
            <select style={{ ...inputStyle, appearance: 'none' }} value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
              <option value="">Selectionner une zone...</option>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>Horaires</label>
            <input style={inputStyle} value={form.horaires} onChange={e => setForm({ ...form, horaires: e.target.value })} placeholder="08:00-20:00" />
          </div>
          {message && <div style={{ background: '#FEE2E2', color: C.red, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, fontFamily: 'sans-serif' }}>{message}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowModal(false); setMessage(''); }} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'sans-serif', color: '#666' }}>Annuler</button>
            <button onClick={handleCreer} disabled={chargement} style={{ flex: 1, padding: 12, background: C.teal, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', color: C.white }}>
              {chargement ? 'Creation...' : 'Creer le partenaire'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function GestionLivreurs() {
  const [livreurs, setLivreurs] = useState([]);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const res = await API.get('/admin/livreurs');
      setLivreurs(res.data.livreurs);
    } catch (err) { console.error(err); }
  };

  const handleStatut = async (id, statut) => {
    try {
      await API.put(`/admin/livreurs/${id}/statut`, { statut });
      charger();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>Livreurs</h2>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2, fontFamily: 'sans-serif' }}>{livreurs.length} livreur(s) inscrit(s)</div>
      </div>
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Nom', 'Email', 'Telephone', 'Zone', 'Vehicule', 'Note', 'Solde', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {livreurs.map((l, i) => {
              const s = statutConfig[l.statut] || statutConfig.en_attente;
              return (
                <tr key={l.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif' }}>{l.nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{l.email}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{l.telephone}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{l.zone}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{l.vehicule}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.amber, fontFamily: 'sans-serif' }}>{l.note ? `${l.note} ⭐` : '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, fontWeight: 600, color: C.teal, fontFamily: 'sans-serif' }}>{l.solde}€</td>
                  <td style={{ padding: '13px 16px' }}><Tag {...s} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {l.statut !== 'actif' && (
                        <button onClick={() => handleStatut(l.id, 'actif')} style={{ background: '#D1FAE5', color: C.green, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Activer</button>
                      )}
                      {l.statut === 'actif' && (
                        <button onClick={() => handleStatut(l.id, 'suspendu')} style={{ background: '#FEE2E2', color: C.red, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Suspendre</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {livreurs.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: 'sans-serif' }}>Aucun livreur inscrit</div>}
      </div>
    </div>
  );
}

function GestionColis() {
  const [colis, setColis] = useState([]);
  const [filtre, setFiltre] = useState('tous');

  const statutColisConfig = {
    en_attente: { label: 'En attente', color: C.amber, bg: '#FEF3C7' },
    en_transit: { label: 'En transit', color: C.blue, bg: '#DBEAFE' },
    livre: { label: 'Livre', color: C.green, bg: '#D1FAE5' },
  };

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const res = await API.get('/admin/colis');
      setColis(res.data.colis);
    } catch (err) { console.error(err); }
  };

  const filtered = filtre === 'tous' ? colis : colis.filter(c => c.statut === filtre);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>Tous les colis</h2>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2, fontFamily: 'sans-serif' }}>{colis.length} colis au total</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['tous', 'Tous'], ['en_attente', 'En attente'], ['en_transit', 'En transit'], ['livre', 'Livres']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltre(k)} style={{ padding: '8px 14px', borderRadius: 20, border: `1px solid ${filtre === k ? C.navy : C.border}`, cursor: 'pointer', background: filtre === k ? C.navy : C.white, color: filtre === k ? C.white : '#666', fontSize: 12, fontFamily: 'sans-serif', fontWeight: filtre === k ? 700 : 400 }}>{l}</button>
        ))}
      </div>
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Reference', 'Partenaire', 'Destinataire', 'Quartier', 'Type', 'Prix', 'Statut', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const s = statutColisConfig[c.statut] || statutColisConfig.en_attente;
              return (
                <tr key={c.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                  <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: C.teal, fontWeight: 600 }}>{c.reference}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{c.partenaire_nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: 'sans-serif' }}>{c.nom_destinataire}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{c.quartier}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, fontFamily: 'sans-serif' }}>{c.type === 'Colis' ? '📦' : '✉️'} {c.type}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.teal, fontFamily: 'sans-serif' }}>{c.prix}€</td>
                  <td style={{ padding: '13px 16px' }}><Tag {...s} /></td>
                  <td style={{ padding: '13px 16px', fontSize: 11, color: '#AAA', fontFamily: 'sans-serif' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: 'sans-serif' }}>Aucun colis</div>}
      </div>
    </div>
  );
}

export default function Admin({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [onglet, setOnglet] = useState('dashboard');

  useEffect(() => { chargerStats(); }, []);

  const chargerStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const navItems = [
    { key: 'dashboard', icon: '◈', label: 'Vue globale' },
    { key: 'partenaires', icon: '🏪', label: 'Partenaires' },
    { key: 'livreurs', icon: '🛵', label: 'Livreurs' },
    { key: 'colis', icon: '📦', label: 'Colis' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'sans-serif' }}>
      <div style={{ width: 220, background: C.navy, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>🏝️ MayRelay</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3, letterSpacing: 2, textTransform: 'uppercase' }}>Administration</div>
        </div>
        <div style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(item => (
            <div key={item.key} onClick={() => setOnglet(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: onglet === item.key ? 'rgba(14,159,142,0.15)' : 'transparent', borderLeft: onglet === item.key ? `3px solid ${C.teal}` : '3px solid transparent', color: onglet === item.key ? '#fff' : C.muted, fontSize: 14 }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, color: '#fff', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 8 }}>👑 {user.nom}</div>
          <div onClick={onLogout} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px 12px' }}>← Deconnexion</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        {onglet === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>Bonjour, {user.nom} 👑</h1>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>Panneau d administrateur MayRelay</div>
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { icon: '🏪', label: 'Partenaires', value: stats.partenaires, color: C.teal },
                  { icon: '🛵', label: 'Livreurs', value: stats.livreurs, color: C.blue },
                  { icon: '📦', label: 'Colis total', value: stats.colis, color: C.amber },
                  { icon: '🚀', label: 'Missions', value: stats.missions, color: C.green },
                ].map(s => (
                  <div key={s.label} style={{ background: C.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }} onClick={() => setOnglet(s.label.toLowerCase())}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {onglet === 'partenaires' && <GestionPartenaires />}
        {onglet === 'livreurs' && <GestionLivreurs />}
        {onglet === 'colis' && <GestionColis />}
      </div>
    </div>
  );
}
