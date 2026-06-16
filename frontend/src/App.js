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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [ongletGlobal, setOngletGlobal] = useState('dashboard');
  const isMobile = useIsMobile();

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

  if (!user) return <Login onLogin={handleLogin} />;
  if (user.role === 'admin') return <Admin user={user} onLogout={handleLogout} />;
  if (user.role === 'livreur') return <Livreur user={user} onLogout={handleLogout} />;

  const navItems = [
    { key: 'dashboard', icon: '◈', label: 'Accueil' },
    { key: 'nouveau', icon: '+', label: 'Envoi' },
    { key: 'reception', icon: '📥', label: 'Réception' },
    { key: 'colis', icon: '▦', label: 'Colis' },
    { key: 'casiers', icon: '⊞', label: 'Casiers' },
    { key: 'paiements', icon: '💶', label: 'Paiements' },
  ];

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F4F7FA', fontFamily: 'sans-serif' }}>
        {/* Header mobile */}
        <div style={{ background: '#0D1F2D', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>🏝️ MayRelay</div>
            <div style={{ fontSize: 9, color: '#4A7B94', letterSpacing: 2, textTransform: 'uppercase' }}>Espace Partenaire</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <div style={{ fontSize: 11, color: '#fff' }}>{user.nom}</div>
            <div onClick={handleLogout} style={{ fontSize: 10, color: '#E8613A', cursor: 'pointer' }}>Déconnexion</div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', paddingBottom: 80 }}>
          {ongletGlobal === 'casiers' && <Casiers user={user} />}
          {ongletGlobal === 'paiements' && <Paiements user={user} />}
          {ongletGlobal === 'testqr' && <TestQR />}
          {ongletGlobal === 'reception' && <Reception />}
          {!['casiers', 'paiements', 'testqr', 'reception'].includes(ongletGlobal) && (
            <Dashboard user={user} onLogout={handleLogout} ongletInitial={ongletGlobal} isMobile={true} />
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0D1F2D', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', zIndex: 100 }}>
          {navItems.map(item => (
            <div
              key={item.key}
              onClick={() => setOngletGlobal(item.key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '8px 4px', cursor: 'pointer',
                color: ongletGlobal === item.key ? '#E8613A' : '#4A7B94',
                borderTop: ongletGlobal === item.key ? '2px solid #E8613A' : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 9, marginTop: 2, letterSpacing: 0.5 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Layout desktop (sidebar)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FA', fontFamily: 'sans-serif' }}>
      <div style={{ width: 220, background: '#0D1F2D', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>🏝️ MayRelay</div>
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
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        {ongletGlobal === 'casiers' && <Casiers user={user} />}
        {ongletGlobal === 'paiements' && <Paiements user={user} />}
        {ongletGlobal === 'testqr' && <TestQR />}
        {ongletGlobal === 'reception' && <Reception />}
        {!['casiers', 'paiements', 'testqr', 'reception'].includes(ongletGlobal) && (
          <Dashboard user={user} onLogout={handleLogout} ongletInitial={ongletGlobal} isMobile={false} />
        )}
      </div>
    </div>
  );
}

export default App;
