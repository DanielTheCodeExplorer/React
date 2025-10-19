import 'leaflet/dist/leaflet.css';
import L from 'leaflet'
import {useRef , useEffect} from 'react'

function Map({ center = [9.08, 8.68] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);                 // ← store the map

  useEffect(() => {
    if (mapRef.current) return;                // ← guard StrictMode double-call
    const map = L.map(containerRef.current, { center, zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };  // ← cleanup
  }, [center]);
  return <div ref={containerRef} className="h-full w-full rounded-lg overflow-hidden bg-slate-800" />;
}


export default Map 