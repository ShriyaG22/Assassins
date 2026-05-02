import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Btn, Badge, Input, PlayerAvatar, Spinner, Toast } from './UI';
import { getCurrentPosition, checkIn, pingTarget, submitSpottedReport, fetchPlayerLocations, fetchSpottedReports, fetchSafeZones } from '../lib/mapApi';
import { timeAgo } from '../lib/game';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function GameMap({ game, players, me, onClose }) {
  const mapContainer = useRef(null); const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locations, setLocations] = useState([]); const [safeZones, setSafeZones] = useState([]); const [spottedReports, setSpottedReports] = useState([]);
  const [mode, setMode] = useState('view'); const [spotTarget, setSpotTarget] = useState(null); const [spotNote, setSpotNote] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState(null); const [pingResult, setPingResult] = useState(null);
  const markersRef = useRef([]);
  const isAlive = !!game.assignments?.[me.id]; const myTargetId = game.assignments?.[me.id];

  useEffect(() => {
    if (!MAPBOX_TOKEN || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const center = game.boundary?.center || [-73.985, 40.748];
    const map = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/dark-v11', center, zoom: 13 });
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.on('load', () => { mapRef.current = map; setMapLoaded(true); if (game.boundary?.center && game.boundary?.radius_meters) drawCircle(map, 'boundary', game.boundary.center, game.boundary.radius_meters, '#e53e3e', 0.05); });
    return () => map.remove();
  }, []);

  useEffect(() => { if (!mapLoaded) return; loadMapData(); const i = setInterval(loadMapData, 15000); return () => clearInterval(i); }, [mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    safeZones.forEach(z => { drawCircle(mapRef.current, `safe-${z.id}`, [z.center_lng, z.center_lat], z.radius_meters, '#48bb78', 0.1); const el = document.createElement('div'); el.style.cssText = 'font-size:9px;font-weight:700;color:#48bb78;background:rgba(72,187,120,0.15);padding:2px 8px;border-radius:4px;white-space:nowrap;font-family:DM Sans,sans-serif;'; el.textContent = `🛡️ ${z.name}`; const m = new mapboxgl.Marker(el).setLngLat([z.center_lng, z.center_lat]).addTo(mapRef.current); markersRef.current.push(m); });
    locations.forEach(loc => { if (loc.player_id === me.id) { const el = mkEl('📍', '#4299e1'); const m = new mapboxgl.Marker(el).setLngLat([loc.lng, loc.lat]).addTo(mapRef.current); markersRef.current.push(m); } });
    spottedReports.forEach(r => { if (game.assignments?.[me.id] === r.spotted_player_id) { const p = players.find(x => x.id === r.spotted_player_id); const el = mkEl('👁️', '#d4a853'); const m = new mapboxgl.Marker(el).setLngLat([r.lng, r.lat]).setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<div style="color:#0a0a0b;font-size:12px;font-weight:600;">${p?.name} spotted<br><span style="font-weight:400;color:#666;">${timeAgo(r.created_at)}</span></div>`)).addTo(mapRef.current); markersRef.current.push(m); } });
    if (pingResult?.found) { const t = players.find(p => p.id === myTargetId); const el = mkEl('🎯', '#e53e3e'); const m = new mapboxgl.Marker(el).setLngLat([pingResult.location.lng, pingResult.location.lat]).setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<div style="color:#0a0a0b;font-size:12px;font-weight:600;">🎯 ${t?.name}<br><span style="font-weight:400;color:#666;">Last seen ${timeAgo(pingResult.location.created_at)}</span></div>`)).addTo(mapRef.current); m.togglePopup(); markersRef.current.push(m); mapRef.current.flyTo({ center: [pingResult.location.lng, pingResult.location.lat], zoom: 15 }); }
  }, [locations, safeZones, spottedReports, pingResult, mapLoaded]);

  const loadMapData = async () => { try { const [l, s, z] = await Promise.all([fetchPlayerLocations(game.id), fetchSpottedReports(game.id), fetchSafeZones(game.id)]); setLocations(l); setSpottedReports(s); setSafeZones(z); } catch {} };
  const handleCheckIn = async () => { setLoading(true); setError(null); try { const pos = await getCurrentPosition(); await checkIn(game.id, me.id, pos.lng, pos.lat); await loadMapData(); mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 15 }); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  const handlePing = async () => { setLoading(true); setError(null); setPingResult(null); try { const r = await pingTarget(game.id, me.id, myTargetId); setPingResult(r); if (!r.found) setError('No known location for your target yet'); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  const handleSpot = async () => { if (!spotTarget) return; setLoading(true); setError(null); try { const pos = await getCurrentPosition(); await submitSpottedReport(game.id, spotTarget, me.id, pos.lng, pos.lat, spotNote); setSpotTarget(null); setSpotNote(''); await loadMapData(); setMode('view'); } catch (e) { setError(e.message); } finally { setLoading(false); } };

  if (!MAPBOX_TOKEN) return <div style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div><div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 16 }}>Map not configured</div><Btn variant="ghost" onClick={onClose}>← Back</Btn></div>;

  const alivePlayers = players.filter(p => p.is_alive && p.id !== me.id);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, background: 'var(--bg)' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', paddingTop: 'max(12px,env(safe-area-inset-top))', background: 'linear-gradient(to bottom,rgba(10,10,11,0.9),transparent)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onClose} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
        <div style={{ flex: 1 }} /><Badge color="var(--green)">Live Map</Badge>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 'max(16px,env(safe-area-inset-bottom))', background: 'linear-gradient(to top,rgba(10,10,11,0.95) 60%,transparent)', padding: '20px 16px' }}>
        {mode === 'view' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCheckIn} disabled={loading} style={{ flex: 1, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>📍 Check In</button>
              <button onClick={() => setMode('spot')} style={{ flex: 1, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>👁️ Spotted</button>
              {isAlive && myTargetId && <button onClick={handlePing} disabled={loading} style={{ flex: 1, padding: 12, background: 'var(--red-glow)', border: '1px solid rgba(229,62,62,0.3)', borderRadius: 10, color: 'var(--red)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>🎯 Ping</button>}
            </div>
            {pingResult?.found && <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>🎯 Target last seen <strong style={{ color: 'var(--text)' }}>{timeAgo(pingResult.location.created_at)}</strong></div>}
          </div>
        )}
        {mode === 'spot' && (
          <div style={{ maxWidth: 480, margin: '0 auto' }} className="fade-up">
            <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>👁️ Report a Sighting</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>Only the spotted player's assassin will see this report.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {alivePlayers.map(p => (<button key={p.id} onClick={() => setSpotTarget(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', background: spotTarget === p.id ? 'var(--red-glow)' : 'var(--card)', border: `1px solid ${spotTarget === p.id ? 'var(--red)' : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}><PlayerAvatar avatarUrl={p.avatar_url} emoji={p.avatar} size={18} />{p.name}</button>))}
              </div>
              <Input value={spotNote} onChange={setSpotNote} placeholder="Add a note (optional)" style={{ fontSize: 12, marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={handleSpot} disabled={!spotTarget || loading} style={{ flex: 1, padding: 10 }}>{loading ? <Spinner /> : 'Submit'}</Btn>
                <Btn variant="secondary" onClick={() => { setMode('view'); setSpotTarget(null); setSpotNote(''); }} style={{ flex: 1, padding: 10 }}>Cancel</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast message={error} />
      <style>{`.mapboxgl-ctrl-bottom-left,.mapboxgl-ctrl-bottom-right{margin-bottom:140px!important}`}</style>
    </div>
  );
}

function mkEl(emoji, color) { const el = document.createElement('div'); el.style.cssText = `width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;background:${color}22;border:2px solid ${color};cursor:pointer;`; el.textContent = emoji; return el; }

function drawCircle(map, id, center, radiusMeters, color, opacity) {
  const pts = 48, coords = [], km = radiusMeters / 1000;
  for (let i = 0; i < pts; i++) { const a = (i / pts) * 2 * Math.PI; const dx = km * Math.cos(a); const dy = km * Math.sin(a); coords.push([center[0] + dx / (111.320 * Math.cos(center[1] * Math.PI / 180)), center[1] + dy / 110.574]); }
  coords.push(coords[0]);
  const data = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } };
  if (map.getSource(id)) { map.getSource(id).setData(data); } else { map.addSource(id, { type: 'geojson', data }); map.addLayer({ id: `${id}-fill`, type: 'fill', source: id, paint: { 'fill-color': color, 'fill-opacity': opacity } }); map.addLayer({ id: `${id}-line`, type: 'line', source: id, paint: { 'line-color': color, 'line-width': 2, 'line-dasharray': [4, 3] } }); }
}
