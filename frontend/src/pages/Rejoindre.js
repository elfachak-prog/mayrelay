import { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://mayrelay-production.up.railway.app/api';

const C = {
  navy: '#0B1F3A', teal: '#0E9F8E', red: '#EF4444',
  muted: '#94A3B8', border: '#E2E8F0', white: '#FFFFFF',
  bg: '#F0F2F5', text: '#1E293B', green: '#10B981',
};

const inputStyle = {
  width: '100%', padding: '11px 14px', border: `1.5px solid ${C.border}`,
  borderRadius: 10, fontSize: 14, color: C.text, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'sans-serif', background: '#FAFBFC', marginTop: 4,
};

const zones = [
  'Mamoudzou Centre', 'Kaweni', 'Bandraboua', 'Koungou',
  'Pamandzi', 'Dzaoudzi', 'Labattoir', 'Labattoir Centre',
  'Boueni', 'Chiconi', 'Sada', 'Tsingoni',
];

const typesCommerce = [
  'Épicerie / Alimentation', 'Pharmacie', 'Tabac / Presse', 'Téléphonie / High-tech',
  'Vêtements / Mode', 'Coiffure / Beauté', 'Quincaillerie', 'Restaurant / Snack',
  'Cyber / Impression', 'Autre',
];

const vehicules = ['Vélo', 'Scooter / Moto', 'Voiture', 'Utilitaire / Camionnette'];

function Champ({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 700 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return <input style={inputStyle} {...props} />;
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select style={{ ...inputStyle, appearance: 'none' }} value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function Rejoindre() {
  const [etape, setEtape] = useState('choix'); // 'choix' | 'formulaire' | 'succes'
  const [role, setRole] = useState('');
  const [form, setForm] = useState({
    nom_commerce: '', adresse: '', quartier: '', telephone: '', email: '',
    type_commerce: '', capacite_stockage: '',
    nom: '', zone_couverture: '', type_vehicule: '',
  });
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const choisirRole = (r) => { setRole(r); setEtape('formulaire'); };

  const valider = async () => {
    setErreur('');
    if (!form.telephone) { setErreur('Le téléphone est obligatoire'); return; }
    if (role === 'partenaire' && !form.nom_commerce) { setErreur('Le nom du commerce est obligatoire'); return; }
    if (role === 'livreur' && !form.nom) { setErreur('Le nom complet est obligatoire'); return; }

    setEnvoi(true);
    try {
      await axios.post(`${API_URL}/inscription`, { role, ...form });
      setEtape('succes');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de l\'envoi. Réessayez.');
    }
    setEnvoi(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>🏝️ MayRelay</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Rejoindre le réseau</div>
      </div>

      {/* Étape : choix du rôle */}
      {etape === 'choix' && (
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', textAlign: 'center', marginBottom: 8 }}>Je veux rejoindre MayRelay</div>
          <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 28 }}>Choisissez votre rôle pour continuer</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button onClick={() => choisirRole('partenaire')} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '28px 20px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = C.teal}
              onMouseOut={e => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏪</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Point relais</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Votre commerce devient un point de dépôt et de retrait de colis</div>
            </button>
            <button onClick={() => choisirRole('livreur')} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '28px 20px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = C.teal}
              onMouseOut={e => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🛵</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Livreur</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Effectuez des livraisons entre les points relais et gagnez de l'argent</div>
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href="/" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>← Retour à la connexion</a>
          </div>
        </div>
      )}

      {/* Étape : formulaire */}
      {etape === 'formulaire' && (
        <div style={{ width: '100%', maxWidth: 500, background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, padding: '32px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <button onClick={() => setEtape('choix')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 18, padding: 0 }}>←</button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>
                {role === 'partenaire' ? '🏪 Devenir point relais' : '🛵 Devenir livreur'}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Votre demande sera examinée sous 48h</div>
            </div>
          </div>

          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
            {role === 'partenaire' && (
              <>
                <Champ label="Nom du commerce *">
                  <Input value={form.nom_commerce} onChange={e => set('nom_commerce', e.target.value)} placeholder="Aznovik Cyber, Épicerie Baobab…" />
                </Champ>
                <Champ label="Adresse complète">
                  <Input value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Rue de la République, N°12…" />
                </Champ>
                <Champ label="Quartier">
                  <Select value={form.quartier} onChange={e => set('quartier', e.target.value)} options={zones} placeholder="Sélectionner un quartier…" />
                </Champ>
                <Champ label="Téléphone *">
                  <Input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="0639 XX XX XX" />
                </Champ>
                <Champ label="Email">
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@moncommerce.com" />
                </Champ>
                <Champ label="Type de commerce">
                  <Select value={form.type_commerce} onChange={e => set('type_commerce', e.target.value)} options={typesCommerce} placeholder="Sélectionner…" />
                </Champ>
                <Champ label="Capacité de stockage">
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {[
                      { val: 'petit', label: 'Petit', desc: 'Petits colis' },
                      { val: 'moyen', label: 'Moyen', desc: 'Colis standards' },
                      { val: 'grand', label: 'Grand', desc: 'Gros colis inclus' },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => set('capacite_stockage', opt.val)} style={{ flex: 1, padding: '10px 6px', borderRadius: 10, border: `2px solid ${form.capacite_stockage === opt.val ? C.teal : C.border}`, background: form.capacite_stockage === opt.val ? '#F0FDFB' : C.white, cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: form.capacite_stockage === opt.val ? C.teal : C.navy }}>{opt.label}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </Champ>
              </>
            )}

            {role === 'livreur' && (
              <>
                <Champ label="Nom complet *">
                  <Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Prénom NOM" />
                </Champ>
                <Champ label="Téléphone *">
                  <Input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="0639 XX XX XX" />
                </Champ>
                <Champ label="Email">
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="mon@email.com" />
                </Champ>
                <Champ label="Zone de couverture">
                  <Select value={form.zone_couverture} onChange={e => set('zone_couverture', e.target.value)} options={zones} placeholder="Sélectionner une zone…" />
                </Champ>
                <Champ label="Type de véhicule">
                  <Select value={form.type_vehicule} onChange={e => set('type_vehicule', e.target.value)} options={vehicules} placeholder="Sélectionner un véhicule…" />
                </Champ>
              </>
            )}
          </div>

          {erreur && (
            <div style={{ background: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', color: C.red, fontSize: 13, marginTop: 12, marginBottom: 4 }}>
              {erreur}
            </div>
          )}

          <button onClick={valider} disabled={envoi} style={{ marginTop: 20, width: '100%', padding: '14px 0', background: C.teal, border: 'none', borderRadius: 12, color: C.white, fontSize: 15, fontWeight: 700, cursor: envoi ? 'not-allowed' : 'pointer', opacity: envoi ? 0.7 : 1 }}>
            {envoi ? 'Envoi en cours…' : 'Envoyer ma demande'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <a href="/" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>Déjà un compte ? Se connecter</a>
          </div>
        </div>
      )}

      {/* Étape : succès */}
      {etape === 'succes' && (
        <div style={{ width: '100%', maxWidth: 440, background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, padding: '48px 36px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 10 }}>Demande envoyée !</div>
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 28 }}>
            Votre demande a bien été reçue. Nous l'examinerons sous <strong>48h</strong> et vous contacterons par <strong>SMS</strong> avec vos identifiants de connexion si elle est acceptée.
          </div>
          <a href="/" style={{ display: 'inline-block', padding: '12px 28px', background: C.teal, color: C.white, borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            ← Retour à la connexion
          </a>
        </div>
      )}
    </div>
  );
}
