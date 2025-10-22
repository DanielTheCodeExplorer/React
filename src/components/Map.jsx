// Map.jsx
import { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as EsriLeaflet from 'esri-leaflet';

export default function Map({ center = [9.08, 8.68] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

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

    // Base map (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 1,
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const renderer = L.svg().addTo(map);
    const ctrl = new AbortController();
    let destroyed = false;

    const url = `${import.meta?.env?.BASE_URL ?? '/'}nigeria.geojson`;

    function flyToNigeria(bounds) {
      const c = bounds.getCenter();
      map.stop();
      map.invalidateSize();
      map.setView([0, 0], 2, { animate: false });

      setTimeout(() => {
        if (destroyed) return;
        map.flyTo(c, 6.5, { duration: 2, easeLinearity: 0.2, animate: true });
      }, 300);

      map.once('moveend', () => {
        setTimeout(() => {
          if (!destroyed) map.setMaxBounds(bounds.pad(0.2));
        }, 100);
      });
    }

    map.whenReady(() => {
      // Load Nigeria GeoJSON
      fetch(url, { signal: ctrl.signal })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(geo => {
          if (destroyed) return;
          const ng = L.geoJSON(geo, {
            renderer,
            style: { color: '#444', weight: 1, fillOpacity: 0.15 },
          }).addTo(map);
          const b = ng.getBounds();
          if (b.isValid()) flyToNigeria(b);
        })
        .catch(() => {
          if (!destroyed) map.setView(center, 6.5, { animate: true });
        });

      // 🌍 Add Submarine Cable Layer
      EsriLeaflet.featureLayer({
        url: 'https://services.arcgis.com/bDAhvQYMG4WL8O5o/arcgis/rest/services/Global_Submarine_Cable_Map/FeatureServer/1',
        onEachFeature: (feature, layer) => {
          layer.bindPopup(feature.properties.Name);
        },
        style: () => ({
          color: '#02327aff',  // line color
          weight: 2,           // line thickness
          opacity: 0.9,        // transparency
          dashArray: '4 2',    // dashed line
        }),
      }).addTo(map);
    });

    return () => {
      destroyed = true;
      ctrl.abort();
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  return (
    <div
      ref={containerRef}
      className="h-[85vh] w-screen rounded-lg overflow-hidden bg-slate-800"
    />
  );
}
