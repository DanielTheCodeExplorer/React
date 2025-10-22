// Map.jsx
import { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as EsriLeaflet from 'esri-leaflet';

export default function Map({ center = [9.08, 8.68], redDot = null }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const ngLayerRef = useRef(null);
  const cableLayerRef = useRef(null);
  const ngBoundsRef = useRef(null);

  // NEW: multiple red dots
  const redDotsRef = useRef([]);          // Array<L.CircleMarker>
  const placingRef = useRef(false);       // press T to toggle

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 5,
      worldCopyJump: false,
      maxBoundsViscosity: 0.2,
      zoomSnap: 0.25,
      maxZoom: 20,
    });
    mapRef.current = map;

    // Base map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      noWrap: true,
      continuousWorld: false,
      minZoom: 1,
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const renderer = L.svg().addTo(map);

    // --- helpers for red dots ---
    const addRedDot = (latlng) => {
      const dot = L.circleMarker(latlng, {
        radius: 6,
        color: '#A78BFA',
        fillColor: '#A78BFA',
        fillOpacity: 1,
        opacity: 1,
        pane: 'markerPane',
      }).addTo(map);
      dot.bringToFront();
      redDotsRef.current.push(dot);
      return dot;
    };

    const hideRedDots = () => {
      redDotsRef.current.forEach((d) => d.setStyle({ opacity: 0, fillOpacity: 0 }));
    };
    const showRedDots = () => {
      redDotsRef.current.forEach((d) => d.setStyle({ opacity: 1, fillOpacity: 1 }));
    };

    // If a single redDot prop was provided initially, add it as the first dot
    if (redDot && Array.isArray(redDot) && redDot.length === 2) {
      addRedDot(redDot);
    }

    // --- place/move: press T to arm, then click map to add multiple dots ---
    const updateCursor = () => {
      if (containerRef.current)
        containerRef.current.style.cursor = placingRef.current ? 'crosshair' : '';
    };

    const onKeyDown = (e) => {
      if (e.key === 't' || e.key === 'T') {
        placingRef.current = !placingRef.current;
        updateCursor();
      }
    };

    const onMapClick = (e) => {
      if (!placingRef.current) return;
      addRedDot(e.latlng);
      // keep placing mode ON so you can add many dots; press T again to exit
    };

    window.addEventListener('keydown', onKeyDown);
    map.on('click', onMapClick);

    // --- Cable Layer Factory ---
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

    // --- Main Mode Switcher (with 0.3s delay + hide/show red dots) ---
    function applyMode(mode) {
      if (!mapRef.current) return;
      const map = mapRef.current;
      map.setMaxBounds(null);

      if (mode === 'Grand Scheme') {
        if (ngLayerRef.current && map.hasLayer(ngLayerRef.current)) {
          map.removeLayer(ngLayerRef.current);
        }
        const cables = addCables();
        if (!map.hasLayer(cables)) cables.addTo(map);

        map.stop();
        map.invalidateSize();
        map.setView([10, 0], 2, { animate: true });

        // ensure dots are visible after any prior hide
        map.once('moveend', showRedDots);
      } else if (mode === 'Nigeria Focus') {
        if (cableLayerRef.current && map.hasLayer(cableLayerRef.current)) {
          map.removeLayer(cableLayerRef.current);
        }
        if (ngLayerRef.current && !map.hasLayer(ngLayerRef.current)) {
          ngLayerRef.current.addTo(map);
        }

        const b = ngBoundsRef.current;
        const c = b ? b.getCenter() : L.latLng(9.0820, 8.6753);

        map.stop();
        map.invalidateSize();
        map.setView([0, 0], 2, { animate: false });

        // Wait 0.3s, then hide dots, then animate, then show on moveend
        setTimeout(() => {
          hideRedDots();

          map.once('moveend', () => {
            showRedDots();
          });

          map.flyTo(c, 6.5, { duration: 2, easeLinearity: 0.2, animate: true });
        }, 300);
      }
    }

    // --- Load Nigeria GeoJSON then apply initial mode ---
    const url = `${import.meta?.env?.BASE_URL ?? '/'}nigeria.geojson`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((geo) => {
        const ng = L.geoJSON(geo, {
          renderer,
          style: { color: '#444', weight: 1, fillOpacity: 0.15 },
        });
        ngLayerRef.current = ng;
        const b = ng.getBounds();
        ngBoundsRef.current = b.isValid() ? b : null;
        applyMode(localStorage.getItem('viewMode') || 'Grand Scheme');
      })
      .catch(() => applyMode(localStorage.getItem('viewMode') || 'Grand Scheme'));

    // Listen to Footer Events
    const onMode = (e) => applyMode(e.detail);
    window.addEventListener('viewmode:change', onMode);

    // Initial load
    applyMode(localStorage.getItem('viewMode') || 'Grand Scheme');

    return () => {
      window.removeEventListener('viewmode:change', onMode);
      window.removeEventListener('keydown', onKeyDown);
      map.off('click', onMapClick);
      // cleanup dots
      redDotsRef.current.forEach((d) => d.remove());
      redDotsRef.current = [];
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, [center, redDot]);

  return (
    <div
      ref={containerRef}
      className="h-[85vh] w-screen rounded-lg overflow-hidden bg-slate-800"
      title='Press "T" to toggle placing mode, then click to add red dots'
    />
  );
}
