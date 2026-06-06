import { useState } from 'react';
import { login } from '../services/api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', mot_de_passe: '', role: 'partenaire' });
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async () => {
    setChargement(true);
    setErreur('');
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de connexion');
    }
    setChargement(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A4B6E 0%, #0D1F2D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '48px 40px', width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏝️</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>MayRelay</div>
          <div style={{ fontSize: 12, color: '#4A7B94', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>Connexion</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#4A7B94', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}>
            <option value="partenaire">Partenaire</option>
            <option value="livreur">Livreur</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#4A7B94', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Email</label>
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            placeholder="votre@email.com" type="email" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#4A7B94', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Mot de passe</label>
          <input value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            placeholder="••••••••" type="password" />
        </div>

        {erreur && (
          <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {erreur}
          </div>
        )}

        <button onClick={handleSubmit} disabled={chargement} style={{ width: '100%', padding: '14px', background: chargement ? '#4A7B94' : '#E8613A', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: chargement ? 'not-allowed' : 'pointer' }}>
          {chargement ? 'Connexion...' : 'Se connecter →'}
        </button>
      </div>
    </div>
  );
}
