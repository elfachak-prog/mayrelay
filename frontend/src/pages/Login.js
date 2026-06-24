import { useState, useEffect } from 'react';
import { login } from '../services/api';
import API from '../services/api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', mot_de_passe: '', role: 'partenaire' });
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    API.get('/parametres')
      .then(res => setLogoUrl(res.data.parametres?.logo_url || ''))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setChargement(true);
    setErreur('');
    try {
      let res;
      if (form.role === 'admin') {
        res = await API.post('/admin/login', { email: form.email, mot_de_passe: form.mot_de_passe });
      } else {
        res = await login(form);
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de connexion');
    }
    setChargement(false);
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: '#fff',
    fontSize: 15, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'sans-serif'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A4B6E 0%, #0D1F2D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '48px 40px', width: 380, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{ height: 48, maxWidth: 160, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }} />
            : <div style={{ fontSize: 40, marginBottom: 8 }}>🏝️</div>
          }
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>MayRelay</div>
          <div style={{ fontSize: 12, color: '#4A7B94', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>Connexion</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#4A7B94', marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ ...inputStyle, appearance: 'none' }}>
            <option value="partenaire">Partenaire</option>
            <option value="livreur">Livreur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#4A7B94', marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>Email</label>
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle} placeholder="votre@email.com" type="email" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#4A7B94', marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>Mot de passe</label>
          <input value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
            style={inputStyle} placeholder="••••••••" type="password" />
        </div>

        {erreur && (
          <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {erreur}
          </div>
        )}

        <button onClick={handleSubmit} disabled={chargement} style={{ width: '100%', padding: '14px', background: chargement ? '#4A7B94' : '#E8613A', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: chargement ? 'not-allowed' : 'pointer' }}>
          {chargement ? 'Connexion...' : 'Se connecter →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 13, color: '#4A7B94' }}>Pas encore partenaire ou livreur ?</span>
          {' '}
          <a href="/rejoindre" style={{ fontSize: 13, color: '#0E9F8E', fontWeight: 600, textDecoration: 'none' }}
            onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Rejoindre MayRelay
          </a>
        </div>
      </div>
    </div>
  );
}
