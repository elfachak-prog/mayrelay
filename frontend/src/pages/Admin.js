import { useState, useEffect } from 'react';
import API from '../services/api';

const C = {
  bg: "#F0F2F5", white: "#FFFFFF", navy: "#0B1F3A",
  teal: "#0E9F8E", amber: "#F59E0B", red: "#EF4444",
  green: "#10B981", blue: "#3B82F6", muted: "#94A3B8",
  text: "#1E293B", border: "#E2E8F0",
};

export default function Admin({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [onglet, setOnglet] = useState('dashboard');

  useEffect(() => {
    chargerStats();
  }, []);

  const chargerStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { key: 'dashboard', icon: '◈', label: 'Vue globale' },
    { key: 'partenaires', icon: '🏪', label: 'Partenaires' },
    { key: 'livreurs', icon: '🛵', label: 'Livreurs' },
    { key: 'colis', icon: '📦', label: 'Colis' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: C.navy, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>🏝️ MayRelay</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3, letterSpacing: 2, textTransform: 'uppercase' }}>Administration</div>
        </div>
        <div style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(item => (
            <div key={item.key} onClick={() => setOnglet(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: onglet === item.key ? 'rgba(14,159,142,0.15)' : 'transparent', borderLeft: onglet === item.key ? `3px solid ${C.teal}` : '3px solid transparent', color: onglet === item.key ? '#fff' : C.muted, fontSize: 14 }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, color: '#fff', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 8 }}>
            👑 {user.nom}
          </div>
          <div onClick={onLogout} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px 12px' }}>← Deconnexion</div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
          Bonjour, {user.nom} 👑
        </h1>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>Panneau d administrateur MayRelay</div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
            {[
              { icon: '🏪', label: 'Partenaires', value: stats.partenaires, color: C.teal },
              { icon: '🛵', label: 'Livreurs', value: stats.livreurs, color: C.blue },
              { icon: '📦', label: 'Colis total', value: stats.colis, color: C.amber },
              { icon: '🚀', label: 'Missions', value: stats.missions, color: C.green },
            ].map(s => (
              <div key={s.label} style={{ background: C.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: C.white, borderRadius: 16, padding: 32, border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 8 }}>
            Panneau admin en construction
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            Les fonctionnalites de gestion des partenaires, livreurs et colis arrivent prochainement.
          </div>
        </div>
      </div>
    </div>
  );
}
