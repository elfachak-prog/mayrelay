import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const C = {
  bg: "#F0F2F5", white: "#FFFFFF", navy: "#0B1F3A",
  teal: "#0E9F8E", amber: "#F59E0B", red: "#EF4444",
  green: "#10B981", blue: "#3B82F6", muted: "#94A3B8",
  text: "#1E293B", border: "#E2E8F0",
};

const statut_twilio = {
  delivered: { label: 'Livré',    color: C.green,  bg: '#D1FAE5' },
  sent:      { label: 'Envoyé',   color: C.blue,   bg: '#DBEAFE' },
  queued:    { label: 'En file',  color: C.amber,  bg: '#FEF3C7' },
  failed:    { label: 'Échec',    color: C.red,    bg: '#FEE2E2' },
  undelivered:{ label: 'Non livré', color: C.red,  bg: '#FEE2E2' },
};

const StatTag = ({ s }) => {
  const cfg = statut_twilio[s] || { label: s, color: C.muted, bg: '#F1F5F9' };
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontFamily: 'sans-serif' }}>{cfg.label}</span>;
};

export default function GestionSMS() {
  const [statut, setStatut] = useState(null);
  const [logs, setLogs] = useState({ twilio: [], local: [] });
  const [templates, setTemplates] = useState([]);
  const [ongletLogs, setOngletLogs] = useState('twilio');
  const [toggling, setToggling] = useState(false);
  const [rafraichissantSolde, setRafraichissantSolde] = useState(false);
  const [editTemplates, setEditTemplates] = useState({});
  const [sauvegardes, setSauvegardes] = useState({});
  const [errSauvegardes, setErrSauvegardes] = useState({});

  const charger = useCallback(async () => {
    try {
      const [sRes, lRes, tRes] = await Promise.all([
        API.get('/admin/sms/statut'),
        API.get('/admin/sms/logs'),
        API.get('/admin/sms/templates'),
      ]);
      setStatut(sRes.data);
      setLogs(lRes.data);
      setTemplates(tRes.data.templates);
      const edits = {};
      tRes.data.templates.forEach(t => { edits[t.cle] = t.contenu; });
      setEditTemplates(edits);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await API.post('/admin/sms/toggle');
      setStatut(prev => ({ ...prev, notifications_actives: res.data.notifications_actives }));
    } catch (err) { console.error(err); }
    setToggling(false);
  };

  const rafraichirSolde = async () => {
    setRafraichissantSolde(true);
    try {
      const res = await API.get('/admin/sms/solde');
      setStatut(prev => ({ ...prev, solde: res.data.solde, devise: res.data.devise, solde_eur: res.data.solde_eur, taux_eur: res.data.taux_eur }));
    } catch (err) { console.error(err); }
    setRafraichissantSolde(false);
  };

  const sauvegarderTemplate = async (cle) => {
    setSauvegardes(p => ({ ...p, [cle]: false }));
    setErrSauvegardes(p => ({ ...p, [cle]: null }));
    try {
      await API.put(`/admin/sms/templates/${cle}`, { contenu: editTemplates[cle] });
      setSauvegardes(p => ({ ...p, [cle]: true }));
      setTimeout(() => setSauvegardes(p => ({ ...p, [cle]: false })), 2500);
    } catch (err) {
      setErrSauvegardes(p => ({ ...p, [cle]: err.response?.data?.message || 'Erreur' }));
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.navy, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', background: '#FAFBFC', resize: 'vertical', minHeight: 80 };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: '0 0 4px' }}>Gestion SMS Twilio</h2>
        <div style={{ fontSize: 13, color: '#888', fontFamily: 'sans-serif' }}>Notifications, historique et templates de messages</div>
      </div>

      {/* ── Ligne 1 : Toggle + Solde ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>

        {/* Toggle notifications */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px 22px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600, marginBottom: 14 }}>Notifications SMS</div>
          {statut ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div
                  onClick={!toggling ? handleToggle : undefined}
                  style={{
                    width: 52, height: 28, borderRadius: 14, cursor: toggling ? 'not-allowed' : 'pointer',
                    background: statut.notifications_actives ? C.green : '#CBD5E1',
                    position: 'relative', transition: 'background 0.25s', flexShrink: 0
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: statut.notifications_actives ? 26 : 3,
                    width: 22, height: 22, borderRadius: '50%', background: C.white,
                    transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: statut.notifications_actives ? C.green : C.muted, fontFamily: 'sans-serif' }}>
                    {statut.notifications_actives ? '● Activées' : '○ Désactivées'}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif' }}>Cliquer pour {statut.notifications_actives ? 'désactiver' : 'activer'}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', background: '#F8FAFC', borderRadius: 8, padding: '6px 10px' }}>
                📱 {statut.twilio_phone || 'Numéro non configuré'}
              </div>
            </>
          ) : <div style={{ color: C.muted, fontSize: 13, fontFamily: 'sans-serif' }}>Chargement…</div>}
        </div>

        {/* Solde Twilio */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px 22px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>Solde Twilio</div>
            <button onClick={rafraichirSolde} disabled={rafraichissantSolde} style={{ fontSize: 11, color: C.teal, background: 'transparent', border: 'none', cursor: rafraichissantSolde ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif', padding: 0 }}>
              {rafraichissantSolde ? '…' : '↻ Actualiser'}
            </button>
          </div>
          {statut ? (
            statut.solde !== null ? (
              <>
                <div style={{ fontSize: 32, fontWeight: 700, color: (statut.solde_eur ?? statut.solde) < 1 ? C.red : C.navy, fontFamily: 'Georgia, serif', marginBottom: 2 }}>
                  {statut.solde_eur !== null && statut.solde_eur !== undefined
                    ? statut.solde_eur.toFixed(2)
                    : statut.solde?.toFixed(2)
                  } <span style={{ fontSize: 14, color: C.muted }}>€</span>
                </div>
                {statut.taux_eur !== null && statut.taux_eur !== undefined && (
                  <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', marginBottom: 4 }}>
                    1 {statut.devise} = {statut.taux_eur.toFixed(4)} €
                  </div>
                )}
                {(statut.solde_eur ?? statut.solde) < 1 && <div style={{ fontSize: 11, color: C.red, fontFamily: 'sans-serif' }}>⚠ Solde faible — rechargez votre compte</div>}
              </>
            ) : <div style={{ fontSize: 13, color: C.muted, fontFamily: 'sans-serif' }}>Non disponible<br/><span style={{ fontSize: 11 }}>(vérifiez les credentials)</span></div>
          ) : <div style={{ color: C.muted, fontSize: 13, fontFamily: 'sans-serif' }}>Chargement…</div>}
        </div>

        {/* Stats SMS locaux */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px 22px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600, marginBottom: 14 }}>SMS enregistrés</div>
          {statut?.stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Total', value: statut.stats.total, color: C.navy },
                { label: 'Envoyés', value: statut.stats.envoyes, color: C.green },
                { label: 'Erreurs', value: statut.stats.erreurs, color: statut.stats.erreurs > 0 ? C.red : C.muted },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 10, padding: '10px 6px' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: C.muted, fontSize: 13, fontFamily: 'sans-serif' }}>Chargement…</div>}
        </div>
      </div>

      {/* ── Logs SMS ────────────────────────────────────────────── */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 12 }}>Historique des SMS</div>
          </div>
          {[['twilio', '📡 Via Twilio'], ['local', '🗄️ Base locale']].map(([k, l]) => (
            <div
              key={k}
              onClick={() => setOngletLogs(k)}
              style={{ padding: '10px 18px', fontSize: 12, fontWeight: ongletLogs === k ? 700 : 400, color: ongletLogs === k ? C.teal : C.muted, cursor: 'pointer', borderBottom: ongletLogs === k ? `2px solid ${C.teal}` : '2px solid transparent', fontFamily: 'sans-serif', marginBottom: -1 }}
            >{l}</div>
          ))}
        </div>

        {ongletLogs === 'twilio' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Date', 'Destinataire', 'Message', 'Statut', 'Coût'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.twilio.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: 'sans-serif', fontSize: 13 }}>
                    {statut?.solde === null ? '⚠ Credentials Twilio non configurés' : 'Aucun SMS dans l\'historique Twilio'}
                  </td></tr>
                ) : logs.twilio.map((m, i) => (
                  <tr key={m.sid} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                    <td style={{ padding: '11px 18px', fontSize: 11, color: C.muted, fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                      {m.date ? new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '11px 18px', fontSize: 12, fontFamily: 'monospace', color: C.navy }}>{m.telephone}</td>
                    <td style={{ padding: '11px 18px', fontSize: 12, color: '#555', fontFamily: 'sans-serif', maxWidth: 320 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.corps}>{m.corps}</div>
                    </td>
                    <td style={{ padding: '11px 18px' }}><StatTag s={m.statut} /></td>
                    <td style={{ padding: '11px 18px', fontSize: 12, fontFamily: 'monospace', color: m.cout_eur !== null ? '#555' : C.muted }}>
                      {m.cout_eur !== null && m.cout_eur !== undefined
                        ? `${m.cout_eur.toFixed(4)} €`
                        : m.cout ? `${m.cout} ${m.devise_cout ?? ''}`.trim() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ongletLogs === 'local' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Date', 'Référence', 'Destinataire', 'Message', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.local.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: 'sans-serif', fontSize: 13 }}>Aucun SMS enregistré localement</td></tr>
                ) : logs.local.map((m, i) => (
                  <tr key={m.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                    <td style={{ padding: '11px 18px', fontSize: 11, color: C.muted, fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                      {new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '11px 18px', fontSize: 12, fontFamily: 'monospace', color: C.teal }}>{m.reference || '—'}</td>
                    <td style={{ padding: '11px 18px', fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: 'sans-serif' }}>{m.nom_destinataire || m.telephone}</td>
                    <td style={{ padding: '11px 18px', fontSize: 12, color: '#555', fontFamily: 'sans-serif', maxWidth: 320 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.message}>{m.message}</div>
                    </td>
                    <td style={{ padding: '11px 18px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: m.statut === 'envoye' ? '#D1FAE5' : '#FEE2E2', color: m.statut === 'envoye' ? C.green : C.red, fontFamily: 'sans-serif' }}>
                        {m.statut === 'envoye' ? 'Envoyé' : m.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Templates de messages ───────────────────────────────── */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 4 }}>Templates de messages</div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 16 }}>
          Personnalisez les textes envoyés automatiquement. Les variables entre {'{}'} sont remplacées dynamiquement.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {templates.map(t => {
            const sauvegarde = sauvegardes[t.cle];
            const erreur = errSauvegardes[t.cle];
            const modifie = editTemplates[t.cle] !== t.contenu;
            return (
              <div key={t.cle} style={{ background: C.white, borderRadius: 16, padding: '20px 22px', border: `1px solid ${modifie ? C.amber + '88' : C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif' }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>{t.cle}</div>
                  </div>
                  {modifie && <span style={{ fontSize: 10, color: C.amber, fontFamily: 'sans-serif', fontWeight: 700 }}>● modifié</span>}
                </div>

                <textarea
                  value={editTemplates[t.cle] ?? t.contenu}
                  onChange={e => setEditTemplates(p => ({ ...p, [t.cle]: e.target.value }))}
                  style={inputStyle}
                  rows={3}
                />

                {t.variables && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8, marginBottom: 10 }}>
                    {t.variables.split(',').map(v => v.trim()).map(v => (
                      <span
                        key={v}
                        title={`Cliquer pour insérer {${v}}`}
                        onClick={() => setEditTemplates(p => ({ ...p, [t.cle]: (p[t.cle] ?? t.contenu) + `{${v}}` }))}
                        style={{ fontSize: 10, fontFamily: 'monospace', background: '#EFF6FF', color: C.blue, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', border: `1px solid #BFDBFE` }}
                      >{`{${v}}`}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={() => sauvegarderTemplate(t.cle)}
                    disabled={!modifie}
                    style={{ padding: '8px 18px', background: modifie ? C.teal : '#E2E8F0', color: modifie ? C.white : C.muted, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: modifie ? 'pointer' : 'not-allowed', fontFamily: 'sans-serif', transition: 'all 0.2s' }}
                  >Sauvegarder</button>
                  {modifie && (
                    <button
                      onClick={() => setEditTemplates(p => ({ ...p, [t.cle]: t.contenu }))}
                      style={{ padding: '8px 12px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'sans-serif' }}
                    >Annuler</button>
                  )}
                  {sauvegarde && <span style={{ fontSize: 11, color: C.green, fontFamily: 'sans-serif' }}>✓ Sauvegardé</span>}
                  {erreur && <span style={{ fontSize: 11, color: C.red, fontFamily: 'sans-serif' }}>{erreur}</span>}
                </div>

                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'sans-serif', marginTop: 8 }}>
                  Mis à jour : {new Date(t.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
