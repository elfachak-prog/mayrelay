export default function CGU() {
  const sections = [
    {
      num: '1', title: 'Objet',
      content: (
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme
          MayRelay, service de consignes colis connectées opéré par <strong>El-Farouk MOHAMED ALI</strong> à Mayotte (976).
          Toute utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGU.
        </p>
      )
    },
    {
      num: '2', title: 'Définitions',
      content: (
        <ul>
          <li><strong>Plateforme :</strong> l'application web et les interfaces associées accessibles sur mayrelay.vercel.app.</li>
          <li><strong>Partenaire :</strong> toute entreprise ou personne physique ayant souscrit à un abonnement MayRelay pour déposer et gérer des colis.</li>
          <li><strong>Livreur :</strong> agent habilité à déposer ou retirer des colis dans les consignes MayRelay.</li>
          <li><strong>Destinataire :</strong> toute personne physique désignée pour retirer un colis via un code ou un lien de suivi.</li>
          <li><strong>Casier :</strong> unité physique ou virtuelle de stockage temporaire d'un colis géré par MayRelay.</li>
        </ul>
      )
    },
    {
      num: '3', title: 'Accès à la plateforme',
      content: (
        <>
          <p>
            L'accès à la plateforme est réservé aux Partenaires et Livreurs disposant d'un compte actif créé par
            l'administrateur MayRelay. Les identifiants sont personnels et confidentiels ; le Partenaire est seul
            responsable de leur conservation.
          </p>
          <p>
            MayRelay se réserve le droit de suspendre ou de résilier tout compte en cas de non-respect des présentes CGU
            ou de comportement frauduleux, sans préavis ni indemnité.
          </p>
        </>
      )
    },
    {
      num: '4', title: 'Utilisation des casiers et gestion des colis',
      content: (
        <>
          <p>
            Chaque colis déposé dans un casier MayRelay est enregistré et tracé via la plateforme. Le Partenaire s'engage
            à renseigner des informations exactes (coordonnées du destinataire, description du colis) lors de chaque envoi.
          </p>
          <p>
            MayRelay notifie automatiquement le destinataire par SMS ou lien de suivi. La durée maximale de stockage est
            définie dans le contrat de service ; au-delà, MayRelay peut procéder au retrait du colis sans engagement de
            responsabilité.
          </p>
          <p>
            Il est interdit de déposer dans les casiers tout objet illicite, dangereux, périssable, ou contraire à la
            réglementation en vigueur à Mayotte et en France métropolitaine.
          </p>
        </>
      )
    },
    {
      num: '5', title: 'Obligations du Partenaire',
      content: (
        <ul>
          <li>Utiliser la plateforme conformément à sa destination et aux présentes CGU.</li>
          <li>Ne pas tenter d'accéder à des données ou fonctionnalités non autorisées.</li>
          <li>Informer MayRelay sans délai de tout incident (colis manquant, erreur de destinataire, problème technique).</li>
          <li>Régler les abonnements et frais associés dans les délais convenus.</li>
          <li>S'assurer que les destinataires sont correctement informés du fonctionnement de la consigne.</li>
        </ul>
      )
    },
    {
      num: '6', title: 'Tarifs et paiements',
      content: (
        <>
          <p>
            L'accès aux fonctionnalités de la plateforme est soumis à un abonnement mensuel dont le montant est précisé
            lors de l'inscription ou dans le contrat de service signé avec MayRelay.
          </p>
          <p>
            Les paiements sont effectués selon les modalités convenues (virement, mobile money, etc.). En cas de retard
            de paiement, MayRelay se réserve le droit de suspendre l'accès au compte dans un délai de 15 jours après
            mise en demeure restée sans réponse.
          </p>
          <p>
            Toute contestation de facturation doit être adressée à <strong>contact@mayrelay.yt</strong> dans un délai
            de 30 jours suivant l'émission de la facture.
          </p>
        </>
      )
    },
    {
      num: '7', title: 'Responsabilités et limitations',
      content: (
        <>
          <p>
            MayRelay s'engage à assurer la disponibilité de la plateforme et la bonne gestion des casiers, mais ne peut
            être tenu responsable :
          </p>
          <ul>
            <li>des dommages résultant d'une interruption de service liée à des causes extérieures (maintenance, force majeure, panne hébergeur) ;</li>
            <li>de la perte, de la détérioration ou du vol d'un colis imputable à un tiers ou au Partenaire ;</li>
            <li>d'une mauvaise utilisation des identifiants par le Partenaire.</li>
          </ul>
          <p>
            En tout état de cause, la responsabilité de MayRelay est limitée au montant des sommes versées par le
            Partenaire au cours des 3 derniers mois précédant le sinistre.
          </p>
        </>
      )
    },
    {
      num: '8', title: 'Propriété intellectuelle',
      content: (
        <p>
          L'ensemble des éléments de la plateforme MayRelay (marque, logo, interface, code source, contenus) est la
          propriété exclusive de MayRelay. Toute reproduction, modification ou exploitation partielle ou totale sans
          autorisation écrite préalable est strictement interdite et susceptible de poursuites judiciaires.
        </p>
      )
    },
    {
      num: '9', title: 'Protection des données personnelles',
      content: (
        <p>
          MayRelay collecte et traite des données personnelles conformément au Règlement Général sur la Protection des
          Données (RGPD) et à la loi Informatique et Libertés. Le détail des traitements, les droits des personnes
          concernées et les coordonnées du responsable de traitement sont disponibles dans la{' '}
          <a href="/confidentialite" style={{ color: '#E8613A', textDecoration: 'none', fontWeight: 600 }}>
            Politique de Confidentialité
          </a>.
        </p>
      )
    },
    {
      num: '10', title: 'Droit applicable et litiges',
      content: (
        <>
          <p>
            Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou à leur
            exécution sera soumis à la compétence exclusive des tribunaux français, après tentative de résolution amiable.
          </p>
          <p>
            Pour toute réclamation, contacter MayRelay à l'adresse <strong>contact@mayrelay.yt</strong>. En cas d'échec
            de la résolution amiable dans un délai de 60 jours, les parties pourront saisir le tribunal compétent de
            Mamoudzou (Mayotte).
          </p>
          <p>
            MayRelay se réserve le droit de modifier les présentes CGU à tout moment. Les Partenaires seront informés de
            toute modification substantielle par email et les nouvelles conditions prendront effet 30 jours après
            notification.
          </p>
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
          Conditions Générales d'Utilisation
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 40 }}>Dernière mise à jour : novembre 2026</p>

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
