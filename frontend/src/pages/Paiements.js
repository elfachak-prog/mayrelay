import { useState, useEffect } from 'react';
import API from '../services/api';

const C = {
  ocean: "#0A4B6E", lagoon: "#1A7FA8", coral: "#E8613A",
  foam: "#EAF6FB", dark: "#0D1F2D", mid: "#4A7B94",
  white: "#FFFFFF", green: "#10B981", amber: "#F59E0B",
  red: "#EF4444", border: "#E2E8F0",
};

export default function Paiements({ user }) {
  const [paiements, setPaiements] = useState([]);
  const [totalDu, setTotalDu] = useState(0);
  const [colis, setColis] = useState([]);
  const [modal, setModal] = useState(null);
  const [avecLivreur, setAvecLivreur] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState('');

  useEffect(() => {
    chargerPaiements();
    chargerColis();
  }, []);

  const chargerPaiements = async () => {
    try {
      const res = await API.get('/paiements/mes-paiements');
      setPaiements(res.data.paiements);
      setTotalDu(res.data.total_du);
    } catch (err) { console.error(err); }
  };

  const chargerColis = async () => {
    try {
      const res = await API.get('/colis');
      setColis(res.data.colis.filter(c => c.statut !== 'paye'));
    } catch (err) { console.error(err); }
  };

  const handlePayer = async () => {
    if (!modal) return;
    setChargement(true);
    try {
      await API.post(`/paiements/enregistrer/${modal.id}`, { avec_livreur: avecLivreur });
      setSucces(`Paiement de ${modal.prix}€ enregistré pour ${modal.nom_destinataire}`);
      setModal(null);
      chargerPaiements();
      chargerColis();
      setTimeout(() => setSucces(''), 4000);
    } catch (err) { console.error(err); }
    setChargement(false);
  };

  const prix = modal ? parseFloat(modal.prix) : 0;
  const partPartenaire = avecLivreur ? (prix * 0.25).toFixed(2) : (prix * 0.45).toFixed(2);
  const partLivreur = avecLivreur ? (prix * 0.30).toFixed(2) : '0.00';
  const partMayrelay = avecLivreur ? (prix * 0.20).toFixed(2) : (prix * 0.55).toFixed(2);

  const inputStyle = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.dark, outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', background: '#FAFBFC' };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: C.dark, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Paiements</h2>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24, fontFamily: 'sans-serif' }}>Suivi des encaissements et reversements</div>

      {succes && (
        <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.green, fontFamily: 'sans-serif' }}>
          ✅ {succes}
        </div>
      )}

      {/* Résumé financier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: C.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💶</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.dark, fontFamily: 'Georgia, serif' }}>{paiements.reduce((s, p) => s + parseFloat(p.montant_total), 0).toFixed(2)}€</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontFamily: 'sans-serif' }}>Total encaissé</div>
        </div>
        <div style={{ background: C.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏦</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.coral, fontFamily: 'Georgia, serif' }}>{totalDu}€</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontFamily: 'sans-serif' }}>À reverser à MayRelay</div>
        </div>
        <div style={{ background: C.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.green, fontFamily: 'Georgia, serif' }}>{paiements.filter(p => p.statut === 'reverse').length}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontFamily: 'sans-serif' }}>Reversements confirmés</div>
        </div>
      </div>

      {/* Colis à encaisser */}
      {colis.length > 0 && (
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: 'Georgia, serif' }}>Colis à encaisser</div>
            <div style={{ background: '#FEF3C7', color: C.amber, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'sans-serif' }}>{colis.length} en attente</div>
          </div>
          {colis.map((c, i) => (
            <div key={c.id} style={{ padding: '14px 24px', borderBottom: i < colis.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.lagoon, fontWeight: 600, flex: 1 }}>{c.reference}</div>
              <div style={{ fontSize: 13, color: C.dark, flex: 1, fontFamily: 'sans-serif' }}>{c.nom_destinataire}</div>
              <div style={{ fontSize: 12, color: '#888', flex: 1, fontFamily: 'sans-serif' }}>{c.quartier}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ocean, fontFamily: 'sans-serif' }}>{c.prix}€</div>
              <button onClick={() => setModal(c)} style={{ background: C.coral, color: C.white, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                Encaisser
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Historique paiements */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, fontFamily: 'Georgia, serif' }}>Historique des paiements</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Reference', 'Destinataire', 'Total', 'Votre part', 'A reverser', 'Statut', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: '#AAA', textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paiements.map((p, i) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: C.lagoon, fontWeight: 600 }}>{p.reference}</td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: C.dark, fontFamily: 'sans-serif' }}>{p.nom_destinataire}</td>
                <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.dark, fontFamily: 'sans-serif' }}>{p.montant_total}€</td>
                <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.green, fontFamily: 'sans-serif' }}>{p.part_partenaire_exp}€</td>
                <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.coral, fontFamily: 'sans-serif' }}>{p.part_mayrelay}€</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ background: p.statut === 'reverse' ? '#D1FAE5' : '#FEF3C7', color: p.statut === 'reverse' ? C.green : C.amber, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'sans-serif' }}>
                    {p.statut === 'reverse' ? 'Reversé' : 'En attente'}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 11, color: '#AAA', fontFamily: 'sans-serif' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {paiements.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: 'sans-serif' }}>Aucun paiement enregistré</div>}
      </div>

      {/* Modal encaissement */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: C.white, borderRadius: 20, padding: 36, width: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.dark, fontFamily: 'Georgia, serif' }}>Encaisser le paiement</div>
              <div onClick={() => setModal(null)} style={{ cursor: 'pointer', color: '#AAA', fontSize: 22 }}>×</div>
            </div>

            <div style={{ background: C.foam, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, fontFamily: 'sans-serif' }}>{modal.nom_destinataire} — {modal.reference}</div>
              <div style={{ fontSize: 12, color: C.mid, fontFamily: 'sans-serif', marginTop: 4 }}>{modal.type} · {modal.quartier} · {modal.prix}€</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 10, fontFamily: 'sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>Ce colis a-t-il été livré par un livreur ?</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[true, false].map(v => (
                  <div key={v} onClick={() => setAvecLivreur(v)} style={{ flex: 1, padding: 12, border: `2px solid ${avecLivreur === v ? C.lagoon : C.border}`, borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, color: avecLivreur === v ? C.lagoon : '#888', background: avecLivreur === v ? C.foam : C.white, fontWeight: avecLivreur === v ? 700 : 400, fontFamily: 'sans-serif' }}>
                    {v ? '🛵 Oui, avec livreur' : '🏪 Non, même point relais'}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: C.mid, fontFamily: 'sans-serif', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>Répartition</div>
              {[
                ['Votre part', partPartenaire + '€', C.green],
                avecLivreur ? ['Part livreur', partLivreur + '€', C.lagoon] : null,
                ['À reverser à MayRelay', partMayrelay + '€', C.coral],
              ].filter(Boolean).map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontFamily: 'sans-serif' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#F0F3F5', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'sans-serif', color: '#666' }}>Annuler</button>
              <button onClick={handlePayer} disabled={chargement} style={{ flex: 1, padding: 12, background: C.coral, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', color: C.white }}>
                {chargement ? 'Enregistrement...' : 'Confirmer l encaissement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
