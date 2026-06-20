import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAYOTTE = { lat: -12.8275, lng: 45.1662, zoom: 11 };

const C = {
  card: "#1E3040", border: "#263D50", blue: "#3A9FE8",
  orange: "#F5A623", white: "#FFFFFF", muted: "#6B8FA8",
};

function iconePartenaire(count) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:${C.orange};border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;color:#000;
      font-family:sans-serif;
    ">${count}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function iconeLivreur() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:${C.blue};border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
}

export default function CarteMissions({ missions, positionLivreur }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Initialise la carte une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [MAYOTTE.lat, MAYOTTE.lng],
      zoom: MAYOTTE.zoom,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright" style="color:#6B8FA8">OSM</a>',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Met à jour les marqueurs quand missions ou position changent
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = [];

    // Marqueur livreur
    if (positionLivreur?.lat && positionLivreur?.lng) {
      const m = L.marker([positionLivreur.lat, positionLivreur.lng], { icon: iconeLivreur() })
        .addTo(map)
        .bindPopup('<div style="font-family:sans-serif;font-weight:700;color:#0B1F3A">🛵 Votre position</div>');
      markersRef.current.push(m);
      bounds.push([positionLivreur.lat, positionLivreur.lng]);
    }

    // Grouper les missions par point relais départ
    const groupes = {};
    missions.forEach(mission => {
      const id = mission.partenaire_depart_id;
      const lat = parseFloat(mission.lat_depart);
      const lng = parseFloat(mission.lng_depart);
      if (!id || isNaN(lat) || isNaN(lng)) return;
      if (!groupes[id]) {
        groupes[id] = {
          lat,
          lng,
          nom: mission.partenaire_depart,
          adresse: mission.adresse_depart,
          colis: [],
        };
      }
      groupes[id].colis.push(mission);
    });

    Object.values(groupes).forEach(({ lat, lng, nom, adresse, colis }) => {
      const count = colis.length;
      const refs = colis.map(c => `<span style="font-family:monospace;color:#F5A623">${c.reference}</span>`).join(', ');
      const m = L.marker([lat, lng], { icon: iconePartenaire(count) })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px">
            <div style="font-weight:700;color:#0B1F3A;margin-bottom:4px">${nom}</div>
            ${adresse ? `<div style="font-size:11px;color:#666;margin-bottom:6px">📍 ${adresse}</div>` : ''}
            <div style="font-size:12px;color:#0B1F3A;font-weight:600;margin-bottom:4px">
              ${count} colis à récupérer
            </div>
            <div style="font-size:11px;color:#555">${refs}</div>
          </div>
        `);
      markersRef.current.push(m);
      bounds.push([lat, lng]);
    });

    if (bounds.length >= 2) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 13 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    }
  }, [missions, positionLivreur]);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <div style={{
        background: C.card, padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'sans-serif' }}>
          🗺️ Points relais avec colis à récupérer
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'sans-serif' }}>
          <span style={{ color: C.blue, fontWeight: 700 }}>● Vous</span>
          <span style={{ color: C.orange, fontWeight: 700 }}>● Point relais</span>
        </div>
      </div>
      <div ref={containerRef} style={{ height: 240, width: '100%' }} />
    </div>
  );
}
