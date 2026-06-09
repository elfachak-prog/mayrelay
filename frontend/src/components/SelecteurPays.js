const PAYS = [
  { code: '+262', nom: 'Mayotte', flag: '🇾🇹', exemple: '0639 XX XX XX' },
  { code: '+33', nom: 'France', flag: '🇫🇷', exemple: '06 XX XX XX XX' },
  { code: '+269', nom: 'Comores', flag: '🇰🇲', exemple: '3XX XX XX' },
  { code: '+261', nom: 'Madagascar', flag: '🇲🇬', exemple: '032 XX XX XX' },
  { code: '+262', nom: 'Réunion', flag: '🇷🇪', exemple: '0692 XX XX XX' },
  { code: '+230', nom: 'Maurice', flag: '🇲🇺', exemple: '5XXX XXXX' },
  { code: '+255', nom: 'Tanzanie', flag: '🇹🇿', exemple: '07XX XXX XXX' },
  { code: '+254', nom: 'Kenya', flag: '🇰🇪', exemple: '07XX XXX XXX' },
];

export default function SelecteurPays({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '11px 10px', border: '1.5px solid #E2E8EE', borderRadius: '10px 0 0 10px', fontSize: 14, color: '#0D1F2D', outline: 'none', background: '#FAFBFC', cursor: 'pointer', borderRight: 'none' }}>
      {PAYS.map(p => (
        <option key={p.code + p.nom} value={p.code}>
          {p.flag} {p.nom} ({p.code})
        </option>
      ))}
    </select>
  );
}
