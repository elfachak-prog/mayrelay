import { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://mayrelay-production.up.railway.app/api';

const statutConfig = {
  en_attente: {
    label: 'En attente de prise en charge',
    icon: '📦',
    color: '#F59E0B',
    bg: '#FEF3C7',
    description: 'Votre colis a ete enregistre et attend d etre pris en charge par un livreur.'
  },
  en_transit: {
    label: 'En transit',
    icon: '🛵',
    color: '#3B82F6',
    bg: '#DBEAFE',
    description: 'Votre colis est en cours de livraison vers le point relais.'
  },
  livre: {
    label: 'Disponible au point relais',
    icon: '✅',
    color: '#10B981',
    bg: '#D1FAE5',
    description: 'Votre colis est arrive au point relais. Vous pouvez venir le recuperer.'
  },
  paye: {
    label: 'Votre colis est pret a etre retire',
    icon: '✅',
    color: '#10B981',
    bg: '#D1FAE5',
    description: 'Votre colis est disponible au point relais. Venez le recuperer avec votre reference.'
  },
};

const etapes = [
  { key: 'enregistre', label: 'Enregistre', icon: '📝' },
  { key: 'en_attente', label: 'En attente', icon: '📦' },
  { key: 'en_transit', label: 'En transit', icon: '🛵' },
  { key: 'livre', label: 'Livre', icon: '✅' },
];

function getEtapeIndex(statut) {
  if (statut === 'en_attente') return 1;
  if (statut === 'en_transit') return 2;
  if (statut === 'livre' || statut === 'paye') return 3;
  return 0;
}

export default function Suivi() {
  const [reference, setReference] = useState('');
  const [colis, setColis] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const handleRechercher = async () => {
    if (!reference.trim()) return;
    setChargement(true);
    setErreur('');
    setColis(null);
    try {
      const res = await axios.get(`${API_URL}/suivi/${reference.trim().toUpperCase()}`);
      setColis(res.data.colis);
    } catch (err) {
      setErreur('Aucun colis trouve avec cette reference. Verifiez et reessayez.');
    }
    setChargement(false);
  };

  const statut = colis ? (statutConfig[colis.statut] || statutConfig.en_attente) : null;
  const etapeIdx = colis ? getEtapeIndex(colis.statut) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A4B6E 0%, #0D1F2D 100%)', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 28 }}>🏝️</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>MayRelay</div>
          <div style={{ fontSize: 11, color: '#4A7B94', letterSpacing: 2, textTransform: 'uppercase' }}>Suivi de colis</div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', margin: '0 0 8px' }}>
            Suivez votre colis
          </h1>
          <p style={{ fontSize: 14, color: '#4A7B94', margin: 0 }}>
            Entrez votre reference pour connaitre l etat de votre envoi
          </p>
        </div>

        {/* Champ de recherche */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
          <label style={{ display: 'block', fontSize: 11, color: '#4A7B94', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Reference du colis
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={reference}
              onChange={e => setReference(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRechercher()}
              placeholder="Ex: MR-2026-1234"
              style={{ flex: 1, padding: '13px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 16, outline: 'none', fontFamily: 'monospace', letterSpacing: 1 }}
            />
            <button onClick={handleRechercher} disabled={chargement} style={{ padding: '13px 24px', background: '#E8613A', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: chargement ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
              {chargement ? 'Recherche...' : 'Rechercher →'}
            </button>
          </div>
        </div>

        {/* Erreur */}
        {erreur && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#EF4444' }}>
            ❌ {erreur}
          </div>
        )}

        {/* Résultat */}
        {colis && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>

            {/* Statut principal */}
            <div style={{ padding: 28, background: statut.bg + '22', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{statut.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: statut.color, marginBottom: 8 }}>{statut.label}</div>
              <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{statut.description}</div>
            </div>

            {/* Progression */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {etapes.map((e, i) => {
                  const done = i <= etapeIdx;
                  const current = i === etapeIdx;
                  return (
                    <div key={e.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {i > 0 && <div style={{ flex: 1, height: 2, background: i <= etapeIdx ? '#10B981' : 'rgba(255,255,255,0.1)' }} />}
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: done ? '#10B981' : 'rgba(255,255,255,0.08)', border: `2px solid ${done ? '#10B981' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: current ? 18 : 14, flexShrink: 0 }}>
                          {done ? (i === etapeIdx ? e.icon : '✓') : e.icon}
                        </div>
                        {i < etapes.length - 1 && <div style={{ flex: 1, height: 2, background: i < etapeIdx ? '#10B981' : 'rgba(255,255,255,0.1)' }} />}
                      </div>
                      <div style={{ fontSize: 10, color: done ? '#10B981' : '#4A7B94', marginTop: 6, textAlign: 'center', letterSpacing: 0.5 }}>{e.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Informations */}
            <div style={{ padding: '20px 28px' }}>
              <div style={{ fontSize: 11, color: '#4A7B94', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Informations</div>
              {[
                ['Reference', colis.reference],
                ['Type', colis.type === 'Colis' ? '📦 Colis' : '✉️ Courrier'],
                ['Destinataire', colis.nom_destinataire],
                ['Quartier', colis.quartier],
                ['Point relais', colis.partenaire_nom],
                ['Horaires', colis.partenaire_horaires],
                ['Date d envoi', new Date(colis.created_at).toLocaleDateString('fr-FR')],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 13, color: '#4A7B94' }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: label === 'Reference' ? 600 : 400, fontFamily: label === 'Reference' ? 'monospace' : 'sans-serif' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Message si disponible */}
            {(colis.statut === 'livre' || colis.statut === 'paye') && (
              <div style={{ margin: '0 24px 24px', background: '#065F46', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>Votre colis est disponible</div>
                <div style={{ fontSize: 13, color: '#6EE7B7', lineHeight: 1.6 }}>
                  Rendez-vous au <strong>{colis.partenaire_nom}</strong> dans la zone <strong>{colis.partenaire_zone}</strong> avec votre reference <strong style={{ fontFamily: 'monospace' }}>{colis.reference}</strong> pour recuperer votre colis.
                </div>
                {colis.partenaire_horaires && (
                  <div style={{ fontSize: 12, color: '#6EE7B7', marginTop: 8 }}>🕐 Horaires : {colis.partenaire_horaires}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: '#4A7B94' }}>
          MayRelay — Le réseau de distribution de Mayotte 🏝️
        </div>
      </div>
    </div>
  );
}
