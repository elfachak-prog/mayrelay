import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const C = {
  card: "#1E3040", border: "#263D50", accent: "#F5A623",
  green: "#27C97A", blue: "#3A9FE8", muted: "#6B8FA8", white: "#FFFFFF",
};

export default function MapItineraire({ positionLivreur, destination }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const livreurMarkerRef = useRef(null);
  const initDoneRef = useRef(false);
  const [infos, setInfos] = useState(null);
  const [routeEtat, setRouteEtat] = useState('idle'); // idle | loading | ok | erreur

  // Initialise la carte une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright" style="color:#6B8FA8">OSM</a>',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      livreurMarkerRef.current = null;
      initDoneRef.current = false;
    };
  }, []);

  // Met à jour le marqueur livreur en temps réel
  useEffect(() => {
    if (!mapRef.current || !positionLivreur) return;
    if (livreurMarkerRef.current) {
      livreurMarkerRef.current.setLatLng([positionLivreur.lat, positionLivreur.lng]);
    } else {
      livreurMarkerRef.current = L.circleMarker(
        [positionLivreur.lat, positionLivreur.lng],
        { radius: 9, fillColor: C.blue, color: '#fff', weight: 3, fillOpacity: 1 }
      ).addTo(mapRef.current).bindPopup('Vous êtes ici');
    }
  }, [positionLivreur]);

  // Place le marqueur destination + trace l'itinéraire (une seule fois)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !positionLivreur || !destination?.lat || !destination?.lng) return;
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    L.circleMarker([destination.lat, destination.lng], {
      radius: 9, fillColor: C.green, color: '#fff', weight: 3, fillOpacity: 1,
    }).addTo(map).bindPopup(destination.nom || 'Destination');

    map.fitBounds(
      L.latLngBounds(
        [positionLivreur.lat, positionLivreur.lng],
        [destination.lat, destination.lng]
      ),
      { padding: [55, 55] }
    );

    setRouteEtat('loading');
    fetch(
      `https://router.project-osrm.org/route/v1/driving/` +
      `${positionLivreur.lng},${positionLivreur.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=geojson`
    )
      .then(r => r.json())
      .then(data => {
        if (!data.routes?.[0]) { setRouteEtat('erreur'); return; }
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        L.polyline(coords, { color: C.blue, weight: 5, opacity: 0.85 }).addTo(map);
        setInfos({
          distance: (data.routes[0].distance / 1000).toFixed(1),
          duree: Math.round(data.routes[0].duration / 60),
        });
        setRouteEtat('ok');
      })
      .catch(() => setRouteEtat('erreur'));
  }, [positionLivreur, destination]);

  if (!positionLivreur) {
    return (
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>📍</div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>En attente du signal GPS...</div>
      </div>
    );
  }

  if (!destination?.lat || !destination?.lng) {
    return (
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 14, textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: 'sans-serif' }}>Coordonnées du point relais non renseignées</div>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 12 }}>
      {/* Barre de titre + infos itinéraire */}
      <div style={{ background: C.card, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: 'sans-serif' }}>🗺️ Itinéraire</div>
        <div style={{ fontSize: 12, fontFamily: 'sans-serif' }}>
          {routeEtat === 'ok' && infos && (
            <span style={{ display: 'flex', gap: 14 }}>
              <span style={{ color: C.accent, fontWeight: 700 }}>{infos.distance} km</span>
              <span style={{ color: C.muted }}>~{infos.duree} min</span>
            </span>
          )}
          {routeEtat === 'loading' && <span style={{ color: C.muted }}>Calcul...</span>}
          {routeEtat === 'erreur' && <span style={{ color: C.muted }}>Itinéraire indisponible</span>}
        </div>
      </div>

      {/* Carte */}
      <div ref={containerRef} style={{ height: 260, width: '100%' }} />

      {/* Légende */}
      <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '8px 16px', display: 'flex', gap: 18, fontSize: 11, fontFamily: 'sans-serif' }}>
        <span style={{ color: C.blue, fontWeight: 700 }}>● Vous</span>
        <span style={{ color: C.green, fontWeight: 700 }}>● {destination.nom || 'Destination'}</span>
      </div>
    </div>
  );
}
