import { useState, useEffect } from 'react';
import API from '../services/api';
import Parametres from './Parametres';
import Finance from './Finance';
import GestionSMS from './Sms';

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

const FORM_VIDE = { nom: '', email: '', mot_de_passe: '', telephone: '', zone: '', horaires: '08:00-20:00', adresse: '', latitude: '', longitude: '' };

function GestionPartenaires() {
  const [partenaires, setPartenaires] = useState([]);
  const [modal, setModal] = useState(null); // null | 'creer' | 'modifier'
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VIDE);
  const [message, setMessage] = useState('');
  const [chargement, setChargement] = useState(false);
  const [confirmSuppr, setConfirmSuppr] = useState(null);

  const zones = ['Mamoudzou Centre', 'Kaweni', 'Bandraboua', 'Koungou', 'Pamandzi', 'Dzaoudzi', 'Labattoir', 'Labattoir Centre', 'Boueni', 'Chiconi', 'Sada', 'Tsingoni'];
  const inputStyle = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.navy, outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', background: '#FAFBFC', marginTop: 4 };

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const res = await API.get('/admin/partenaires');
      setPartenaires(res.data.partenaires);
    } catch (err) { console.error(err); }
  };

  const ouvrirCreer = () => { setForm(FORM_VIDE); setMessage(''); setModal('creer'); };

  const ouvrirModifier = (p) => {
    setEditId(p.id);
    setForm({ nom: p.nom, email: p.email, mot_de_passe: '', telephone: p.telephone, zone: p.zone || '', horaires: p.horaires || '08:00-20:00', adresse: p.adresse || '', latitude: p.latitude ?? '', longitude: p.longitude ?? '' });
    setMessage('');
    setModal('modifier');
  };

  const fermerModal = () => { setModal(null); setEditId(null); setMessage(''); };

  const handleSauvegarder = async () => {
    if (!form.nom || !form.email || !form.telephone || !form.zone) { setMessage('Champs obligatoires manquants'); return; }
    if (modal === 'creer' && !form.mot_de_passe) { setMessage('Le mot de passe est obligatoire à la création'); return; }
    setChargement(true);
    try {
      if (modal === 'creer') {
        await API.post('/admin/partenaires', form);
      } else {
        await API.put(`/admin/partenaires/${editId}`, form);
      }
      fermerModal();
      charger();
    } catch (err) { setMessage(err.response?.data?.message || 'Erreur'); }
    setChargement(false);
  };

  const handleStatut = async (id, statut) => {
    try { await API.put(`/admin/partenaires/${id}/statut`, { statut }); charger(); }
    catch (err) { console.error(err); }
  };

  const handleSupprimer = async (id) => {
    try {
      await API.delete(`/admin/partenaires/${id}`);
      setConfirmSuppr(null);
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Impossible de supprimer ce partenaire');
      setConfirmSuppr(null);
    }
  };

  const champTexte = (label, key, placeholder, type = 'text') => (
    <div key={key} style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{label}</label>
      <input type={type} style={inputStyle} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>Partenaires</h2>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2, fontFamily: 'sans-serif' }}>{partenaires.length} point(s) relais</div>
        </div>
        <button onClick={ouvrirCreer} style={{ background: C.teal, color: C.white, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
          + Nouveau partenaire
        </button>
      </div>

      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Nom', 'Zone', 'Adresse', 'GPS', 'Horaires', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partenaires.map((p, i) => {
              const s = statutConfig[p.statut] || statutConfig.en_attente;
              const hasGps = p.latitude && p.longitude;
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif' }}>{p.nom}</div>
                    <div style={{ fontSize: 11, color: '#999', fontFamily: 'sans-serif' }}>{p.email}</div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{p.zone}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{p.adresse || <span style={{ color: '#ccc' }}>—</span>}</td>
                  <td style={{ padding: '13px 16px' }}>
                    {hasGps ? (
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.teal }}>
                        <div>{parseFloat(p.latitude).toFixed(5)}</div>
                        <div>{parseFloat(p.longitude).toFixed(5)}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#EF4444', fontFamily: 'sans-serif' }}>⚠ Non renseigné</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{p.horaires}</td>
                  <td style={{ padding: '13px 16px' }}><Tag {...s} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => ouvrirModifier(p)} style={{ background: '#EFF6FF', color: C.blue, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Modifier</button>
                      {p.statut !== 'actif' && (
                        <button onClick={() => handleStatut(p.id, 'actif')} style={{ background: '#D1FAE5', color: C.green, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Activer</button>
                      )}
                      {p.statut === 'actif' && (
                        <button onClick={() => handleStatut(p.id, 'suspendu')} style={{ background: '#FEF3C7', color: C.amber, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Suspendre</button>
                      )}
                      <button onClick={() => setConfirmSuppr(p)} style={{ background: '#FEE2E2', color: C.red, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {partenaires.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: 'sans-serif' }}>Aucun partenaire pour l instant</div>}
      </div>

      {/* Modal créer / modifier */}
      {modal && (
        <Modal title={modal === 'creer' ? 'Nouveau partenaire' : 'Modifier le partenaire'} onClose={fermerModal}>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
            {champTexte('Nom du point relais *', 'nom', 'Aznovik Cyber')}
            {champTexte('Email *', 'email', 'contact@email.com', 'email')}
            {champTexte(modal === 'creer' ? 'Mot de passe *' : 'Nouveau mot de passe (laisser vide = inchangé)', 'mot_de_passe', '••••••••', 'password')}
            {champTexte('Téléphone *', 'telephone', '0639 XX XX XX')}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>Zone / Quartier *</label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
                <option value="">Sélectionner une zone...</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            {champTexte('Horaires', 'horaires', '08:00-20:00')}
            {champTexte('Adresse', 'adresse', 'Rue de la République, Kaweni')}

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', fontFamily: 'sans-serif', marginBottom: 10 }}>📍 Coordonnées GPS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>Latitude</label>
                  <input type="number" step="any" style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="-12.78760" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>Longitude</label>
                  <input type="number" step="any" style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="45.20970" />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif', marginTop: 8 }}>
                💡 Obtenir les coordonnées : Google Maps → clic droit sur le lieu → copier lat/lng
              </div>
            </div>
          </div>

          {message && <div style={{ background: '#FEE2E2', color: C.red, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, fontFamily: 'sans-serif' }}>{message}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={fermerModal} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'sans-serif', color: '#666' }}>Annuler</button>
            <button onClick={handleSauvegarder} disabled={chargement} style={{ flex: 2, padding: 12, background: C.teal, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', color: C.white }}>
              {chargement ? 'Enregistrement...' : (modal === 'creer' ? 'Créer le partenaire' : 'Enregistrer les modifications')}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal confirmation suppression */}
      {confirmSuppr && (
        <Modal title="Supprimer ce partenaire ?" onClose={() => setConfirmSuppr(null)}>
          <div style={{ fontSize: 14, color: C.text, fontFamily: 'sans-serif', marginBottom: 8 }}>
            Tu es sur le point de supprimer <strong>{confirmSuppr.nom}</strong>.
          </div>
          <div style={{ fontSize: 13, color: C.red, fontFamily: 'sans-serif', marginBottom: 24 }}>
            Cette action est irréversible. Le partenaire ne peut pas être supprimé s'il est associé à des missions.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmSuppr(null)} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'sans-serif', color: '#666' }}>Annuler</button>
            <button onClick={() => handleSupprimer(confirmSuppr.id)} style={{ flex: 1, padding: 12, background: C.red, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', color: C.white }}>Supprimer définitivement</button>
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
  const [corbeille, setCorbeille] = useState([]);
  const [onglet, setOnglet] = useState('actifs');
  const [filtre, setFiltre] = useState('tous');
  const [modalArchive, setModalArchive] = useState(null);
  const [modalSuppr, setModalSuppr] = useState(null);
  const [etapeSuppr, setEtapeSuppr] = useState(1);
  const [actionning, setActionning] = useState(false);

  const statutColisConfig = {
    en_attente: { label: 'En attente', color: C.amber,    bg: '#FEF3C7' },
    en_transit: { label: 'En transit', color: C.blue,     bg: '#DBEAFE' },
    livre:      { label: 'Livré',      color: C.green,    bg: '#D1FAE5' },
    paye:       { label: 'Payé',       color: '#8B5CF6',  bg: '#EDE9FE' },
  };

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const [actRes, corbRes] = await Promise.all([
        API.get('/admin/colis'),
        API.get('/admin/colis/corbeille'),
      ]);
      setColis(actRes.data.colis);
      setCorbeille(corbRes.data.colis);
    } catch (err) { console.error(err); }
  };

  const archiver = async () => {
    if (!modalArchive) return;
    setActionning(true);
    try {
      await API.patch(`/admin/colis/${modalArchive.id}/archiver`);
      setModalArchive(null);
      await charger();
    } catch (err) { console.error(err); }
    setActionning(false);
  };

  const supprimerDefinitif = async () => {
    if (!modalSuppr) return;
    setActionning(true);
    try {
      await API.delete(`/admin/colis/${modalSuppr.id}`);
      setModalSuppr(null);
      setEtapeSuppr(1);
      await charger();
    } catch (err) { console.error(err); }
    setActionning(false);
  };

  const fermerSuppr = () => { setModalSuppr(null); setEtapeSuppr(1); };

  const filtered = onglet === 'actifs'
    ? (filtre === 'tous' ? colis : colis.filter(c => c.statut === filtre))
    : corbeille;

  const headers = onglet === 'actifs'
    ? ['Référence', 'Partenaire', 'Destinataire', 'Quartier', 'Type', 'Prix', 'Statut', 'Date', '']
    : ['Référence', 'Partenaire', 'Destinataire', 'Quartier', 'Type', 'Prix', 'Statut', 'Archivé le', ''];

  return (
    <div>
      {/* ── Modal : archiver ──────────────────────────────────── */}
      {modalArchive && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.white, borderRadius: 16, padding: '32px 36px', width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 12 }}>Archiver ce colis ?</div>
            <div style={{ fontSize: 13, color: '#555', fontFamily: 'sans-serif', marginBottom: 20, lineHeight: 1.6 }}>
              Le colis <strong style={{ fontFamily: 'monospace', color: C.teal }}>{modalArchive.reference}</strong> sera déplacé dans la corbeille.<br/>
              Les missions et paiements associés ne seront pas modifiés.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalArchive(null)} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#F0F3F5', color: '#555', fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>Annuler</button>
              <button onClick={archiver} disabled={actionning} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.amber, color: C.white, fontSize: 13, fontWeight: 700, cursor: actionning ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
                {actionning ? '…' : '🗑️ Archiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : suppression définitive (double confirmation) ── */}
      {modalSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.white, borderRadius: 16, padding: '32px 36px', width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            {etapeSuppr === 1 ? (
              <>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.red, fontFamily: 'Georgia, serif', marginBottom: 12 }}>Supprimer définitivement ?</div>
                <div style={{ fontSize: 13, color: '#555', fontFamily: 'sans-serif', marginBottom: 14 }}>
                  Colis : <strong style={{ fontFamily: 'monospace', color: C.teal }}>{modalSuppr.reference}</strong>
                </div>
                <div style={{ background: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: 10, padding: '12px 14px', marginBottom: 24, fontSize: 12, color: C.red, fontFamily: 'sans-serif', lineHeight: 1.7 }}>
                  ⚠️ Cette action est irréversible et supprimera toute trace du colis (missions, paiements).
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={fermerSuppr} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#F0F3F5', color: '#555', fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>Annuler</button>
                  <button onClick={() => setEtapeSuppr(2)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.red, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>Continuer →</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.red, fontFamily: 'Georgia, serif', marginBottom: 12 }}>Confirmation finale</div>
                <div style={{ fontSize: 13, color: '#333', fontFamily: 'sans-serif', marginBottom: 24, lineHeight: 1.7 }}>
                  Confirmez-vous la suppression définitive de <strong style={{ fontFamily: 'monospace', color: C.teal }}>{modalSuppr.reference}</strong> ?<br/>
                  <span style={{ color: C.red, fontWeight: 600 }}>Cette action est irréversible et supprimera toute trace du colis.</span>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={fermerSuppr} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#F0F3F5', color: '#555', fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>Annuler</button>
                  <button onClick={supprimerDefinitif} disabled={actionning} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.red, color: C.white, fontSize: 13, fontWeight: 700, cursor: actionning ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
                    {actionning ? '…' : '🔥 Supprimer définitivement'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>Tous les colis</h2>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2, fontFamily: 'sans-serif' }}>
            {onglet === 'actifs' ? `${colis.length} colis actifs` : `${corbeille.length} colis en corbeille`}
          </div>
        </div>
        {/* Onglets Actifs / Corbeille */}
        <div style={{ display: 'flex', background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 4, gap: 2 }}>
          <button onClick={() => setOnglet('actifs')} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: onglet === 'actifs' ? C.navy : 'transparent', color: onglet === 'actifs' ? C.white : '#666', fontSize: 12, fontWeight: onglet === 'actifs' ? 700 : 400, cursor: 'pointer', fontFamily: 'sans-serif' }}>
            📦 Actifs
          </button>
          <button onClick={() => setOnglet('corbeille')} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: onglet === 'corbeille' ? C.red : 'transparent', color: onglet === 'corbeille' ? C.white : (corbeille.length > 0 ? C.red : '#666'), fontSize: 12, fontWeight: onglet === 'corbeille' ? 700 : 400, cursor: 'pointer', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            🗑️ Corbeille
            {corbeille.length > 0 && <span style={{ background: onglet === 'corbeille' ? 'rgba(255,255,255,0.25)' : '#FEE2E2', color: onglet === 'corbeille' ? C.white : C.red, borderRadius: 20, padding: '0px 7px', fontSize: 11, fontWeight: 700 }}>{corbeille.length}</span>}
          </button>
        </div>
      </div>

      {/* ── Filtres statut (actifs seulement) ─────────────────── */}
      {onglet === 'actifs' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['tous', 'Tous'], ['en_attente', 'En attente'], ['en_transit', 'En transit'], ['livre', 'Livrés'], ['paye', 'Payés']].map(([k, l]) => (
            <button key={k} onClick={() => setFiltre(k)} style={{ padding: '8px 14px', borderRadius: 20, border: `1px solid ${filtre === k ? C.navy : C.border}`, cursor: 'pointer', background: filtre === k ? C.navy : C.white, color: filtre === k ? C.white : '#666', fontSize: 12, fontFamily: 'sans-serif', fontWeight: filtre === k ? 700 : 400 }}>{l}</button>
          ))}
        </div>
      )}

      {/* ── Tableau ───────────────────────────────────────────── */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {headers.map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const s = statutColisConfig[c.statut] || { label: c.statut, color: C.muted, bg: '#F1F5F9' };
              return (
                <tr key={c.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                  <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: C.teal, fontWeight: 600 }}>{c.reference}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{c.partenaire_nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: 'sans-serif' }}>{c.nom_destinataire}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{c.quartier}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, fontFamily: 'sans-serif' }}>{c.type === 'Colis' ? '📦' : '✉️'} {c.type}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.teal, fontFamily: 'sans-serif' }}>{c.prix}€</td>
                  <td style={{ padding: '13px 16px' }}><Tag {...s} /></td>
                  <td style={{ padding: '13px 16px', fontSize: 11, color: '#AAA', fontFamily: 'sans-serif' }}>
                    {new Date(onglet === 'actifs' ? c.created_at : c.updated_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {onglet === 'actifs' ? (
                      <button onClick={() => setModalArchive(c)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid #FEE2E2`, background: '#FFF5F5', color: C.red, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                        🗑️ Supprimer
                      </button>
                    ) : (
                      <button onClick={() => { setModalSuppr(c); setEtapeSuppr(1); }} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid #FECACA`, background: '#FEF2F2', color: C.red, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                        🔥 Supprimer définitivement
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: 'sans-serif' }}>
            {onglet === 'actifs' ? 'Aucun colis actif' : 'La corbeille est vide'}
          </div>
        )}
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
    { key: 'finance', icon: '💶', label: 'Finance' },
    { key: 'sms', icon: '💬', label: 'SMS Twilio' },
    { key: 'parametres', icon: '⚙️', label: 'Paramètres' },
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
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>Bonjour, {user.nom} 👑</h1>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>Tableau de bord MayRelay</div>

            {stats ? (
              <>
                {/* ── 4 stat cards ─────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
                  {[
                    {
                      icon: '📦', label: 'Colis livrés', value: stats.colis_livres,
                      sub: `${stats.colis_total} au total`,
                      color: C.teal, bg: '#F0FDFB',
                    },
                    {
                      icon: '💶', label: 'Revenus totaux', value: `${Number(stats.revenus_total).toFixed(2)} €`,
                      sub: `${Number(stats.revenus_ce_mois).toFixed(2)} € ce mois`,
                      color: C.green, bg: '#F0FDF4',
                    },
                    {
                      icon: '🛵', label: 'Livreurs actifs', value: stats.livreurs_actifs,
                      sub: `${stats.livreurs} inscrits au total`,
                      color: C.blue, bg: '#EFF6FF',
                    },
                    {
                      icon: '🚀', label: 'Missions terminées', value: stats.missions_terminees,
                      sub: `${stats.partenaires} partenaires`,
                      color: C.amber, bg: '#FFFBEB',
                    },
                  ].map(s => (
                    <div key={s.label} style={{ background: C.white, borderRadius: 16, padding: '20px 22px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginTop: 4, fontFamily: 'sans-serif' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontFamily: 'sans-serif' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ── Graphique activité 7 jours ───────────────────── */}
                {stats.activite_semaine && stats.activite_semaine.length > 0 && (() => {
                  const maxColis = Math.max(...stats.activite_semaine.map(j => j.nb_colis), 1);
                  const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                  return (
                    <div style={{ background: C.white, borderRadius: 16, padding: '24px 28px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', marginBottom: 28 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>Activité des 7 derniers jours</div>
                          <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginTop: 2 }}>Colis créés par jour</div>
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>
                          Total : <strong style={{ color: C.teal }}>{stats.activite_semaine.reduce((s, j) => s + j.nb_colis, 0)} colis</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
                        {stats.activite_semaine.map((j, i) => {
                          const pct = maxColis === 0 ? 0 : Math.round((j.nb_colis / maxColis) * 100);
                          const date = new Date(j.jour);
                          const isToday = new Date().toDateString() === date.toDateString();
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              {j.nb_colis > 0 && (
                                <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? C.teal : C.muted, fontFamily: 'sans-serif' }}>{j.nb_colis}</div>
                              )}
                              <div style={{ width: '100%', position: 'relative', flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                                <div
                                  title={`${j.nb_colis} colis — ${Number(j.revenus).toFixed(2)} €`}
                                  style={{
                                    width: '100%',
                                    height: `${Math.max(pct, j.nb_colis > 0 ? 8 : 4)}%`,
                                    background: isToday
                                      ? `linear-gradient(to top, ${C.teal}, #20D5BF)`
                                      : j.nb_colis > 0
                                        ? `linear-gradient(to top, #CBD5E1, #E2E8F0)`
                                        : '#F1F5F9',
                                    borderRadius: '6px 6px 0 0',
                                    transition: 'height 0.3s ease',
                                    minHeight: 4,
                                  }}
                                />
                              </div>
                              <div style={{ fontSize: 10, color: isToday ? C.teal : C.muted, fontFamily: 'sans-serif', fontWeight: isToday ? 700 : 400 }}>
                                {jours[date.getDay()]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Dernières transactions ────────────────────────── */}
                {stats.dernieres_transactions && stats.dernieres_transactions.length > 0 && (
                  <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>Dernières transactions</div>
                        <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginTop: 2 }}>10 paiements les plus récents</div>
                      </div>
                      <button onClick={() => setOnglet('finance')} style={{ fontSize: 12, color: C.teal, background: 'transparent', border: `1px solid ${C.teal}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 600 }}>Voir tout →</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Référence', 'Partenaire', 'Destinataire', 'Montant', 'Livreur', 'Date'].map(h => (
                            <th key={h} style={{ padding: '10px 20px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.dernieres_transactions.map((t, i) => (
                          <tr key={t.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                            <td style={{ padding: '13px 20px', fontFamily: 'monospace', fontSize: 12, color: C.teal, fontWeight: 600 }}>{t.reference}</td>
                            <td style={{ padding: '13px 20px', fontSize: 12, color: '#444', fontFamily: 'sans-serif' }}>{t.partenaire_nom}</td>
                            <td style={{ padding: '13px 20px', fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: 'sans-serif' }}>{t.nom_destinataire}</td>
                            <td style={{ padding: '13px 20px' }}>
                              <span style={{ fontWeight: 700, color: C.green, fontSize: 13, fontFamily: 'sans-serif' }}>{Number(t.montant_total).toFixed(2)} €</span>
                            </td>
                            <td style={{ padding: '13px 20px' }}>
                              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: 'sans-serif', fontWeight: 700, background: t.avec_livreur ? '#DBEAFE' : '#F1F5F9', color: t.avec_livreur ? C.blue : C.muted }}>
                                {t.avec_livreur ? '🛵 Oui' : 'Non'}
                              </span>
                            </td>
                            <td style={{ padding: '13px 20px', fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>
                              {new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* État vide si pas encore de transactions */}
                {(!stats.dernieres_transactions || stats.dernieres_transactions.length === 0) && (
                  <div style={{ background: C.white, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
                    <div style={{ fontSize: 14, color: '#666', fontFamily: 'sans-serif' }}>Aucune transaction pour l'instant</div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.border}`, height: 100, background: 'linear-gradient(90deg, #F8FAFC 25%, #F1F5F9 50%, #F8FAFC 75%)', backgroundSize: '200% 100%' }} />
                ))}
              </div>
            )}
          </div>
        )}
        {onglet === 'partenaires' && <GestionPartenaires />}
        {onglet === 'livreurs' && <GestionLivreurs />}
        {onglet === 'colis' && <GestionColis />}
        {onglet === 'parametres' && <Parametres />}
        {onglet === 'finance' && <Finance />}
        {onglet === 'sms' && <GestionSMS />}
      </div>
    </div>
  );
}

