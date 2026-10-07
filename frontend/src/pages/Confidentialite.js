export default function Confidentialite() {
  const sections = [
    {
      num: '1', title: 'Qui sommes-nous ?',
      content: (
        <>
          <p>MayRelay est une plateforme de points relais à Mayotte permettant l'envoi et la réception de colis et courriers via un réseau de commerces partenaires.</p>
          <p><strong>Responsable du traitement :</strong> El-Farouk MOHAMED ALI</p>
          <p><strong>Contact :</strong> contact@mayrelay.yt</p>
          <p><strong>Site web :</strong> mayrelay.vercel.app</p>
        </>
      )
    },
    {
      num: '2', title: 'Données collectées',
      content: (
        <ul>
          <li><strong>Expéditeurs :</strong> Nom et prénom, numéro de téléphone</li>
          <li><strong>Destinataires :</strong> Nom et prénom, numéro de téléphone, adresse (optionnelle), quartier/zone</li>
          <li><strong>Partenaires et livreurs :</strong> Nom et prénom, email, numéro de téléphone, zone de couverture, coordonnées GPS (livreurs uniquement, en temps réel pendant les missions)</li>
        </ul>
      )
    },
    {
      num: '3', title: 'Pourquoi on collecte ces données',
      content: (
        <ul>
          <li>Assurer l'acheminement et la livraison des colis</li>
          <li>Notifier par SMS</li>
          <li>Permettre le suivi</li>
          <li>Gérer les paiements entre partenaires et livreurs</li>
        </ul>
      )
    },
    {
      num: '4', title: 'Base légale',
      content: (
        <ul>
          <li>Exécution d'un contrat</li>
          <li>Intérêt légitime</li>
          <li>Consentement pour les SMS</li>
        </ul>
      )
    },
    {
      num: '5', title: 'Durée de conservation',
      content: (
        <ul>
          <li>Données de colis : 3 ans après livraison</li>
          <li>Données partenaires/livreurs : durée relation commerciale + 3 ans</li>
          <li>Géolocalisation : supprimée 30 minutes après fin de mission</li>
        </ul>
      )
    },
    {
      num: '6', title: 'Qui a accès',
      content: (
        <>
          <ul>
            <li>Administrateur MayRelay</li>
            <li>Partenaire expéditeur (ses colis uniquement)</li>
            <li>Partenaire récepteur (colis à remettre uniquement)</li>
            <li>Livreur assigné (nom et zone uniquement)</li>
          </ul>
          <p>Les données ne sont jamais vendues à des tiers.</p>
        </>
      )
    },
    {
      num: '7', title: 'Sous-traitants et transferts',
      content: (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F4F7FA' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Prestataire</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Rôle</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Lieu</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Garantie</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Railway</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Backend & base de données</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>EU West — Amsterdam</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Conforme RGPD</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Vercel</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Hébergement site web</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>USA</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>CCT (clauses contractuelles types)</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px' }}>Twilio</td>
                <td style={{ padding: '8px 12px' }}>Envoi SMS</td>
                <td style={{ padding: '8px 12px' }}>USA</td>
                <td style={{ padding: '8px 12px' }}>CCT (clauses contractuelles types)</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 12 }}>Les transferts vers les États-Unis sont encadrés par des clauses contractuelles types approuvées par la Commission Européenne.</p>
        </>
      )
    },
    {
      num: '8', title: 'Sécurité',
      content: (
        <ul>
          <li>Chiffrement HTTPS</li>
          <li>Authentification JWT avec expiration</li>
          <li>Mots de passe hashés</li>
          <li>Accès restreint par rôle</li>
        </ul>
      )
    },
    {
      num: '9', title: 'Mineurs',
      content: <p>Service destiné aux personnes majeures (18 ans et plus). Aucune collecte de données concernant des mineurs n'est effectuée intentionnellement.</p>
    },
    {
      num: '10', title: 'Vos droits RGPD',
      content: (
        <>
          <p>Vous disposez des droits suivants concernant vos données personnelles :</p>
          <ul>
            <li>Droit d'accès</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement</li>
            <li>Droit d'opposition</li>
            <li>Droit à la portabilité</li>
          </ul>
          <p>Pour exercer ces droits, contactez-nous à <strong>contact@mayrelay.yt</strong>. Réponse sous 30 jours.</p>
        </>
      )
    },
    {
      num: '11', title: 'Cookies',
      content: <p>Uniquement des cookies techniques d'authentification. Aucun cookie publicitaire ou de tracking n'est utilisé.</p>
    },
    {
      num: '12', title: 'Modifications',
      content: <p>Vous serez informé par SMS ou email au moins 15 jours avant tout changement important apporté à cette politique.</p>
    },
    {
      num: '13', title: 'Contact et réclamations',
      content: (
        <>
          <p><strong>Email :</strong> contact@mayrelay.yt</p>
          <p><strong>CNIL :</strong> www.cnil.fr — 3 Place de Fontenoy, 75007 Paris</p>
        </>
      )
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
          Politique de Confidentialité
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

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
          © 2026 MayRelay — contact@mayrelay.yt
        </div>
      </div>

      <style>{`
        ul { margin: 8px 0; padding-left: 20px; }
        li { margin-bottom: 4px; }
        p { margin: 6px 0; }
        strong { color: #1F2937; }
      `}</style>
    </div>
  );
}
