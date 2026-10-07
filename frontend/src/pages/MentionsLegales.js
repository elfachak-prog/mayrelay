export default function MentionsLegales() {
  const sections = [
    {
      num: '1', title: 'Éditeur du site',
      content: (
        <>
          <p><strong>Nom :</strong> MayRelay</p>
          <p><strong>Responsable :</strong> El-Farouk MOHAMED ALI</p>
          <p><strong>Email :</strong> contact@mayrelay.yt</p>
          <p><strong>Site web :</strong> mayrelay.vercel.app</p>
          <p><strong>Territoire :</strong> Mayotte (976)</p>
        </>
      )
    },
    {
      num: '2', title: 'Hébergement',
      content: (
        <ul>
          <li><strong>Frontend :</strong> Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis — www.vercel.com</li>
          <li><strong>Backend et base de données :</strong> Railway Corporation — EU West Amsterdam, Pays-Bas — www.railway.app</li>
        </ul>
      )
    },
    {
      num: '3', title: 'Propriété intellectuelle',
      content: <p>Le contenu du site (textes, logos, images, interface) est la propriété exclusive de MayRelay. Toute reproduction sans autorisation écrite est interdite.</p>
    },
    {
      num: '4', title: 'Responsabilité',
      content: (
        <>
          <p>MayRelay s'engage à assurer la disponibilité de la plateforme mais ne peut être tenu responsable en cas d'interruption due à des causes extérieures.</p>
          <p>MayRelay ne peut être tenu responsable des dommages liés à la perte ou détérioration d'un colis pendant le transport.</p>
        </>
      )
    },
    {
      num: '5', title: 'Service SMS',
      content: <p>Notifications SMS via <strong>Twilio Inc.</strong> — 375 Beale Street, Suite 300, San Francisco, CA 94105, États-Unis — www.twilio.com</p>
    },
    {
      num: '6', title: 'Données personnelles',
      content: (
        <p>
          Traitement détaillé dans la{' '}
          <a href="/confidentialite" style={{ color: '#E8613A', textDecoration: 'none', fontWeight: 600 }}>Politique de Confidentialité</a>.
        </p>
      )
    },
    {
      num: '7', title: 'Droit applicable',
      content: <p>Ces mentions légales sont soumises au droit français. En cas de litige, les tribunaux français sont compétents.</p>
    },
    {
      num: '8', title: 'Contact',
      content: <p><strong>Email :</strong> contact@mayrelay.yt</p>
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FA', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0D1F2D', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ color: '#4A7B94', fontSize: 13, textDecoration: 'none' }}>← Retour</a>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>🏝️ MayRelay</div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 60px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0D1F2D', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
          Mentions Légales
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 40 }}>Dernière mise à jour : octobre 2026</p>

        {sections.map(s => (
          <div key={s.num} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0D1F2D', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#0D1F2D', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.num}</span>
              {s.title}
            </h2>
            <div style={{ color: '#374151', fontSize: 15, lineHeight: 1.7, paddingLeft: 4 }}>
              {s.content}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
          © 2026 MayRelay — contact@mayrelay.yt
        </div>
      </div>

      <style>{`
        ul { margin: 8px 0; padding-left: 20px; }
        li { margin-bottom: 6px; }
        p { margin: 6px 0; }
        strong { color: #1F2937; }
      `}</style>
    </div>
  );
}
