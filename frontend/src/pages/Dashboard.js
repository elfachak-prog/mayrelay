import { useState, useEffect } from 'react';
import API, { getMesColis, creerColis, getStatsPartenaire } from '../services/api';
import SelecteurPays from '../components/SelecteurPays';

const COLORS = {
  ocean: "#0A4B6E", lagoon: "#1A7FA8", coral: "#E8613A",
  foam: "#EAF6FB", dark: "#0D1F2D", mid: "#4A7B94",
  white: "#FFFFFF", green: "#10B981", amber: "#F59E0B",
  border: "#E2E8F0",
};

const statutConfig = {
  en_attente: { label: "En attente", color: "#E8A23A", bg: "#FEF3DC" },
  en_transit: { label: "En transit", color: "#1A7FA8", bg: "#EAF6FB" },
  livre: { label: "Livré", color: "#2EAF7D", bg: "#E0F5EE" },
  paye: { label: "Payé", color: "#2EAF7D", bg: "#E0F5EE" },
  retourne: { label: "Retourné", color: "#EF4444", bg: "#FEE2E2" },
};

const quartiers = ["Mamoudzou Centre","Kaweni","Bandraboua","Koungou","Pamandzi","Dzaoudzi","Labattoir","Labattoir Centre","Boueni","Chiconi","Sada","Tsingoni","Mtsamboro"];

const imprimerEtiquette = (c, logo, partenaireNom) => {
  const w = window.open('', '_blank', 'width=420,height=370');
  const date = new Date(c.created_at).toLocaleDateString('fr-FR');
  const nomComplet = [c.nom_destinataire, c.prenom_destinataire].filter(Boolean).join(' ');
  const logoHtml = logo
    ? `<img src="${logo}" style="height:24px;max-width:90px;object-fit:contain;display:block;" />`
    : `<span style="font-size:11pt;font-weight:700;color:#0A4B6E;">MayRelay</span>`;
  const fromText = [c.nom_expediteur, c.telephone_expediteur, partenaireNom].filter(Boolean).join(' · ');

  w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: 10cm 8cm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 10cm; height: 8cm; font-family: Arial, Helvetica, sans-serif; background: #fff; }
  .label { width: 10cm; height: 8cm; padding: 5px 7px; display: flex; flex-direction: column; border: 1px solid #bbb; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #0A4B6E; padding-bottom: 4px; margin-bottom: 5px; }
  .ref { font-family: monospace; font-size: 9pt; font-weight: 700; color: #1A7FA8; letter-spacing: 0.5px; }
  .badge { font-size: 7pt; background: #E8613A; color: #fff; padding: 2px 6px; border-radius: 3px; font-weight: 700; }
  .main { display: flex; flex: 1; gap: 8px; align-items: flex-start; }
  .qr img { width: 82px; height: 82px; display: block; }
  .info { flex: 1; padding-top: 2px; }
  .dest-name { font-size: 12pt; font-weight: 800; color: #0D1F2D; margin-bottom: 5px; line-height: 1.1; }
  .row { font-size: 8pt; color: #444; margin-bottom: 4px; display: flex; gap: 4px; }
  .row-label { color: #888; min-width: 10px; }
  .row-val { font-weight: 600; color: #0D1F2D; }
  .from { background: #EAF6FB; border-radius: 2px; padding: 3px 5px; margin-bottom: 3px; font-size: 6.5pt; color: #0D1F2D; }
  .from-lbl { font-weight: 700; color: #0A4B6E; }
  .footer { border-top: 1px solid #ddd; padding-top: 3px; font-size: 6.5pt; color: #aaa; display: flex; justify-content: space-between; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="label">
  <div class="header">
    ${logoHtml}
    <span class="ref">${c.reference}</span>
    <span class="badge">${c.type || 'Colis'}</span>
  </div>
  <div class="main">
    <div class="qr">${c.qr_code ? `<img src="${c.qr_code}" alt="QR" />` : ''}</div>
    <div class="info">
      <div class="dest-name">${nomComplet}</div>
      <div class="row"><span class="row-label">📞</span><span class="row-val">${c.telephone_destinataire}</span></div>
      <div class="row"><span class="row-label">📍</span><span class="row-val">${c.quartier}</span></div>
      <div class="row"><span class="row-label">📅</span><span class="row-val">${date}</span></div>
    </div>
  </div>
  ${fromText ? `<div class="from"><span class="from-lbl">DE : </span>${fromText}</div>` : ''}
  <div class="footer">
    <span>mayrelay.vercel.app/suivi</span>
    <span>${date}</span>
  </div>
</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}</script>
</body></html>`);
  w.document.close();
};

const partagerEtiquette = async (c, logo, partenaireNom, onStart, onEnd) => {
  if (!navigator.share) {
    alert("Le partage n'est pas disponible. Utilisez Chrome sur Android.");
    return;
  }
  onStart?.();
  try {
    const s = 2;
    const W = 378 * s;  // 100mm à 96 dpi
    const H = 567 * s;  // 150mm à 96 dpi
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const loadImg = (src) => new Promise((res) => {
      if (!src) return res(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const [logoImg, qrImg] = await Promise.all([loadImg(logo), loadImg(c.qr_code)]);

    // Constantes de mise en page (pixels logiques, ×s pour canvas)
    const bm  = 5;   // marge bordure extérieure
    const pad = 10;  // padding intérieur des sections
    const iw  = W / s - 2 * bm; // largeur intérieure = 368 px
    const dateStr  = new Date(c.created_at).toLocaleDateString('fr-FR');
    const nomDest  = [c.nom_destinataire, c.prenom_destinataire].filter(Boolean).join(' ');
    const refStr   = c.reference || '';

    // ── Helpers ──────────────────────────────────────────────
    const hline = (yp, thick = 1.5) => {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = thick * s;
      ctx.beginPath();
      ctx.moveTo(bm * s, yp * s);
      ctx.lineTo((W / s - bm) * s, yp * s);
      ctx.stroke();
    };

    // Texte simple (retourne la largeur logique mesurée)
    const txt = (str, x, y, size, bold = false, maxW) => {
      ctx.font = `${bold ? '700 ' : ''}${size * s}px Arial, sans-serif`;
      ctx.fillStyle = '#000000';
      const sv = String(str || '');
      if (maxW) ctx.fillText(sv, x * s, y * s, maxW * s);
      else      ctx.fillText(sv, x * s, y * s);
      return ctx.measureText(sv).width / s;
    };

    // Libellé petit + valeur en gras sur la même ligne
    const lv = (lbl, val, x, y, valSz, maxW) => {
      ctx.font = `${8 * s}px Arial, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.fillText(lbl, x * s, y * s);
      const lw = ctx.measureText(lbl + ' ').width / s;
      ctx.font = `700 ${valSz * s}px Arial, sans-serif`;
      ctx.fillStyle = '#000000';
      const sv = String(val || '—');
      if (maxW) ctx.fillText(sv, (x + lw) * s, y * s, (maxW - lw) * s);
      else      ctx.fillText(sv, (x + lw) * s, y * s);
    };

    // Barre de titre de section (fond gris clair + texte gras)
    const secTitle = (label, y, h) => {
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect((bm + 1) * s, (y + 1) * s, (iw - 2) * s, (h - 1) * s);
      txt(label, bm + pad, y + h - 6, 10, true);
    };

    // ── Bordure extérieure (2 px) ────────────────────────────
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(bm * s, bm * s, iw * s, (H / s - 2 * bm) * s);

    // ════════════════════════════════════════════════════════
    // 1. ENTÊTE  y: 5 → 63  (h = 58)
    // ════════════════════════════════════════════════════════
    const hY = bm, hH = 58;

    if (logoImg) {
      const lh = 26, lw2 = Math.min(100, logoImg.width * (lh / logoImg.height));
      ctx.drawImage(logoImg, (bm + pad) * s, (hY + 16) * s, lw2 * s, lh * s);
    } else {
      txt('MayRelay', bm + pad, hY + 38, 14, true);
    }

    // Référence — grande, centrée, monospace
    ctx.font = `700 ${17 * s}px "Courier New", monospace`;
    ctx.fillStyle = '#000000';
    const refPxW = ctx.measureText(refStr).width;
    ctx.fillText(refStr, (W - refPxW) / 2, (hY + 40) * s);

    // Badge type — fond noir, texte blanc
    ctx.font = `700 ${9 * s}px Arial, sans-serif`;
    const typeStr = (c.type || 'Colis').toUpperCase();
    const btW = ctx.measureText(typeStr).width + 16 * s;
    const btH = 22 * s;
    const btX = (W / s - bm - pad) * s - btW;
    const btY = (hY + 18) * s;
    ctx.fillStyle = '#000000';
    ctx.fillRect(btX, btY, btW, btH);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(typeStr, btX + 8 * s, btY + 15 * s);

    hline(hY + hH, 2);

    // ════════════════════════════════════════════════════════
    // 2. EXPÉDITEUR  y: 63 → 293  (h = 230)
    // ════════════════════════════════════════════════════════
    const eY = hY + hH, eH = 230, tH = 22;

    secTitle('EXPÉDITEUR — dépositaire', eY, tH);

    // QR code à gauche
    const qrSz = 118;
    if (qrImg) ctx.drawImage(qrImg, (bm + pad) * s, (eY + tH + 8) * s, qrSz * s, qrSz * s);

    // Infos expéditeur à droite du QR
    const eiX = bm + pad + qrSz + 10;
    const eiW = W / s - bm - pad - eiX;
    let ey = eY + tH + 22;
    txt(c.nom_expediteur || '—', eiX, ey, 13, true, eiW);  ey += 22;
    lv('Tél :', c.telephone_expediteur, eiX, ey, 10, eiW);  ey += 22;
    lv('Relais :', partenaireNom, eiX, ey, 10, eiW);

    // Séparateur épais noir (4 px)
    ctx.fillStyle = '#000000';
    ctx.fillRect(bm * s, (eY + eH) * s, iw * s, 4 * s);

    // ════════════════════════════════════════════════════════
    // 3. DESTINATAIRE  y: 297 → 492  (h = 195)
    // ════════════════════════════════════════════════════════
    const dY = eY + eH + 4, dH = 195;

    secTitle('DESTINATAIRE', dY, tH);

    let dy = dY + tH + 18;
    const nmW = iw - 2 * pad;

    // Nom en très grand (le plus lisible)
    ctx.font = `800 ${20 * s}px Arial, sans-serif`;
    ctx.fillStyle = '#000000';
    if (ctx.measureText(nomDest).width > nmW * s) ctx.font = `800 ${15 * s}px Arial, sans-serif`;
    ctx.fillText(nomDest, (bm + pad) * s, dy * s, nmW * s);
    dy += 32;

    lv('Tél :', c.telephone_destinataire, bm + pad, dy, 11, nmW);  dy += 26;
    lv('Zone :', c.quartier,              bm + pad, dy, 11, nmW);  dy += 26;
    lv('Date :', dateStr,                 bm + pad, dy, 11, nmW);

    hline(dY + dH, 2);

    // ════════════════════════════════════════════════════════
    // 4. PIED DE PAGE  y: 492 → 562  (h = 70)
    // ════════════════════════════════════════════════════════
    const ftY = dY + dH;

    txt('mayrelay.vercel.app/suivi', bm + pad, ftY + 20, 8);

    ctx.font = `${8 * s}px Arial, sans-serif`;
    ctx.fillStyle = '#000000';
    const dtW = ctx.measureText(dateStr).width / s;
    txt(dateStr, W / s - bm - pad - dtW, ftY + 20, 8);

    // Référence répétée en grand au bas
    ctx.font = `700 ${13 * s}px "Courier New", monospace`;
    ctx.fillStyle = '#000000';
    const refFtW = ctx.measureText(refStr).width;
    ctx.fillText(refStr, (W - refFtW) / 2, (ftY + 50) * s);

    // ── Génération & partage ─────────────────────────────────
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], `etiquette-${c.reference}.png`, { type: 'image/png' });
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      alert("Le partage de fichiers n'est pas supporté sur ce navigateur.");
      return;
    }
    await navigator.share({ title: `Etiquette ${c.reference}`, files: [file] });
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Erreur partage:', err);
  } finally {
    onEnd?.();
  }
};

export default function Dashboard({ user, onLogout, ongletInitial, isMobile, logo }) {
  const [onglet, setOnglet] = useState(ongletInitial || 'dashboard');
  const [colis, setColis] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [paysD1, setPaysD1] = useState('+262');
  const [paysD2, setPaysD2] = useState('+262');
  const [paysE, setPaysE] = useState('+262');
  const [form, setForm] = useState({
    nom_destinataire: '', prenom_destinataire: '',
    telephone_destinataire: '', telephone2_destinataire: '',
    email_destinataire: '', quartier: '', type: 'Colis', notes: '',
    nom_expediteur: '', telephone_expediteur: '', email_expediteur: '',
    poids: ''
  });
  const [succes, setSucces] = useState(null);
  const [tarifVolumineux, setTarifVolumineux] = useState({ base: 8, parKg: 1.5 });
  const [logoLocal, setLogoLocal] = useState(logo || '');
  const [partageRef, setPartageRef] = useState(null);

  useEffect(() => {
    chargerColis();
    chargerStats();
    API.get('/parametres').then(res => {
      const p = res.data.parametres;
      setTarifVolumineux({
        base: parseFloat(p.prix_volumineux_base) || 8,
        parKg: parseFloat(p.prix_volumineux_par_kg) || 1.5,
      });
      setLogoLocal(p.logo_url || '');
    }).catch(() => {});
  }, []);
  useEffect(() => { setOnglet(ongletInitial || 'dashboard'); }, [ongletInitial]);

  const calculerPrixVolumineux = (poids) => {
    const p = parseFloat(poids) || 0;
    if (p <= 0) return null;
    const prix = p > 5 ? tarifVolumineux.base + (p - 5) * tarifVolumineux.parKg : tarifVolumineux.base;
    return +prix.toFixed(2);
  };

  const chargerColis = async () => {
    try {
      const res = await getMesColis();
      setColis(res.data.colis || []);
    } catch (err) { console.error(err); }
  };

  const chargerStats = async () => {
    try {
      const res = await getStatsPartenaire();
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const handleEnvoi = async () => {
    if (!form.nom_destinataire || !form.telephone_destinataire || !form.quartier) return;
    if (form.type === 'Volumineux' && (!form.poids || parseFloat(form.poids) <= 0)) return;
    setChargement(true);
    try {
      const tel1 = paysD1 + form.telephone_destinataire.replace(/^0/, '');
      const tel2 = form.telephone2_destinataire ? paysD2 + form.telephone2_destinataire.replace(/^0/, '') : '';
      const telExp = form.telephone_expediteur ? paysE + form.telephone_expediteur.replace(/^0/, '') : '';
      const res = await creerColis({ ...form, telephone_destinataire: tel1, telephone2_destinataire: tel2, telephone_expediteur: telExp });
      setSucces(res.data.colis);
      setForm({ nom_destinataire: '', prenom_destinataire: '', telephone_destinataire: '', telephone2_destinataire: '', email_destinataire: '', quartier: '', type: 'Colis', notes: '', nom_expediteur: '', telephone_expediteur: '', email_expediteur: '', poids: '' });
      chargerColis();
      chargerStats();
    } catch (err) { console.error(err); }
    setChargement(false);
  };

  const inputStyle = { width: '100%', padding: '11px 14px', border: `1.5px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, color: COLORS.dark, outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', background: '#FAFBFC' };
  const labelStyle = { display: 'block', fontSize: 11, color: COLORS.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'sans-serif' };

  const _now = new Date();
  const _MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const moisNom = `${_MOIS[_now.getMonth()]} ${_now.getFullYear()}`;

  return (
    <div>
      {onglet === 'dashboard' && (
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: COLORS.dark, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>
            Bonjour, {user.nom}
          </h1>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Tableau de bord — {moisNom}</div>

          {/* Solde disponible — carte mise en avant */}
          <div style={{ background: 'linear-gradient(135deg, #0A4B6E 0%, #1A7FA8 100%)', borderRadius: 16, padding: isMobile ? '20px 20px' : '24px 28px', marginBottom: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Solde disponible</div>
              <div style={{ fontSize: isMobile ? 32 : 40, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                {stats ? `${stats.solde_disponible} €` : '—'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>À reverser à MayRelay</div>
            </div>
            <div style={{ fontSize: 48, opacity: 0.3 }}>💶</div>
          </div>

          {/* Stats en grille */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { icon: '📦', label: 'Total colis', value: colis.length, sub: 'tous les colis' },
              { icon: '📅', label: 'Colis ce mois', value: stats ? stats.colis_mois : '—', sub: moisNom },
              { icon: '💰', label: 'Revenus du mois', value: stats ? `${stats.revenus_mois} €` : '—', sub: 'commissions partenaire' },
              { icon: '⏳', label: 'En attente', value: colis.filter(c => c.statut === 'en_attente').length, sub: 'à remettre' },
              { icon: '✅', label: 'Livrés', value: colis.filter(c => c.statut === 'livre' || c.statut === 'paye').length, sub: 'récupérés' },
              { icon: '🔄', label: 'En transit', value: colis.filter(c => c.statut === 'en_transit').length, sub: 'en cours de livraison' },
            ].map(s => (
              <div key={s.label} style={{ background: COLORS.white, borderRadius: 14, padding: isMobile ? '16px 14px' : '20px 22px', border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: COLORS.dark, fontFamily: 'Georgia, serif' }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#AAA', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Derniers colis */}
          <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 15, fontWeight: 700, color: COLORS.dark, fontFamily: 'Georgia, serif', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Derniers colis</span>
              <span style={{ fontSize: 11, color: COLORS.mid, fontWeight: 400 }}>{colis.length} au total</span>
            </div>
            {colis.slice(0, 8).map((c, i) => {
              const s = statutConfig[c.statut] || statutConfig.en_attente;
              return (
                <div key={c.id} style={{ padding: isMobile ? '12px 16px' : '13px 20px', borderBottom: i < 7 ? `1px solid ${COLORS.border}` : 'none', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: COLORS.lagoon, fontWeight: 600, minWidth: isMobile ? 80 : 100 }}>{c.reference}</div>
                  {!isMobile && <div style={{ fontSize: 13, color: COLORS.dark, flex: 1 }}>{c.nom_destinataire}</div>}
                  {isMobile && <div style={{ fontSize: 12, color: COLORS.dark, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom_destinataire}</div>}
                  {!isMobile && <div style={{ fontSize: 12, color: '#888', flex: 1 }}>{c.quartier}</div>}
                  <span style={{ background: s.bg, color: s.color, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
              );
            })}
            {colis.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Aucun colis enregistré</div>}
          </div>
        </div>
      )}

      {onglet === 'nouveau' && (
        <div style={{ maxWidth: 640 }}>
          <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: COLORS.dark, marginBottom: 4, fontFamily: 'Georgia, serif' }}>Nouvel envoi</h2>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Remplissez les informations de l'envoi</div>

          {succes ? (
            <div style={{ background: COLORS.white, borderRadius: 20, padding: isMobile ? 24 : 40, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.dark, marginBottom: 8, fontFamily: 'Georgia, serif' }}>Envoi enregistré</div>
              <div style={{ background: COLORS.foam, borderRadius: 12, padding: '14px 20px', margin: '16px 0' }}>
                <div style={{ fontSize: 11, color: COLORS.mid, textTransform: 'uppercase', letterSpacing: 1.5 }}>Référence</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.ocean, fontFamily: 'monospace', marginTop: 4 }}>{succes.reference}</div>
              </div>
              <div style={{ background: '#E0F5EE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#2EAF7D', marginBottom: 20 }}>
                📱 SMS envoyé au destinataire avec le lien de suivi
              </div>
              {succes.qr_code && <img src={succes.qr_code} alt="QR" style={{ width: 140, height: 140, marginBottom: 20 }} />}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, justifyContent: 'center', marginBottom: 8 }}>
                <button
                  onClick={() => imprimerEtiquette(succes, logoLocal, user.nom)}
                  style={{ background: COLORS.white, color: COLORS.ocean, border: `2px solid ${COLORS.ocean}`, borderRadius: 12, padding: '13px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}
                >
                  🖨️ Imprimer l'étiquette
                </button>
                <button
                  onClick={() => partagerEtiquette(succes, logoLocal, user.nom, () => setPartageRef(succes.reference), () => setPartageRef(null))}
                  disabled={partageRef === succes.reference}
                  style={{ background: partageRef === succes.reference ? '#F0F3F5' : COLORS.white, color: COLORS.lagoon, border: `2px solid ${COLORS.lagoon}`, borderRadius: 12, padding: '13px 22px', fontSize: 14, fontWeight: 700, cursor: partageRef === succes.reference ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}
                >
                  {partageRef === succes.reference ? '⏳ Préparation…' : '📤 Partager l\'étiquette'}
                </button>
                <button onClick={() => setSucces(null)} style={{ background: COLORS.coral, color: COLORS.white, border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                  + Nouvel envoi
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: COLORS.white, borderRadius: 20, padding: isMobile ? 20 : 32, border: `1px solid ${COLORS.border}` }}>

              <div style={{ background: COLORS.foam, borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: COLORS.mid, borderLeft: `3px solid ${COLORS.lagoon}` }}>
                📦 <strong>Destinataire</strong> — La personne qui recevra le colis
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Nom *</label>
                  <input style={inputStyle} value={form.nom_destinataire} onChange={e => setForm({ ...form, nom_destinataire: e.target.value })} placeholder="Mmadi" />
                </div>
                <div>
                  <label style={labelStyle}>Prénom</label>
                  <input style={inputStyle} value={form.prenom_destinataire} onChange={e => setForm({ ...form, prenom_destinataire: e.target.value })} placeholder="Ali" />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Téléphone principal *</label>
                <div style={{ display: 'flex' }}>
                  <SelecteurPays value={paysD1} onChange={setPaysD1} />
                  <input style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }} value={form.telephone_destinataire} onChange={e => setForm({ ...form, telephone_destinataire: e.target.value })} placeholder="0639 XX XX XX" />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Téléphone secondaire (optionnel)</label>
                <div style={{ display: 'flex' }}>
                  <SelecteurPays value={paysD2} onChange={setPaysD2} />
                  <input style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }} value={form.telephone2_destinataire} onChange={e => setForm({ ...form, telephone2_destinataire: e.target.value })} placeholder="0639 XX XX XX" />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Email destinataire (optionnel)</label>
                <input style={inputStyle} type="email" value={form.email_destinataire} onChange={e => setForm({ ...form, email_destinataire: e.target.value })} placeholder="destinataire@email.com" />
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Quartier *</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })}>
                  <option value="">Sélectionnez un quartier...</option>
                  {quartiers.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Type</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { key: 'Colis', icon: '📦', label: 'Colis standard', prix: '5 €' },
                    { key: 'Courrier', icon: '✉️', label: 'Courrier', prix: '3 €' },
                    { key: 'Volumineux', icon: '📫', label: 'Volumineux', prix: 'au poids' },
                  ].map(t => (
                    <div key={t.key} onClick={() => setForm({ ...form, type: t.key, poids: '' })} style={{ flex: 1, minWidth: 100, padding: 12, border: `2px solid ${form.type === t.key ? COLORS.lagoon : COLORS.border}`, borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, color: form.type === t.key ? COLORS.lagoon : '#888', background: form.type === t.key ? COLORS.foam : COLORS.white, fontWeight: form.type === t.key ? 700 : 400 }}>
                      {t.icon} {t.label}<br /><span style={{ fontSize: 11 }}>{t.prix}</span>
                    </div>
                  ))}
                </div>
              </div>

              {form.type === 'Volumineux' && (
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Poids (kg) *</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.poids}
                    onChange={e => setForm({ ...form, poids: e.target.value })}
                    placeholder="ex : 7.5"
                  />
                  {form.poids && parseFloat(form.poids) > 0 && (() => {
                    const prix = calculerPrixVolumineux(form.poids);
                    const poids = parseFloat(form.poids);
                    return (
                      <div style={{ marginTop: 10, background: COLORS.foam, borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${COLORS.lagoon}` }}>
                        <div style={{ fontSize: 12, color: COLORS.mid, fontFamily: 'sans-serif', marginBottom: 4 }}>
                          Prix calculé ({tarifVolumineux.base} € de base{poids > 5 ? ` + ${(poids - 5).toFixed(1)} kg × ${tarifVolumineux.parKg} €/kg` : ''})
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.ocean, fontFamily: 'Georgia, serif' }}>
                          {prix} €
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Notes (optionnel)</label>
                <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Instructions particulières..." />
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, margin: '20px 0' }} />

              <div style={{ background: '#FFF8F0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400E', borderLeft: '3px solid #F59E0B' }}>
                📤 <strong>Expéditeur</strong> — Sera notifié si le colis n'est pas récupéré
              </div>

              <div>
                <label style={labelStyle}>Nom expéditeur *</label>
                <input style={inputStyle} value={form.nom_expediteur} onChange={e => setForm({ ...form, nom_expediteur: e.target.value })} placeholder="Votre nom" />
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Téléphone expéditeur *</label>
                <div style={{ display: 'flex' }}>
                  <SelecteurPays value={paysE} onChange={setPaysE} />
                  <input style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }} value={form.telephone_expediteur} onChange={e => setForm({ ...form, telephone_expediteur: e.target.value })} placeholder="0639 XX XX XX" />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Email expéditeur (optionnel)</label>
                <input style={inputStyle} type="email" value={form.email_expediteur} onChange={e => setForm({ ...form, email_expediteur: e.target.value })} placeholder="expediteur@email.com" />
              </div>

              <button
                onClick={handleEnvoi}
                disabled={chargement || !form.nom_destinataire || !form.telephone_destinataire || !form.quartier || !form.nom_expediteur || !form.telephone_expediteur || (form.type === 'Volumineux' && (!form.poids || parseFloat(form.poids) <= 0))}
                style={{ marginTop: 20, width: '100%', padding: 16, background: (!form.nom_destinataire || !form.telephone_destinataire || !form.quartier || !form.nom_expediteur || !form.telephone_expediteur || (form.type === 'Volumineux' && (!form.poids || parseFloat(form.poids) <= 0))) ? '#CCC' : COLORS.coral, border: 'none', borderRadius: 12, color: COLORS.white, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}
              >
                {chargement ? 'Enregistrement...' : "Enregistrer l'envoi →"}
              </button>
            </div>
          )}
        </div>
      )}

      {onglet === 'colis' && (
        <div>
          <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: COLORS.dark, marginBottom: 20, fontFamily: 'Georgia, serif' }}>Mes colis</h2>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {colis.map(c => {
                const s = statutConfig[c.statut] || statutConfig.en_attente;
                return (
                  <div key={c.id} style={{ background: COLORS.white, borderRadius: 14, padding: '14px 16px', border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, color: COLORS.lagoon, fontWeight: 700 }}>{c.reference}</div>
                      <span style={{ background: s.bg, color: s.color, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.dark }}>{c.nom_destinataire}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <div style={{ fontSize: 12, color: '#888' }}>{c.quartier}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ocean }}>{c.prix}€</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <div style={{ fontSize: 11, color: '#AAA' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => imprimerEtiquette(c, logoLocal, user.nom)}
                        style={{ background: 'transparent', color: COLORS.ocean, border: `1.5px solid ${COLORS.ocean}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif' }}
                      >
                        🖨️
                      </button>
                      <button
                        onClick={() => partagerEtiquette(c, logoLocal, user.nom, () => setPartageRef(c.reference), () => setPartageRef(null))}
                        disabled={partageRef === c.reference}
                        style={{ background: partageRef === c.reference ? '#F0F3F5' : 'transparent', color: COLORS.lagoon, border: `1.5px solid ${COLORS.lagoon}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: partageRef === c.reference ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}
                      >
                        {partageRef === c.reference ? '⏳' : '📤 Partager'}
                      </button>
                    </div>
                  </div>
                  </div>
                );
              })}
              {colis.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#888', background: COLORS.white, borderRadius: 14 }}>Aucun colis enregistré</div>}
            </div>
          ) : (
            <div style={{ background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Référence', 'Destinataire', 'Quartier', 'Type', 'Prix', 'Statut', 'Date', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: '#AAA', textAlign: 'left', letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colis.map((c, i) => {
                    const s = statutConfig[c.statut] || statutConfig.en_attente;
                    return (
                      <tr key={c.id} style={{ borderTop: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : '#FAFBFC' }}>
                        <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: COLORS.ocean, fontWeight: 600 }}>{c.reference}</td>
                        <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: COLORS.dark }}>{c.nom_destinataire}</td>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: '#666' }}>{c.quartier}</td>
                        <td style={{ padding: '13px 16px', fontSize: 12 }}>{c.type === 'Courrier' ? '✉️' : c.type === 'Volumineux' ? '📫' : '📦'} {c.type}</td>
                        <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: COLORS.ocean }}>{c.prix}€</td>
                        <td style={{ padding: '13px 16px' }}><span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.label}</span></td>
                        <td style={{ padding: '13px 16px', fontSize: 11, color: '#AAA' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding: '8px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => imprimerEtiquette(c, logoLocal, user.nom)}
                              style={{ background: 'transparent', color: COLORS.ocean, border: `1.5px solid ${COLORS.ocean}`, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}
                            >
                              🖨️ Étiquette
                            </button>
                            <button
                              onClick={() => partagerEtiquette(c, logoLocal, user.nom, () => setPartageRef(c.reference), () => setPartageRef(null))}
                              disabled={partageRef === c.reference}
                              style={{ background: partageRef === c.reference ? '#F0F3F5' : 'transparent', color: COLORS.lagoon, border: `1.5px solid ${COLORS.lagoon}`, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: partageRef === c.reference ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}
                            >
                              {partageRef === c.reference ? '⏳' : '📤 Partager'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {colis.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Aucun colis enregistré</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
