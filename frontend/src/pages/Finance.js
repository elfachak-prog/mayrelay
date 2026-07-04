import { useState, useEffect, useMemo } from 'react';
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

function fmt(n, d = 2) { return parseFloat(n || 0).toFixed(d); }

function debutPeriode(periode) {
  const now = new Date();
  if (periode === 'mois') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (periode === 'trimestre') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (periode === 'annee') return new Date(now.getFullYear(), 0, 1);
  return null;
}

function filtrerTransactions(transactions, periode) {
  const debut = debutPeriode(periode);
  if (!debut) return transactions;
  return transactions.filter(t => new Date(t.created_at) >= debut);
}

function grouperParMois(transactions) {
  const map = {};
  for (const t of transactions) {
    const mois = new Date(t.created_at).toISOString().slice(0, 7);
    if (!map[mois]) map[mois] = { mois, revenus_bruts: 0, part_mayrelay: 0, nb: 0 };
    map[mois].revenus_bruts += parseFloat(t.montant_total || 0);
    map[mois].part_mayrelay += parseFloat(t.part_mayrelay || 0);
    map[mois].nb++;
  }
  return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois)).map(r => ({
    ...r,
    couts_sms_estimes: parseFloat((r.nb * 2 * 0.07).toFixed(2)),
    marge_nette: parseFloat((r.part_mayrelay - r.nb * 2 * 0.07).toFixed(2)),
  }));
}

function grouperParPartenaire(transactions) {
  const map = {};
  for (const t of transactions) {
    const nom = t.partenaire_nom;
    if (!map[nom]) map[nom] = { partenaire: nom, nb_colis: 0, volume_total: 0, gains_partenaire: 0, part_mayrelay: 0 };
    map[nom].nb_colis++;
    map[nom].volume_total += parseFloat(t.montant_total || 0);
    map[nom].gains_partenaire += parseFloat(t.part_partenaire_exp || 0) + parseFloat(t.part_partenaire_rec || 0);
    map[nom].part_mayrelay += parseFloat(t.part_mayrelay || 0);
  }
  return Object.values(map).sort((a, b) => b.gains_partenaire - a.gains_partenaire);
}

function telechargerExcel(transactions, periode) {
  const labelPeriode = PERIODES.find(p => p.value === periode)?.label.replace(/\s/g, '_') || 'tout';
  const dateStr = new Date().toISOString().slice(0, 10);

  const wb = XLSX.utils.book_new();

  // Feuille 1 : Transactions
  const lignesT = [
    ['Référence', 'Date', 'Partenaire', 'Destinataire', 'Type', 'Prix (€)',
     'Part Part. Exp. (€)', 'Part Part. Réc. (€)', 'Part Livreur (€)',
     'Part MayRelay (€)', 'Avec livreur', 'Statut'],
    ...transactions.map(t => [
      t.reference,
      new Date(t.created_at).toLocaleDateString('fr-FR'),
      t.partenaire_nom,
      t.nom_destinataire,
      t.type,
      parseFloat(fmt(t.montant_total)),
      parseFloat(fmt(t.part_partenaire_exp)),
      parseFloat(fmt(t.part_partenaire_rec)),
      parseFloat(fmt(t.part_livreur)),
      parseFloat(fmt(t.part_mayrelay)),
      t.avec_livreur ? 'Oui' : 'Non',
      t.statut,
    ]),
  ];
  const wsT = XLSX.utils.aoa_to_sheet(lignesT);
  wsT['!cols'] = [12, 12, 18, 18, 10, 10, 14, 14, 14, 14, 12, 12].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsT, 'Transactions');

  // Feuille 2 : Résumé mensuel
  const mensuel = grouperParMois(transactions);
  const lignesM = [
    ['Mois', 'Nb transactions', 'Revenus bruts (€)', 'Coûts SMS estimés (€)', 'Marge nette (€)'],
    ...mensuel.map(r => [r.mois, r.nb, parseFloat(fmt(r.revenus_bruts)), r.couts_sms_estimes, r.marge_nette]),
  ];
  const wsM = XLSX.utils.aoa_to_sheet(lignesM);
  wsM['!cols'] = [12, 14, 18, 20, 16].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsM, 'Résumé mensuel');

  // Feuille 3 : Partenaires
  const partenaires = grouperParPartenaire(transactions);
  const lignesP = [
    ['Partenaire', 'Nb colis', 'Volume total (€)', 'Gains partenaire (€)', 'Part MayRelay (€)'],
    ...partenaires.map(p => [p.partenaire, p.nb_colis, parseFloat(fmt(p.volume_total)), parseFloat(fmt(p.gains_partenaire)), parseFloat(fmt(p.part_mayrelay))]),
  ];
  const wsP = XLSX.utils.aoa_to_sheet(lignesP);
  wsP['!cols'] = [22, 10, 16, 18, 16].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsP, 'Partenaires');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MayRelay_Finance_${labelPeriode}_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ModalPreview({ transactions, periode, onClose, onConfirm }) {
  const mensuel = useMemo(() => grouperParMois(transactions), [transactions]);
  const totalRevenusBruts = transactions.reduce((s, t) => s + parseFloat(t.montant_total || 0), 0);
  const totalMayRelay = transactions.reduce((s, t) => s + parseFloat(t.part_mayrelay || 0), 0);
  const apercu = transactions.slice(0, 5);
  const labelPeriode = PERIODES.find(p => p.value === periode)?.label || 'Tout';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(11,31,58,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: C.white, borderRadius: 20, width: '100%', maxWidth: 820,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>Aperçu de l'export</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3, fontFamily: 'sans-serif' }}>
              Période : <strong>{labelPeriode}</strong> · {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted, lineHeight: 1 }}>✕</button>
        </div>

        {/* Contenu scrollable */}
        <div style={{ overflow: 'auto', flex: 1, padding: '20px 28px' }}>

          {/* Stats rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Transactions', value: transactions.length },
              { label: 'Revenus bruts', value: fmt(totalRevenusBruts) + ' €' },
              { label: 'Part MayRelay', value: fmt(totalMayRelay) + ' €' },
            ].map(s => (
              <div key={s.label} style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 18px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3, fontFamily: 'sans-serif' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feuilles incluses */}
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif', marginBottom: 10 }}>Feuilles incluses dans le fichier</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
            {[
              { nom: 'Transactions', desc: `${transactions.length} lignes` },
              { nom: 'Résumé mensuel', desc: `${mensuel.length} mois` },
              { nom: 'Partenaires', desc: `${grouperParPartenaire(transactions).length} partenaires` },
            ].map(f => (
              <div key={f.nom} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontFamily: 'sans-serif' }}>
                <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{f.nom}</span>
                <span style={{ color: '#6B7280', marginLeft: 6 }}>{f.desc}</span>
              </div>
            ))}
          </div>

          {/* Aperçu des premières lignes */}
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif', marginBottom: 10 }}>
            Aperçu — premières transactions
          </div>
          {apercu.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: C.muted, fontSize: 13, fontFamily: 'sans-serif' }}>
              Aucune transaction pour cette période
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'sans-serif' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Référence', 'Date', 'Partenaire', 'Destinataire', 'Type', 'Prix', 'Part MayRelay', 'Statut'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', color: C.muted, textAlign: 'left', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apercu.map((t, i) => (
                    <tr key={t.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: C.navy, whiteSpace: 'nowrap' }}>{t.reference}</td>
                      <td style={{ padding: '8px 12px', color: '#666', whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '8px 12px', color: '#444', whiteSpace: 'nowrap' }}>{t.partenaire_nom}</td>
                      <td style={{ padding: '8px 12px', color: '#444', whiteSpace: 'nowrap' }}>{t.nom_destinataire}</td>
                      <td style={{ padding: '8px 12px', color: '#666' }}>{t.type}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: C.dark, whiteSpace: 'nowrap' }}>{fmt(t.montant_total)} €</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: C.teal, whiteSpace: 'nowrap' }}>{fmt(t.part_mayrelay)} €</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600,
                          background: t.statut === 'reverse' ? '#D1FAE5' : '#FEF3C7',
                          color: t.statut === 'reverse' ? C.green : C.amber }}>
                          {t.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length > 5 && (
                <div style={{ padding: '10px 16px', fontSize: 11, color: C.muted, fontFamily: 'sans-serif', borderTop: `1px solid ${C.border}` }}>
                  … et {transactions.length - 5} transaction{transactions.length - 5 > 1 ? 's' : ''} supplémentaire{transactions.length - 5 > 1 ? 's' : ''} dans le fichier
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#FAFBFC' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.dark, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>
            Annuler
          </button>
          <button onClick={onConfirm} disabled={transactions.length === 0}
            style={{ padding: '9px 22px', borderRadius: 10, border: 'none',
              background: transactions.length === 0 ? C.muted : C.teal,
              color: C.white, fontSize: 13, fontWeight: 700, cursor: transactions.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
            ⬇ Télécharger ({transactions.length} lignes)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Finance() {
  const [data, setData] = useState(null);
  const [toutesTransactions, setToutesTransactions] = useState([]);
  const [confirmation, setConfirmation] = useState('');
  const [chargement, setChargement] = useState(null);
  const [periode, setPeriode] = useState('tout');
  const [modalOuverte, setModalOuverte] = useState(false);

  useEffect(() => {
    charger();
    chargerTransactions();
  }, []);

  const charger = async () => {
    try {
      const res = await API.get('/admin/finance');
      setData(res.data);
    } catch (err) { console.error(err); }
  };

  const chargerTransactions = async () => {
    try {
      const res = await API.get('/paiements/admin/tous');
      setToutesTransactions(res.data.paiements || []);
    } catch (err) { console.error(err); }
  };

  const transactionsFiltrees = useMemo(
    () => filtrerTransactions(toutesTransactions, periode),
    [toutesTransactions, periode]
  );

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

  const handleTelecharger = () => {
    telechargerExcel(transactionsFiltrees, periode);
    setModalOuverte(false);
  };

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: 'sans-serif' }}>Chargement...</div>;

  const { totaux, par_partenaire } = data;

  return (
    <div>
      {modalOuverte && (
        <ModalPreview
          transactions={transactionsFiltrees}
          periode={periode}
          onClose={() => setModalOuverte(false)}
          onConfirm={handleTelecharger}
        />
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Suivi financier</h2>
          <div style={{ fontSize: 13, color: '#888', fontFamily: 'sans-serif' }}>Vue globale des reversements partenaires</div>
        </div>

        {/* Filtre période + bouton export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 2 }}>
            {PERIODES.map(p => (
              <button key={p.value} onClick={() => setPeriode(p.value)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif',
                  background: periode === p.value ? C.white : 'transparent',
                  color: periode === p.value ? C.navy : C.muted,
                  boxShadow: periode === p.value ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s',
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => setModalOuverte(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.teal, color: C.white, border: 'none', borderRadius: 10,
              padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif',
            }}>
            ⬇ Exporter .xlsx
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
