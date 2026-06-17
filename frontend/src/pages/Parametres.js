import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';

const C = {
  navy: "#0B1F3A", teal: "#0E9F8E", white: "#FFFFFF",
  border: "#E2E8F0", dark: "#1E293B", muted: "#94A3B8",
  green: "#10B981", red: "#EF4444", amber: "#F59E0B",
};

function Section({ title, icon, children }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>{title}</span>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

function ParamRow({ label, description, value, onSave }) {
  const [val, setVal] = useState(value);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, fontFamily: 'sans-serif' }}>{label}</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif', marginTop: 2 }}>{description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {editing ? (
          <>
            <input value={val} onChange={e => setVal(e.target.value)}
              style={{ padding: '8px 12px', border: `1.5px solid ${C.teal}`, borderRadius: 8, fontSize: 13, color: C.dark, outline: 'none', width: 160, fontFamily: 'sans-serif' }} />
            <button onClick={handleSave} disabled={saving} style={{ background: C.teal, color: C.white, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
              {saving ? '...' : 'Sauvegarder'}
            </button>
            <button onClick={() => { setEditing(false); setVal(value); }} style={{ background: '#F0F3F5', color: '#666', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'sans-serif' }}>
              Annuler
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: saved ? C.green : C.navy, fontFamily: 'sans-serif', minWidth: 80, textAlign: 'right' }}>
              {saved ? '✅ Sauvé' : val}
            </span>
            <button onClick={() => setEditing(true)} style={{ background: '#F0F3F5', color: '#666', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'sans-serif' }}>
              Modifier
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TextAreaRow({ label, description, value, onSave }) {
  const [val, setVal] = useState(value);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, fontFamily: 'sans-serif' }}>{label}</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif', marginTop: 2 }}>{description}</div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ background: '#F0F3F5', color: '#666', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'sans-serif' }}>
            Modifier
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea value={val} onChange={e => setVal(e.target.value)} rows={4}
            style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.teal}`, borderRadius: 8, fontSize: 13, color: C.dark, outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ background: C.teal, color: C.white, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
              {saving ? '...' : 'Sauvegarder'}
            </button>
            <button onClick={() => { setEditing(false); setVal(value); }} style={{ background: '#F0F3F5', color: '#666', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'sans-serif' }}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: saved ? C.green : C.dark, fontFamily: 'sans-serif', background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
          {saved ? '✅ Sauvegardé' : val}
        </div>
      )}
    </div>
  );
}

export default function Parametres({ onLogoChange }) {
  const [params, setParams] = useState(null);
  const [logoMode, setLogoMode] = useState('url');
  const [logoInput, setLogoInput] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const logoInitialise = useRef(false);
  const [smsStatut, setSmsStatut] = useState(null);
  const [smsLogs, setSmsLogs] = useState([]);
  const [toggling, setToggling] = useState(false);
  const [rafraichissant, setRafraichissant] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState(null);
  const [confirmerPurge, setConfirmerPurge] = useState(false);

  const charger = async () => {
    try {
      const res = await API.get('/parametres');
      setParams(res.data.parametres);
    } catch (err) { console.error(err); }
  };

  const chargerSms = useCallback(async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        API.get('/admin/sms/statut'),
        API.get('/admin/sms/logs'),
      ]);
      setSmsStatut(sRes.data);
      setSmsLogs(lRes.data.twilio || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { charger(); chargerSms(); }, [chargerSms]);

  useEffect(() => {
    if (params && !logoInitialise.current) {
      logoInitialise.current = true;
      const logo = params.logo_url || '';
      setLogoInput(logo);
      setLogoPreview(logo);
    }
  }, [params]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await API.post('/admin/sms/toggle');
      setSmsStatut(prev => ({ ...prev, notifications_actives: res.data.notifications_actives }));
    } catch (err) { console.error(err); }
    setToggling(false);
  };

  const rafraichirSolde = async () => {
    setRafraichissant(true);
    try {
      const res = await API.get('/admin/sms/solde');
      setSmsStatut(prev => ({ ...prev, solde: res.data.solde, devise: res.data.devise, solde_eur: res.data.solde_eur, taux_eur: res.data.taux_eur }));
    } catch (err) { console.error(err); }
    setRafraichissant(false);
  };

  const purgerColisTest = async () => {
    setPurging(true);
    setPurgeResult(null);
    try {
      const res = await API.delete('/admin/colis/purge-test');
      setPurgeResult({ ok: true, message: res.data.message });
    } catch (err) {
      setPurgeResult({ ok: false, message: err.response?.data?.message || 'Erreur serveur' });
    }
    setPurging(false);
    setConfirmerPurge(false);
  };

  const handleLogoUrl = (e) => {
    setLogoInput(e.target.value);
    setLogoPreview(e.target.value);
  };

  const handleLogoFichier = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      setLogoInput(data);
      setLogoPreview(data);
    };
    reader.readAsDataURL(file);
  };

  const sauvegarderLogo = async () => {
    setLogoSaving(true);
    await sauvegarder('logo_url', logoInput);
    if (onLogoChange) onLogoChange(logoInput);
    setLogoSaved(true);
    setTimeout(() => setLogoSaved(false), 3000);
    setLogoSaving(false);
  };

  const supprimerLogo = async () => {
    setLogoSaving(true);
    await sauvegarder('logo_url', '');
    setLogoInput('');
    setLogoPreview('');
    if (onLogoChange) onLogoChange('');
    setLogoSaving(false);
  };

  const sauvegarder = async (cle, valeur) => {
    try {
      await API.put(`/parametres/${cle}`, { valeur });
      setParams(prev => ({ ...prev, [cle]: valeur }));
    } catch (err) { console.error(err); }
  };

  if (!params) return <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: 'sans-serif' }}>Chargement...</div>;

  const totalCommissions = parseInt(params.commission_partenaire_exp) + parseInt(params.commission_partenaire_rec) + parseInt(params.commission_livreur) + parseInt(params.commission_mayrelay);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Paramètres</h2>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24, fontFamily: 'sans-serif' }}>Configurez votre plateforme sans toucher au code</div>

      <Section title="Image de marque" icon="🎨">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Formulaire */}
          <div style={{ flex: 1, minWidth: 240 }}>
            {/* Onglets mode */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[{ key: 'url', label: 'URL externe' }, { key: 'fichier', label: 'Fichier (base64)' }].map(m => (
                <button key={m.key} onClick={() => setLogoMode(m.key)}
                  style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${logoMode === m.key ? C.teal : C.border}`, background: logoMode === m.key ? C.teal : '#F8FAFC', color: logoMode === m.key ? C.white : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                  {m.label}
                </button>
              ))}
            </div>

            {logoMode === 'url' ? (
              <div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 8 }}>Entrez l'URL de votre logo (PNG, SVG, JPG…)</div>
                <input
                  type="text"
                  value={logoInput}
                  onChange={handleLogoUrl}
                  placeholder="https://example.com/logo.png"
                  style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.teal}`, borderRadius: 8, fontSize: 13, color: C.dark, outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                />
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 8 }}>Choisissez une image depuis votre appareil (max ~2 Mo recommandé)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFichier}
                  style={{ fontSize: 13, fontFamily: 'sans-serif', color: C.dark }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={sauvegarderLogo} disabled={logoSaving || !logoInput}
                style={{ background: logoSaved ? C.green : C.teal, color: C.white, border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: (logoSaving || !logoInput) ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif', opacity: !logoInput ? 0.5 : 1 }}>
                {logoSaving ? '…' : logoSaved ? '✅ Sauvegardé' : 'Sauvegarder le logo'}
              </button>
              {logoPreview && (
                <button onClick={supprimerLogo} disabled={logoSaving}
                  style={{ background: '#FEF2F2', color: C.red, border: `1px solid #FECACA`, borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: logoSaving ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Prévisualisation */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', marginBottom: 8 }}>Prévisualisation dans le header</div>
            <div style={{ background: '#0B1F3A', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 220, minHeight: 72 }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo prévisualisation" style={{ maxHeight: 40, maxWidth: 150, objectFit: 'contain', display: 'block' }} onError={() => setLogoPreview('')} />
              ) : (
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>🏝️ MayRelay</div>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'sans-serif', marginTop: 6 }}>Affiché dans admin, partenaire & livreur</div>
          </div>
        </div>
      </Section>

      <Section title="Tarifs" icon="💶">
        <ParamRow label="Prix courrier" description="Tarif pour un envoi courrier / lettre" value={params.prix_courrier + ' €'} onSave={v => sauvegarder('prix_courrier', v.replace('€','').trim())} />
        <ParamRow label="Prix colis" description="Tarif pour un envoi colis (jusqu'à 5kg)" value={params.prix_colis + ' €'} onSave={v => sauvegarder('prix_colis', v.replace('€','').trim())} />
      </Section>

      <Section title="Commissions" icon="📊">
        {totalCommissions !== 100 && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400E', fontFamily: 'sans-serif' }}>
            ⚠️ Total des commissions : {totalCommissions}% — doit être égal à 100%
          </div>
        )}
        {totalCommissions === 100 && (
          <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: C.green, fontFamily: 'sans-serif' }}>
            ✅ Total des commissions : 100% — équilibré
          </div>
        )}
        <ParamRow label="Part partenaire expéditeur" description="% du prix reversé au point relais qui envoie" value={params.commission_partenaire_exp + '%'} onSave={v => sauvegarder('commission_partenaire_exp', v.replace('%','').trim())} />
        <ParamRow label="Part partenaire récepteur" description="% du prix reversé au point relais qui reçoit" value={params.commission_partenaire_rec + '%'} onSave={v => sauvegarder('commission_partenaire_rec', v.replace('%','').trim())} />
        <ParamRow label="Part livreur" description="% du prix reversé au livreur" value={params.commission_livreur + '%'} onSave={v => sauvegarder('commission_livreur', v.replace('%','').trim())} />
        <ParamRow label="Part MayRelay" description="% conservé par la plateforme" value={params.commission_mayrelay + '%'} onSave={v => sauvegarder('commission_mayrelay', v.replace('%','').trim())} />
      </Section>

      <Section title="Message SMS" icon="📱">
        <div style={{ background: '#F0F9FF', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#0369A1', fontFamily: 'sans-serif' }}>
          Variables disponibles : <strong>{'{nom}'}</strong> <strong>{'{type}'}</strong> <strong>{'{quartier}'}</strong> <strong>{'{reference}'}</strong>
        </div>
        <TextAreaRow label="Message envoyé au destinataire" description="Ce message est envoyé par SMS quand le colis arrive au point relais" value={params.sms_message || ''} onSave={v => sauvegarder('sms_message', v)} />
      </Section>

      <Section title="Quartiers" icon="📍">
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontFamily: 'sans-serif' }}>Séparez les quartiers par des virgules</div>
        <TextAreaRow label="Liste des quartiers disponibles" description="Ces quartiers apparaissent dans le formulaire d'envoi" value={params.quartiers || ''} onSave={v => sauvegarder('quartiers', v)} />
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(params.quartiers || '').split(',').filter(q => q.trim()).map(q => (
            <span key={q} style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, padding: '4px 10px', borderRadius: 20, fontFamily: 'sans-serif' }}>{q.trim()}</span>
          ))}
        </div>
      </Section>

      <Section title="Twilio & Notifications SMS" icon="📡">
        {/* Ligne : Toggle + Solde + Purge */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>

          {/* Toggle */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'sans-serif', fontWeight: 600, marginBottom: 12 }}>Notifications SMS</div>
            {smsStatut ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  onClick={!toggling ? handleToggle : undefined}
                  style={{ width: 48, height: 26, borderRadius: 13, cursor: toggling ? 'not-allowed' : 'pointer', background: smsStatut.notifications_actives ? C.green : '#CBD5E1', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: 3, left: smsStatut.notifications_actives ? 24 : 3, width: 20, height: 20, borderRadius: '50%', background: C.white, transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: smsStatut.notifications_actives ? C.green : C.muted, fontFamily: 'sans-serif' }}>
                  {smsStatut.notifications_actives ? 'Activées' : 'Désactivées'}
                </div>
              </div>
            ) : <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>Chargement…</div>}
          </div>

          {/* Solde */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'sans-serif', fontWeight: 600 }}>Solde Twilio</div>
              <button onClick={rafraichirSolde} disabled={rafraichissant} style={{ fontSize: 11, color: C.teal, background: 'transparent', border: 'none', cursor: rafraichissant ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif', padding: 0 }}>
                {rafraichissant ? '…' : '↻'}
              </button>
            </div>
            {smsStatut ? (
              smsStatut.solde !== null ? (
                <>
                  <div style={{ fontSize: 26, fontWeight: 700, color: (smsStatut.solde_eur ?? smsStatut.solde) < 1 ? C.red : C.navy, fontFamily: 'Georgia, serif', marginBottom: 2 }}>
                    {smsStatut.solde_eur !== null && smsStatut.solde_eur !== undefined
                      ? smsStatut.solde_eur.toFixed(2)
                      : smsStatut.solde?.toFixed(2)
                    } <span style={{ fontSize: 12, color: C.muted }}>€</span>
                  </div>
                  {smsStatut.taux_eur !== null && smsStatut.taux_eur !== undefined && (
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
                      1 {smsStatut.devise} = {smsStatut.taux_eur.toFixed(4)} €
                    </div>
                  )}
                </>
              ) : <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>Non disponible</div>
            ) : <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>Chargement…</div>}
          </div>

          {/* Purge colis de test */}
          <div style={{ background: '#FFF8F8', borderRadius: 12, padding: '16px 18px', border: `1px solid #FEE2E2` }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'sans-serif', fontWeight: 600, marginBottom: 12 }}>Données de test</div>
            {purgeResult && (
              <div style={{ fontSize: 11, color: purgeResult.ok ? C.green : C.red, fontFamily: 'sans-serif', marginBottom: 10, fontWeight: 600 }}>
                {purgeResult.ok ? '✅' : '❌'} {purgeResult.message}
              </div>
            )}
            {confirmerPurge ? (
              <div>
                <div style={{ fontSize: 11, color: C.red, fontFamily: 'sans-serif', marginBottom: 8 }}>Confirmer la suppression ?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={purgerColisTest} disabled={purging} style={{ background: C.red, color: C.white, border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: purging ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
                    {purging ? '…' : 'Confirmer'}
                  </button>
                  <button onClick={() => setConfirmerPurge(false)} style={{ background: '#F0F3F5', color: '#666', border: 'none', borderRadius: 8, padding: '7px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setPurgeResult(null); setConfirmerPurge(true); }} style={{ background: C.red, color: C.white, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                🗑 Supprimer colis de test
              </button>
            )}
          </div>
        </div>

        {/* Historique SMS */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, fontFamily: 'sans-serif', marginBottom: 10 }}>Derniers SMS envoyés</div>
        {smsLogs.length === 0 ? (
          <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif', padding: '16px 0', textAlign: 'center' }}>
            {smsStatut?.solde === null ? '⚠ Credentials Twilio non configurés' : 'Aucun SMS dans l\'historique'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr>
                  {['Date', 'Destinataire', 'Statut', 'Coût'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 10, color: C.muted, textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 600, background: '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {smsLogs.slice(0, 15).map((m, i) => {
                  const statutCfg = { delivered: { label: 'Livré', color: C.green }, sent: { label: 'Envoyé', color: '#3B82F6' }, failed: { label: 'Échec', color: C.red }, undelivered: { label: 'Non livré', color: C.red }, queued: { label: 'En file', color: C.amber } }[m.statut] || { label: m.statut, color: C.muted };
                  return (
                    <tr key={m.sid} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#FAFBFC' }}>
                      <td style={{ padding: '9px 12px', fontSize: 11, color: C.muted, fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                        {m.date ? new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: 'monospace', color: C.dark }}>{m.telephone}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: statutCfg.color, fontFamily: 'sans-serif' }}>{statutCfg.label}</span>
                      </td>
                      <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'monospace', color: m.cout ? C.dark : C.muted }}>
                        {m.cout ? `${m.cout} ${m.devise_cout}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
