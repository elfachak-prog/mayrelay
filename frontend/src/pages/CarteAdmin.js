import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../services/api';

// Mayotte centre
const MAYOTTE = { lat: -12.8275, lng: 45.1662, zoom: 11 };

const C = {
  white: '#FFFFFF', navy: '#0B1F3A', teal: '#0E9F8E',
  green: '#10B981', blue: '#3B82F6', border: '#E2E8F0', muted: '#94A3B8',
};

function creerIconePartenaire() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:#10B981;border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function creerIconeLivreur() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:#3B82F6;border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

export default function CarteAdmin() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      const res = await API.get('/admin/carte');
      setData(res.data);
      setErreur('');
    } catch {
      setErreur('Impossible de charger les données de la carte');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // Initialise la carte une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [MAYOTTE.lat, MAYOTTE.lng],
      zoom: MAYOTTE.zoom,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Recalcule la taille de la carte quand le conteneur devient visible
  useEffect(() => {
    if (!mapRef.current || chargement || erreur) return;
    mapRef.current.invalidateSize();
  }, [chargement, erreur]);

  // Met à jour les marqueurs quand les données arrivent
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;

    // Nettoie les anciens marqueurs
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    data.partenaires.forEach(p => {
      const m = L.marker([p.latitude, p.longitude], { icon: creerIconePartenaire() })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px">
            <div style="font-weight:700;color:#0B1F3A;margin-bottom:4px">${p.nom}</div>
            ${p.zone ? `<div style="font-size:11px;color:#666">Zone : ${p.zone}</div>` : ''}
            ${p.adresse ? `<div style="font-size:11px;color:#666">📍 ${p.adresse}</div>` : ''}
          </div>
        `);
      markersRef.current.push(m);
    });

    data.livreurs.forEach(l => {
      const depuis = l.position_updated_at
        ? new Date(l.position_updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : '?';
      const m = L.marker([l.latitude, l.longitude], { icon: creerIconeLivreur() })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px">
            <div style="font-weight:700;color:#0B1F3A;margin-bottom:4px">🛵 ${l.nom}</div>
            ${l.zone ? `<div style="font-size:11px;color:#666">Zone : ${l.zone}</div>` : ''}
            ${l.vehicule ? `<div style="font-size:11px;color:#666">Véhicule : ${l.vehicule}</div>` : ''}
            <div style="font-size:11px;color:#0E9F8E;margin-top:4px">Mis à jour à ${depuis}</div>
          </div>
        `);
      markersRef.current.push(m);
    });
  }, [data]);

  const nbPartenaires = data?.partenaires?.length ?? 0;
  const nbLivreurs = data?.livreurs?.length ?? 0;

  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0 }}>
          Carte du réseau
        </h2>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2, fontFamily: 'sans-serif' }}>
          Partenaires actifs et livreurs en ligne
        </div>
      </div>

      {/* Compteur + légende */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16,
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: C.green, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif' }}>
              {nbPartenaires} point{nbPartenaires !== 1 ? 's' : ''} relais actif{nbPartenaires !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: C.blue, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'sans-serif' }}>
              {nbLivreurs} livreur{nbLivreurs !== 1 ? 's' : ''} en ligne
            </span>
          </div>
        </div>
        <button
          onClick={() => { setChargement(true); charger(); }}
          style={{
            background: 'transparent', border: `1px solid ${C.teal}`, borderRadius: 8,
            color: C.teal, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            padding: '8px 16px', fontFamily: 'sans-serif',
          }}
        >
          ↻ Actualiser
        </button>
      </div>

      {/* Carte */}
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        {chargement && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: C.muted, fontFamily: 'sans-serif', fontSize: 13 }}>
            Chargement de la carte...
          </div>
        )}
        {erreur && !chargement && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#EF4444', fontFamily: 'sans-serif', fontSize: 13 }}>
            {erreur}
          </div>
        )}
        <div
          ref={containerRef}
          style={{ height: 520, width: '100%', display: chargement || erreur ? 'none' : 'block' }}
        />

        {/* Légende en bas de la carte */}
        {!chargement && !erreur && (
          <div style={{
            padding: '10px 20px', borderTop: `1px solid ${C.border}`,
            display: 'flex', gap: 24, fontSize: 12, fontFamily: 'sans-serif', color: '#555',
            background: '#FAFBFC',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
              Point relais actif
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.blue, display: 'inline-block' }} />
              Livreur en ligne (position &lt; 30 min)
            </span>
            <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 11 }}>
              Cliquez sur un marqueur pour les détails
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
