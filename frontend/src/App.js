import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Casiers from './pages/Casiers';
import Livreur from './pages/Livreur';
import Admin from './pages/Admin';
import Paiements from './pages/Paiements';
import Suivi from './pages/Suivi';
import TestQR from './pages/TestQR';
import Reception from './pages/Reception';
import Rejoindre from './pages/Rejoindre';
import API from './services/api';

function useIsMobile() {
  const query = '(max-width: 767px)';
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [ongletGlobal, setOngletGlobal] = useState('dashboard');
  const [logoUrl, setLogoUrl] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) return;
    API.get('/parametres')
      .then(res => setLogoUrl(res.data.parametres?.logo_url || ''))
      .catch(() => {});
  }, [user]);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const path = window.location.pathname;
  if (path === '/suivi' || path.startsWith('/suivi')) {
    return <Suivi />;
  }
  if (path === '/rejoindre') {
    return <Rejoindre />;
  }

  if (!user) return <Login onLogin={handleLogin} />;
  if (user.role === 'admin') return <Admin user={user} onLogout={handleLogout} logo={logoUrl} onLogoChange={setLogoUrl} />;
  if (user.role === 'livreur') return <Livreur user={user} onLogout={handleLogout} logo={logoUrl} />;

  const navItems = [
    { key: 'dashboard', icon: '◈', label: 'Accueil' },
    { key: 'nouveau', icon: '+', label: 'Envoi' },
    { key: 'reception', icon: '📥', label: 'Réception' },
    { key: 'colis', icon: '▦', label: 'Colis' },
    { key: 'casiers', icon: '⊞', label: 'Casiers' },
    { key: 'paiements', icon: '💶', label: 'Paiements' },
    { key: 'parametres', icon: '⚙️', label: 'Paramètres' },
  ];

  // Layout unifié — sidebar masquée sur mobile, bottom nav fixe sur mobile (identique à Livreur.js)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FA', fontFamily: 'sans-serif' }}>

      {/* Sidebar — desktop uniquement */}
      {!isMobile && (
        <div style={{ width: 220, background: '#0D1F2D', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block', marginBottom: 6 }} />
              : <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>🏝️ MayRelay</div>
            }
            <div style={{ fontSize: 10, color: '#4A7B94', marginTop: 3, letterSpacing: 2, textTransform: 'uppercase' }}>Espace Partenaire</div>
          </div>
          <div style={{ flex: 1, padding: '12px 10px' }}>
            {[...navItems, { key: 'testqr', icon: '🧪', label: 'Test QR' }].map(item => (
              <div key={item.key} onClick={() => setOngletGlobal(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: ongletGlobal === item.key ? 'rgba(232,97,58,0.15)' : 'transparent', borderLeft: ongletGlobal === item.key ? '3px solid #E8613A' : '3px solid transparent', color: ongletGlobal === item.key ? '#fff' : '#4A7B94', fontSize: 14 }}>
                <span>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#fff', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 8 }}>{user.nom}</div>
            <div onClick={handleLogout} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px 12px' }}>← Deconnexion</div>
          </div>
        </div>
      )}

      {/* Colonne principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header — mobile uniquement */}
        {isMobile && (
          <div style={{ background: '#0D1F2D', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
            <div>
              {logoUrl
                ? <img src={logoUrl} alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block', marginBottom: 2 }} />
                : <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>🏝️ MayRelay</div>
              }
              <div style={{ fontSize: 9, color: '#4A7B94', letterSpacing: 2, textTransform: 'uppercase' }}>Espace Partenaire</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <div style={{ fontSize: 11, color: '#fff' }}>{user.nom}</div>
              <div onClick={handleLogout} style={{ fontSize: 10, color: '#E8613A', cursor: 'pointer' }}>Déconnexion</div>
            </div>
          </div>
        )}

        {/* Contenu */}
        <div style={{ flex: 1, padding: isMobile ? '20px 16px' : '40px 48px', paddingBottom: isMobile ? 80 : undefined, overflowY: 'auto' }}>
          {ongletGlobal === 'casiers' && <Casiers user={user} />}
          {ongletGlobal === 'paiements' && <Paiements user={user} />}
          {ongletGlobal === 'testqr' && <TestQR />}
          {ongletGlobal === 'reception' && <Reception />}
          {ongletGlobal === 'parametres' && (
            <div style={{ maxWidth: 480 }}>
              <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#0D1F2D', marginBottom: 4, fontFamily: 'Georgia, serif' }}>Paramètres</h2>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Votre compte partenaire</div>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#4A7B94', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Nom</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0D1F2D' }}>{user.nom}</div>
                </div>
                {user.email && (
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#4A7B94', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Email</div>
                    <div style={{ fontSize: 15, color: '#0D1F2D' }}>{user.email}</div>
                  </div>
                )}
                {user.telephone && (
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#4A7B94', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Téléphone</div>
                    <div style={{ fontSize: 15, color: '#0D1F2D' }}>{user.telephone}</div>
                  </div>
                )}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: 11, color: '#4A7B94', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Rôle</div>
                  <div style={{ fontSize: 15, color: '#0D1F2D', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{ marginTop: 20, width: '100%', padding: '14px 0', background: 'transparent', border: '1.5px solid #E2E8F0', borderRadius: 12, color: '#EF4444', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}
              >
                ← Déconnexion
              </button>
            </div>
          )}
          {!['casiers', 'paiements', 'testqr', 'reception', 'parametres'].includes(ongletGlobal) && (
            <Dashboard user={user} onLogout={handleLogout} ongletInitial={ongletGlobal} isMobile={isMobile} logo={logoUrl} />
          )}
        </div>
      </div>

      {/* Bottom nav — mobile uniquement, identique à Livreur.js */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#0D1F2D', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', zIndex: 100 }}>
          {navItems.map(t => (
            <div key={t.key} onClick={() => setOngletGlobal(t.key)} style={{ flex: 1, padding: '12px 0 10px', textAlign: 'center', cursor: 'pointer', borderTop: ongletGlobal === t.key ? '2px solid #E8613A' : '2px solid transparent' }}>
              <div style={{ fontSize: 20 }}>{t.icon}</div>
              <div style={{ fontSize: 10, color: ongletGlobal === t.key ? '#E8613A' : '#4A7B94', marginTop: 2, fontFamily: 'sans-serif', fontWeight: ongletGlobal === t.key ? 700 : 400 }}>{t.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
