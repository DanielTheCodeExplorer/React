import { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as EsriLeaflet from 'esri-leaflet';

function Map({ center = [9.08, 8.68] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const MIN_ZOOM = 2;

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [0, 0],
      zoom: MIN_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: 7,
      worldCopyJump: false,
      zoomControl: true,
      maxBounds: [[-85, -180],[85, 180]],   // lock to world
      maxBoundsViscosity: 1.0               // resist dragging outside
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      noWrap: true,                         // stop world repeat
      minZoom: MIN_ZOOM,
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    // add the cable layer after the map is created
    EsriLeaflet.featureLayer({
      url: 'https://services.arcgis.com/bDAhvQYMG4WL8O5o/arcgis/rest/services/Global_Submarine_Cable_Map/FeatureServer/1',
      onEachFeature: (feature, layer) => {
        layer.bindPopup(feature.properties.Name);
      },
      style: () => ({
        color: '#02327aff',     // ← line color (hex, rgb, or named color)
        weight: 2,            // ← line thickness
        opacity: 0.9,         // ← line opacity (0–1)
        dashArray: '4 2',     // ← optional dashed pattern
      }),
    }).addTo(map);


    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  return <div ref={containerRef} className="w-screen h-screen bg-[#a6d6f1]" />;
}

export default Map;
