import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import API from '../services/api';

const C = {
  navy: "#0B1F3A", teal: "#0E9F8E", white: "#FFFFFF",
  border: "#E2E8F0", dark: "#1E293B", muted: "#94A3B8",
  green: "#10B981", red: "#EF4444", amber: "#F59E0B",
  coral: "#E8613A",
};

const PERIODES = [
  { value: 'mois', label: 'Ce mois' },
  { value: 'trimestre', label: 'Ce trimestre' },
  { value: 'annee', label: 'Cette année' },
  { value: 'tout', label: 'Tout' },
];

function fmt(n) { return parseFloat(n || 0).toFixed(2); }

export default function Finance() {
  const [data, setData] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [chargement, setChargement] = useState(null);
  const [periode, setPeriode] = useState('tout');
  const [exportEnCours, setExportEnCours] = useState(false);

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

  const handleExporter = async () => {
    setExportEnCours(true);
    try {
      const res = await API.get(`/admin/finance/export?periode=${periode}`);
      const { transactions, resume_mensuel, par_partenaire } = res.data;

      const wb = XLSX.utils.book_new();

      // Feuille 1 : Transactions
      const lignesTransactions = [
        ['Référence', 'Date', 'Partenaire', 'Destinataire', 'Type', 'Prix (€)',
         'Part Part. Exp. (€)', 'Part Part. Réc. (€)', 'Part Livreur (€)',
         'Part MayRelay (€)', 'Avec livreur', 'Statut'],
        ...transactions.map(t => [
          t.reference,
          new Date(t.date).toLocaleDateString('fr-FR'),
          t.partenaire,
          t.destinataire,
          t.type,
          parseFloat(fmt(t.prix)),
          parseFloat(fmt(t.part_partenaire_exp)),
          parseFloat(fmt(t.part_partenaire_rec)),
          parseFloat(fmt(t.part_livreur)),
          parseFloat(fmt(t.part_mayrelay)),
          t.avec_livreur ? 'Oui' : 'Non',
          t.statut,
        ]),
      ];
      const wsTransactions = XLSX.utils.aoa_to_sheet(lignesTransactions);
      wsTransactions['!cols'] = [12, 12, 18, 18, 12, 10, 14, 14, 14, 14, 12, 12].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

      // Feuille 2 : Résumé mensuel
      const lignesMensuel = [
        ['Mois', 'Revenus bruts (€)', 'Coûts SMS estimés (€)', 'Marge nette (€)'],
        ...resume_mensuel.map(r => [
          r.mois,
          parseFloat(fmt(r.revenus_bruts)),
          parseFloat(r.couts_sms_estimes),
          parseFloat(r.marge_nette),
        ]),
      ];
      const wsMensuel = XLSX.utils.aoa_to_sheet(lignesMensuel);
      wsMensuel['!cols'] = [12, 18, 20, 16].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsMensuel, 'Résumé mensuel');

      // Feuille 3 : Partenaires
      const lignesPartenaires = [
        ['Partenaire', 'Zone', 'Nb colis', 'Volume total (€)', 'Gains partenaire (€)', 'Part MayRelay (€)'],
        ...par_partenaire.map(p => [
          p.partenaire,
          p.zone,
          p.nb_colis,
          parseFloat(fmt(p.volume_total)),
          parseFloat(fmt(p.gains_partenaire)),
          parseFloat(fmt(p.part_mayrelay)),
        ]),
      ];
      const wsPartenaires = XLSX.utils.aoa_to_sheet(lignesPartenaires);
      wsPartenaires['!cols'] = [20, 14, 10, 16, 20, 16].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsPartenaires, 'Partenaires');

      const labelPeriode = PERIODES.find(p => p.value === periode)?.label.replace(/\s/g, '_') || 'tout';
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `MayRelay_Finance_${labelPeriode}_${dateStr}.xlsx`);
    } catch (err) {
      console.error(err);
    }
    setExportEnCours(false);
  };

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: 'sans-serif' }}>Chargement...</div>;

  const { totaux, par_partenaire } = data;

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Suivi financier</h2>
          <div style={{ fontSize: 13, color: '#888', fontFamily: 'sans-serif' }}>Vue globale des reversements partenaires</div>
        </div>

        {/* Filtre + bouton export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 2 }}>
            {PERIODES.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriode(p.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'sans-serif',
                  background: periode === p.value ? C.white : 'transparent',
                  color: periode === p.value ? C.navy : C.muted,
                  boxShadow: periode === p.value ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExporter}
            disabled={exportEnCours}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: exportEnCours ? '#94A3B8' : C.teal,
              color: C.white, border: 'none', borderRadius: 10,
              padding: '8px 18px', fontSize: 13, fontWeight: 700,
              cursor: exportEnCours ? 'not-allowed' : 'pointer',
              fontFamily: 'sans-serif',
            }}
          >
            {exportEnCours ? '⏳ Export...' : '⬇ Exporter .xlsx'}
          </button>
        </div>
      </div>

      {confirmation && (
        <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.green, fontFamily: 'sans-serif' }}>
          ✅ {confirmation}
        </div>
      )}

      {/* Totaux globaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { icon: '💶', label: 'Total encaissé', value: fmt(totaux.total_encaisse) + '€', color: C.dark },
          { icon: '⏳', label: 'En attente de reversement', value: fmt(totaux.total_a_recevoir) + '€', color: C.coral },
          { icon: '✅', label: 'Déjà reçu', value: fmt(totaux.total_recu) + '€', color: C.green },
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
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#666', fontFamily: 'sans-serif' }}>{fmt(p.volume_total)}€</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.teal, fontFamily: 'sans-serif' }}>{fmt(p.total_du)}€</td>
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
