import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Casiers from './pages/Casiers';
import Livreur from './pages/Livreur';
import Admin from './pages/Admin';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [ongletGlobal, setOngletGlobal] = useState('dashboard');

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  if (user.role === 'admin') {
    return <Admin user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'livreur') {
    return <Livreur user={user} onLogout={handleLogout} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FA', fontFamily: 'sans-serif' }}>
      <div style={{ width: 220, background: '#0D1F2D', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>🏝️ MayRelay</div>
          <div style={{ fontSize: 10, color: '#4A7B94', marginTop: 3, letterSpacing: 2, textTransform: 'uppercase' }}>Espace Partenaire</div>
        </div>
        <div style={{ flex: 1, padding: '12px 10px' }}>
          {[
            { key: 'dashboard', icon: '◈', label: 'Tableau de bord' },
            { key: 'nouveau', icon: '+', label: 'Nouvel envoi' },
            { key: 'colis', icon: '▦', label: 'Mes colis' },
            { key: 'casiers', icon: '⊞', label: 'Casiers' },
          ].map(item => (
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
        {ongletGlobal === 'casiers'
          ? <Casiers user={user} />
          : <Dashboard user={user} onLogout={handleLogout} ongletInitial={ongletGlobal} />
        }
      </div>
    </div>
  );
}

export default App;
