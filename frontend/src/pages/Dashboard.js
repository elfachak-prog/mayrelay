import { useState, useEffect } from 'react';
import { getMesColis, creerColis } from '../services/api';
import SelecteurPays from '../components/SelecteurPays';

const COLORS = {
  ocean: "#0A4B6E", lagoon: "#1A7FA8", coral: "#E8613A",
  foam: "#EAF6FB", dark: "#0D1F2D", mid: "#4A7B94",
  white: "#FFFFFF", green: "#10B981", amber: "#F59E0B",
  border: "#E2E8F0",
};

const statutConfig = {
  en_attente: { label: "En attente", color: "#E8A23A", bg: "#FEF3DC" },
  en_transit: { label: "En transit", color: "#1A7FA8", bg: "#EAF6FB" },
  livre: { label: "Livre", color: "#2EAF7D", bg: "#E0F5EE" },
  paye: { label: "Paye", color: "#2EAF7D", bg: "#E0F5EE" },
  retourne: { label: "Retourne", color: "#EF4444", bg: "#FEE2E2" },
};

const quartiers = ["Mamoudzou Centre","Kaweni","Bandraboua","Koungou","Pamandzi","Dzaoudzi","Labattoir","Labattoir Centre","Boueni","Chiconi","Sada","Tsingoni","Mtsamboro"];

export default function Dashboard({ user, onLogout, ongletInitial }) {
  const [onglet, setOnglet] = useState(ongletInitial || 'dashboard');
  const [colis, setColis] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [paysD1, setPaysD1] = useState('+262');
  const [paysD2, setPaysD2] = useState('+262');
  const [paysE, setPaysE] = useState('+262');
  const [form, setForm] = useState({
    nom_destinataire: '', prenom_destinataire: '',
    telephone_destinataire: '', telephone2_destinataire: '',
    email_destinataire: '', quartier: '', type: 'Colis', notes: '',
    nom_expediteur: '', telephone_expediteur: '', email_expediteur: ''
  });
  const [succes, setSucces] = useState(null);

  useEffect(() => { chargerColis(); }, []);
  useEffect(() => { setOnglet(ongletInitial || 'dashboard'); }, [ongletInitial]);

  const chargerColis = async () => {
    try {
      const res = await getMesColis();
      setColis(res.data.colis);
    } catch (err) { console.error(err); }
  };

  const handleEnvoi = async () => {
    if (!form.nom_destinataire || !form.telephone_destinataire || !form.quartier) return;
    setChargement(true);
    try {
      const tel1 = paysD1 + form.telephone_destinataire.replace(/^0/, '');
      const tel2 = form.telephone2_destinataire ? paysD2 + form.telephone2_destinataire.replace(/^0/, '') : '';
      const telExp = form.telephone_expediteur ? paysE + form.telephone_expediteur.replace(/^0/, '') : '';
      const res = await creerColis({ ...form, telephone_destinataire: tel1, telephone2_destinataire: tel2, telephone_expediteur: telExp });
      setSucces(res.data.colis);
      setForm({ nom_destinataire: '', prenom_destinataire: '', telephone_destinataire: '', telephone2_destinataire: '', email_destinataire: '', quartier: '', type: 'Colis', notes: '', nom_expediteur: '', telephone_expediteur: '', email_expediteur: '' });
      chargerColis();
    } catch (err) { console.error(err); }
    setChargement(false);
  };

  const inputStyle = { width: '100%', padding: '11px 14px', border: `1.5px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, color: COLORS.dark, outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', background: '#FAFBFC' };
  const labelStyle = { display: 'block', fontSize: 11, color: COLORS.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'sans-serif' };

  return (
    <div>
      {onglet === 'dashboard' && (
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.dark, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>Bonjour, {user.nom}</h1>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>Tableau de bord de votre point relais</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { icon: '📦', label: 'Total colis', value: colis.length },
              { icon: '⏳', label: 'En attente', value: colis.filter(c => c.statut === 'en_attente').length },
              { icon: '✅', label: 'Livres', value: colis.filter(c => c.statut === 'livre' || c.statut === 'paye').length },
            ].map(s => (
              <div key={s.label} style={{ background: COLORS.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: COLORS.dark, fontFamily: 'Georgia, serif' }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 16, fontWeight: 700, color: COLORS.dark, fontFamily: 'Georgia, serif' }}>Derniers colis</div>
            {colis.slice(0, 5).map((c, i) => {
              const s = statutConfig[c.statut] || statutConfig.en_attente;
              return (
                <div key={c.id} style={{ padding: '13px 24px', borderBottom: i < 4 ? `1px solid ${COLORS.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: COLORS.lagoon, fontWeight: 600, flex: 1 }}>{c.reference}</div>
                  <div style={{ fontSize: 13, color: COLORS.dark, flex: 1 }}>{c.nom_destinataire}</div>
                  <div style={{ fontSize: 12, color: '#888', flex: 1 }}>{c.quartier}</div>
                  <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                </div>
              );
            })}
            {colis.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Aucun colis enregistre</div>}
          </div>
        </div>
      )}

      {onglet === 'nouveau' && (
        <div style={{ maxWidth: 640 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.dark, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Nouvel envoi</h2>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Remplissez les informations de l envoi</div>

          {succes ? (
            <div style={{ background: COLORS.white, borderRadius: 20, padding: 40, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.dark, marginBottom: 8, fontFamily: 'Georgia, serif' }}>Envoi enregistre</div>
              <div style={{ background: COLORS.foam, borderRadius: 12, padding: '16px 24px', margin: '20px 0' }}>
                <div style={{ fontSize: 11, color: COLORS.mid, textTransform: 'uppercase', letterSpacing: 1.5 }}>Reference</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.ocean, fontFamily: 'monospace', marginTop: 4 }}>{succes.reference}</div>
              </div>
              <div style={{ background: '#E0F5EE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#2EAF7D', marginBottom: 24 }}>
                📱 SMS envoye au destinataire avec le lien de suivi
              </div>
              {succes.qr_code && <img src={succes.qr_code} alt="QR" style={{ width: 150, height: 150, marginBottom: 24 }} />}
              <button onClick={() => setSucces(null)} style={{ background: COLORS.coral, color: COLORS.white, border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                + Nouvel envoi
              </button>
            </div>
          ) : (
            <div style={{ background: COLORS.white, borderRadius: 20, padding: 32, border: `1px solid ${COLORS.border}` }}>

              <div style={{ background: COLORS.foam, borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: COLORS.mid, borderLeft: `3px solid ${COLORS.lagoon}` }}>
                📦 <strong>Destinataire</strong> — La personne qui recevra le colis
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nom *</label>
                  <input style={inputStyle} value={form.nom_destinataire} onChange={e => setForm({ ...form, nom_destinataire: e.target.value })} placeholder="Mmadi" />
                </div>
                <div>
                  <label style={labelStyle}>Prenom</label>
                  <input style={inputStyle} value={form.prenom_destinataire} onChange={e => setForm({ ...form, prenom_destinataire: e.target.value })} placeholder="Ali" />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Telephone principal *</label>
                <div style={{ display: 'flex' }}>
                  <SelecteurPays value={paysD1} onChange={setPaysD1} />
                  <input style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }} value={form.telephone_destinataire} onChange={e => setForm({ ...form, telephone_destinataire: e.target.value })} placeholder="0639 XX XX XX" />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Telephone secondaire (optionnel)</label>
                <div style={{ display: 'flex' }}>
                  <SelecteurPays value={paysD2} onChange={setPaysD2} />
                  <input style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }} value={form.telephone2_destinataire} onChange={e => setForm({ ...form, telephone2_destinataire: e.target.value })} placeholder="0639 XX XX XX" />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Email destinataire (optionnel)</label>
                <input style={inputStyle} type="email" value={form.email_destinataire} onChange={e => setForm({ ...form, email_destinataire: e.target.value })} placeholder="destinataire@email.com" />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Quartier *</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })}>
                  <option value="">Selectionnez un quartier...</option>
                  {quartiers.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Colis', 'Courrier'].map(t => (
                    <div key={t} onClick={() => setForm({ ...form, type: t })} style={{ flex: 1, padding: 12, border: `2px solid ${form.type === t ? COLORS.lagoon : COLORS.border}`, borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 14, color: form.type === t ? COLORS.lagoon : '#888', background: form.type === t ? COLORS.foam : COLORS.white, fontWeight: form.type === t ? 700 : 400 }}>
                      {t === 'Colis' ? '📦' : '✉️'} {t} — {t === 'Colis' ? '5€' : '3€'}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Notes (optionnel)</label>
                <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Instructions particulieres..." />
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, margin: '24px 0' }} />

              <div style={{ background: '#FFF8F0', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#92400E', borderLeft: '3px solid #F59E0B' }}>
                📤 <strong>Expediteur</strong> — Sera notifie si le colis n est pas recupere
              </div>

              <div>
                <label style={labelStyle}>Nom expediteur *</label>
                <input style={inputStyle} value={form.nom_expediteur} onChange={e => setForm({ ...form, nom_expediteur: e.target.value })} placeholder="Votre nom" />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Telephone expediteur *</label>
                <div style={{ display: 'flex' }}>
                  <SelecteurPays value={paysE} onChange={setPaysE} />
                  <input style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }} value={form.telephone_expediteur} onChange={e => setForm({ ...form, telephone_expediteur: e.target.value })} placeholder="0639 XX XX XX" />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Email expediteur (optionnel)</label>
                <input style={inputStyle} type="email" value={form.email_expediteur} onChange={e => setForm({ ...form, email_expediteur: e.target.value })} placeholder="expediteur@email.com" />
              </div>

              <button onClick={handleEnvoi} disabled={chargement || !form.nom_destinataire || !form.telephone_destinataire || !form.quartier}
                style={{ marginTop: 24, width: '100%', padding: 15, background: !form.nom_destinataire || !form.telephone_destinataire || !form.quartier ? '#CCC' : COLORS.coral, border: 'none', borderRadius: 12, color: COLORS.white, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                {chargement ? 'Enregistrement...' : 'Enregistrer l envoi →'}
              </button>
            </div>
          )}
        </div>
      )}

      {onglet === 'colis' && (
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.dark, marginBottom: 24, fontFamily: 'Georgia, serif' }}>Mes colis</h2>
          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Reference', 'Destinataire', 'Quartier', 'Type', 'Prix', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: '#AAA', textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colis.map((c, i) => {
                  const s = statutConfig[c.statut] || statutConfig.en_attente;
                  return (
                    <tr key={c.id} style={{ borderTop: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : '#FAFBFC' }}>
                      <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: COLORS.ocean, fontWeight: 600 }}>{c.reference}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: COLORS.dark }}>{c.nom_destinataire}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#666' }}>{c.quartier}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12 }}>{c.type === 'Colis' ? '📦' : '✉️'} {c.type}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: COLORS.ocean }}>{c.prix}€</td>
                      <td style={{ padding: '13px 16px' }}><span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.label}</span></td>
                      <td style={{ padding: '13px 16px', fontSize: 11, color: '#AAA' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {colis.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Aucun colis enregistre</div>}
          </div>
        </div>
      )}
    </div>
  );
}
