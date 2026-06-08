import { useState, useEffect } from 'react';
import API from '../services/api';

const C = {
  navy: "#0B1F3A", teal: "#0E9F8E", white: "#FFFFFF",
  border: "#E2E8F0", dark: "#1E293B", muted: "#94A3B8",
  green: "#10B981", red: "#EF4444", amber: "#F59E0B",
  coral: "#E8613A",
};

export default function Finance() {
  const [data, setData] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [chargement, setChargement] = useState(null);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const res = await API.get('/admin/finance');
      setData(res.data);
    } catch (err) { console.error(err); }
  };

  const handleConfirmer = async (partenaire_id, nom) => {
    setChargement(partenaire_id);
    try {
      await API.put(`/admin/finance/confirmer/${partenaire_id}`);
      setConfirmation(`Reversement de ${nom} confirme`);
      charger();
      setTimeout(() => setConfirmation(''), 3000);
    } catch (err) { console.error(err); }
    setChargement(null);
  };

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: 'sans-serif' }}>Chargement...</div>;

  const { totaux, par_partenaire } = data;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Suivi financier</h2>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24, fontFamily: 'sans-serif' }}>Vue globale des reversements partenaires</div>

      {confirmation && (
        <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.green, fontFamily: 'sans-serif' }}>
          ✅ {confirmation}
        </div>
      )}

      {/* Totaux globaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { icon: '💶', label: 'Total encaissé', value: parseFloat(totaux.total_encaisse || 0).toFixed(2) + '€', color: C.dark },
          { icon: '⏳', label: 'En attente de reversement', value: parseFloat(totaux.total_a_recevoir || 0).toFixed(2) + '€', color: C.coral },
          { icon: '✅', label: 'Déjà reçu', value: parseFloat(totaux.total_recu || 0).toFixed(2) + '€', color: C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontFamily: 'sans-serif' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Détail par partenaire */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>Reversements par partenaire</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Partenaire', 'Zone', 'Colis', 'Volume total', 'Part MayRelay', 'Deja recu', 'A recevoir', 'Action'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {par_partenaire.map((p, i) => {
              const aRecevoir = parseFloat(p.montant_a_recevoir || 0);
              const dejaRecu = parseFloat(p.montant_recu || 0);
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif' }}>{p.nom}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>{p.email}</div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>{p.zone}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: 'sans-serif' }}>{p.nb_colis || 0}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#666', fontFamily: 'sans-serif' }}>{parseFloat(p.volume_total || 0).toFixed(2)}€</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.teal, fontFamily: 'sans-serif' }}>{parseFloat(p.total_du || 0).toFixed(2)}€</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.green, fontFamily: 'sans-serif' }}>{dejaRecu.toFixed(2)}€</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: aRecevoir > 0 ? C.coral : '#888', fontFamily: 'sans-serif' }}>
                      {aRecevoir.toFixed(2)}€
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {aRecevoir > 0 ? (
                      <button onClick={() => handleConfirmer(p.id, p.nom)} disabled={chargement === p.id}
                        style={{ background: C.teal, color: C.white, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                        {chargement === p.id ? '...' : 'Confirmer reception'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: C.green, fontFamily: 'sans-serif' }}>✅ A jour</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {par_partenaire.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: 'sans-serif' }}>Aucun paiement enregistre</div>
        )}
      </div>
    </div>
  );
}
