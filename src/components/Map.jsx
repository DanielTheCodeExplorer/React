// Map.jsx
import { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as EsriLeaflet from 'esri-leaflet';

export default function Map({ center = [9.08, 8.68] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const ngLayerRef = useRef(null);      // Nigeria polygon layer
  const cableLayerRef = useRef(null);   // Submarine cables
  const ngBoundsRef = useRef(null);     // Cached Nigeria bounds

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 5,
      worldCopyJump: true,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
      zoomSnap: 0.25,
      maxZoom: 20,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 1,
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const renderer = L.svg().addTo(map);

    // Load Nigeria once; cache layer + bounds
    const url = `${import.meta?.env?.BASE_URL ?? '/'}nigeria.geojson`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(geo => {
        const ng = L.geoJSON(geo, {
          renderer,
          style: { color: '#444', weight: 1, fillOpacity: 0.15 },
        });
        const b = ng.getBounds();
        ngLayerRef.current = ng;      // don't add yet; add only in Nigeria mode
        ngBoundsRef.current = b.isValid() ? b : null;
        // Optional: start in last saved mode
        applyMode(localStorage.getItem('viewMode') || 'Grand Scheme');
      })
      .catch(() => {
        // If NG fails to load, still apply mode (will just skip NG focus)
        applyMode(localStorage.getItem('viewMode') || 'Grand Scheme');
      });

    // Cable layer factory
    const addCables = () => {
      if (cableLayerRef.current) return cableLayerRef.current;
      const layer = EsriLeaflet.featureLayer({
        url: 'https://services.arcgis.com/bDAhvQYMG4WL8O5o/arcgis/rest/services/Global_Submarine_Cable_Map/FeatureServer/1',
        onEachFeature: (feature, layer) => {
          layer.bindPopup(feature?.properties?.Name || 'Cable');
        },
        style: () => ({
          color: '#02327aff',
          weight: 2,
          opacity: 0.9,
          dashArray: '4 2',
        }),
      });
      cableLayerRef.current = layer;
      return layer;
    };

    // ----- Mode applier -----
    function applyMode(mode) {
      if (!mapRef.current) return;
      const map = mapRef.current;

      // reset bounds lock
      map.setMaxBounds(null);

      if (mode === 'Grand Scheme') {
        // remove Nigeria layer if present
        if (ngLayerRef.current && map.hasLayer(ngLayerRef.current)) {
          map.removeLayer(ngLayerRef.current);
        }
        // ensure cables are visible
        const cables = addCables();
        if (!map.hasLayer(cables)) cables.addTo(map);

        // normal zoom out (no fancy animation)
        map.stop();
        map.invalidateSize();
        map.setView([0, 0], 3, { animate: false }); // or map.fitWorld()
      } else if (mode === 'Nigeria Focus') {
        // remove cables
        if (cableLayerRef.current && map.hasLayer(cableLayerRef.current)) {
          map.removeLayer(cableLayerRef.current);
        }
        // add Nigeria layer
        if (ngLayerRef.current && !map.hasLayer(ngLayerRef.current)) {
          ngLayerRef.current.addTo(map);
        }

        // focus Nigeria (animated fly like before)
        const b = ngBoundsRef.current;
        const c = b ? b.getCenter() : L.latLng(9.0820, 8.6753);
        map.stop();
        map.invalidateSize();
        map.setView([0, 0], 2, { animate: false });
        setTimeout(() => {
          map.flyTo(c, 6.5, { duration: 2, easeLinearity: 0.2, animate: true });
        }, 300);
        if (b) {
          map.once('moveend', () => {
            setTimeout(() => map.setMaxBounds(b.pad(0.2)), 100);
          });
        }
      }
    }

    // Listen to footer events
    const onMode = (e) => applyMode(e.detail);
    window.addEventListener('viewmode:change', onMode);

    // Apply initial mode if footer hasn’t fired yet
    applyMode(localStorage.getItem('viewMode') || 'Grand Scheme');

    return () => {
      window.removeEventListener('viewmode:change', onMode);
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, [center]);

  return <div ref={containerRef} className="h-screen w-screen rounded-lg overflow-hidden bg-slate-800" />;
}
