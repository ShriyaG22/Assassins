import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Btn, Input, Label } from './UI';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function BoundarySetup({ onSave, onSkip }) {
  const mapContainer = useRef(null); const mapRef = useRef(null); const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false); const [center, setCenter] = useState(null); const [radius, setRadius] = useState(2000);
  const [safeZones, setSafeZones] = useState([]); const [addingZone, setAddingZone] = useState(false); const [zoneName, setZoneName] = useState(''); const [zoneCenter, setZoneCenter] = useState(null);
  const [step, setStep] = useState('boundary');

  useEffect(() => {
    if (!MAPBOX_TOKEN || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/dark-v11', center: [-73.985, 40.748], zoom: 12 });
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.on('load', () => { mapRef.current = map; setMapLoaded(true); navigator.geolocation?.getCurrentPosition((pos) => map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 }), () => {}, { enableHighAccuracy: false, timeout: 5000 }); });
    map.on('click', (e) => { const ll = [e.lngLat.lng, e.lngLat.lat]; setCenter(ll); });
    return () => map.remove();
  }, []);

  useEffect(() => { if (!mapRef.current) return; const h = (e) => { if (addingZone) setZoneCenter([e.lngLat.lng, e.lngLat.lat]); }; mapRef.current.on('click', h); return () => mapRef.current?.off('click', h); }, [addingZone]);

  useEffect(() => {
    if (!mapRef.current || !center) return;
    drawCircle(mapRef.current, 'boundary', center, radius, '#e53e3e', 0.08);
    if (markerRef.current) markerRef.current.remove();
    const el = document.createElement('div'); el.style.cssText = 'width:12px;height:12px;background:#e53e3e;border-radius:50%;border:2px solid white;';
    markerRef.current = new mapboxgl.Marker(el).setLngLat(center).addTo(mapRef.current);
  }, [center, radius]);

  useEffect(() => { if (!mapRef.current) return; safeZones.forEach((z, i) => drawCircle(mapRef.current, `safe-preview-${i}`, [z.lng, z.lat], z.radius, '#48bb78', 0.15)); if (zoneCenter) drawCircle(mapRef.current, 'safe-adding', zoneCenter, 100, '#48bb78', 0.2); }, [safeZones, zoneCenter]);

  const handleAddZone = () => { if (!zoneCenter || !zoneName.trim()) return; setSafeZones([...safeZones, { name: zoneName.trim(), lng: zoneCenter[0], lat: zoneCenter[1], radius: 100 }]); setZoneName(''); setZoneCenter(null); setAddingZone(false); };
  const handleSave = () => onSave({ boundary: center ? { center, radius_meters: radius } : null, safeZones });

  if (!MAPBOX_TOKEN) return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div><div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 16 }}>Map requires a Mapbox token</div><Btn variant="ghost" onClick={onSkip}>Skip</Btn></div>;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, background: 'var(--bg)' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', paddingTop: 'max(12px,env(safe-area-inset-top))', background: 'linear-gradient(to bottom,rgba(10,10,11,0.95),transparent)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{step === 'boundary' ? '🗺️ Set Play Area' : '🛡️ Add Safe Zones'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{step === 'boundary' ? 'Tap the map to set the center of your game boundary' : 'Tap to mark areas where eliminations are off-limits'}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 'max(16px,env(safe-area-inset-bottom))', background: 'linear-gradient(to top,rgba(10,10,11,0.95) 70%,transparent)', padding: '20px 16px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {step === 'boundary' && (
            <div className="fade-up">
              {center && <div style={{ marginBottom: 12 }}><Label>Boundary Radius</Label><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><input type="range" min={500} max={10000} step={100} value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--red)' }} /><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', minWidth: 50, textAlign: 'right' }}>{radius >= 1000 ? `${(radius/1000).toFixed(1)}km` : `${radius}m`}</span></div></div>}
              <div style={{ display: 'flex', gap: 8 }}><Btn onClick={() => setStep('safezones')} disabled={!center} style={{ flex: 1 }}>{center ? 'Next: Safe Zones →' : 'Tap map to set boundary'}</Btn><Btn variant="ghost" onClick={onSkip} style={{ padding: 12 }}>Skip</Btn></div>
            </div>
          )}
          {step === 'safezones' && (
            <div className="fade-up">
              {safeZones.length > 0 && <div style={{ marginBottom: 12 }}>{safeZones.map((z, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface)', borderRadius: 8, marginBottom: 4, fontSize: 13 }}><span style={{ color: 'var(--green)' }}>🛡️</span><span style={{ flex: 1 }}>{z.name}</span><button onClick={() => setSafeZones(safeZones.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}>✕</button></div>))}</div>}
              {addingZone ? (
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>{zoneCenter ? '✓ Location set — name this zone' : 'Tap the map to place the safe zone'}</div>
                  <Input value={zoneName} onChange={setZoneName} placeholder="e.g. Home, Office..." style={{ fontSize: 13, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}><Btn onClick={handleAddZone} disabled={!zoneCenter || !zoneName.trim()} style={{ flex: 1, padding: 10, fontSize: 13 }}>Add Zone</Btn><Btn variant="secondary" onClick={() => { setAddingZone(false); setZoneName(''); setZoneCenter(null); }} style={{ flex: 1, padding: 10, fontSize: 13 }}>Cancel</Btn></div>
                </div>
              ) : <Btn variant="secondary" onClick={() => setAddingZone(true)} style={{ marginBottom: 12 }}>+ Add Safe Zone</Btn>}
              <Btn onClick={handleSave}>Done — Create Game →</Btn>
              <div style={{ height: 8 }} /><Btn variant="ghost" onClick={() => setStep('boundary')} style={{ width: '100%', textAlign: 'center' }}>← Back to Boundary</Btn>
            </div>
          )}
        </div>
      </div>
      <style>{`.mapboxgl-ctrl-bottom-left,.mapboxgl-ctrl-bottom-right{margin-bottom:180px!important}`}</style>
    </div>
  );
}

function drawCircle(map, id, center, radiusMeters, color, opacity) {
  const pts = 48, coords = [], km = radiusMeters / 1000;
  for (let i = 0; i < pts; i++) { const a = (i / pts) * 2 * Math.PI; coords.push([center[0] + km * Math.cos(a) / (111.320 * Math.cos(center[1] * Math.PI / 180)), center[1] + km * Math.sin(a) / 110.574]); }
  coords.push(coords[0]);
  const data = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } };
  if (map.getSource(id)) map.getSource(id).setData(data);
  else { map.addSource(id, { type: 'geojson', data }); map.addLayer({ id: `${id}-fill`, type: 'fill', source: id, paint: { 'fill-color': color, 'fill-opacity': opacity } }); map.addLayer({ id: `${id}-line`, type: 'line', source: id, paint: { 'line-color': color, 'line-width': 2, 'line-dasharray': [4, 3] } }); }
}
