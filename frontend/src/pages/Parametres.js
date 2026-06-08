import { useState, useEffect } from 'react';
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

export default function Parametres() {
  const [params, setParams] = useState(null);

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const res = await API.get('/parametres');
      setParams(res.data.parametres);
    } catch (err) { console.error(err); }
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
        <TextAreaRow label="Message envoyé au destinataire" description="Ce message est envoyé par SMS quand le colis arrive au point relais" value={params.sms_message} onSave={v => sauvegarder('sms_message', v)} />
      </Section>

      <Section title="Quartiers" icon="📍">
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontFamily: 'sans-serif' }}>Séparez les quartiers par des virgules</div>
        <TextAreaRow label="Liste des quartiers disponibles" description="Ces quartiers apparaissent dans le formulaire d'envoi" value={params.quartiers} onSave={v => sauvegarder('quartiers', v)} />
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {params.quartiers.split(',').map(q => (
            <span key={q} style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, padding: '4px 10px', borderRadius: 20, fontFamily: 'sans-serif' }}>{q.trim()}</span>
          ))}
        </div>
      </Section>
    </div>
  );
}
