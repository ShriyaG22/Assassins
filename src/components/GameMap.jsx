import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Btn, Badge, Input, PlayerAvatar, Spinner, Toast } from './UI';
import { getCurrentPosition, checkIn, pingTarget, submitSpottedReport, fetchPlayerLocations, fetchSpottedReports, fetchSafeZones } from '../lib/mapApi';
import { timeAgo } from '../lib/game';

// You'll need a Mapbox token — free tier is 50k loads/month
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function GameMap({ game, players, me, onClose }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locations, setLocations] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [spottedReports, setSpottedReports] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [mode, setMode] = useState('view'); // view | checkin | spot | ping
  const [spotTarget, setSpotTarget] = useState(null);
  const [spotNote, setSpotNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const markersRef = useRef([]);

  const isAlive = !!game.assignments?.[me.id];
  const myTargetId = game.assignments?.[me.id];

  // ─── Init map ───────────────────────────────────────────────
  useEffect(() => {
    if (!MAPBOX_TOKEN || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const center = game.boundary?.center || [-73.985, 40.748]; // default NYC
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);

      // Draw boundary if exists
      if (game.boundary?.center && game.boundary?.radius_meters) {
        drawBoundaryCircle(map, game.boundary.center, game.boundary.radius_meters);
      }
    });

    return () => map.remove();
  }, []);

  // ─── Load data ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded) return;
    loadMapData();
    const interval = setInterval(loadMapData, 15000);
    return () => clearInterval(interval);
  }, [mapLoaded]);

  // ─── Update markers when data changes ───────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Safe zone circles
    safeZones.forEach(zone => {
      drawSafeZone(mapRef.current, zone);
    });

    // Player check-in markers (only show your own)
    locations.forEach(loc => {
      if (loc.player_id === me.id) {
        const el = createMarkerEl('📍', 'var(--blue)', 'You');
        const marker = new mapboxgl.Marker(el).setLngLat([loc.lng, loc.lat]).addTo(mapRef.current);
        markersRef.current.push(marker);
      }
    });

    // Spotted reports that are relevant to you (you're the assassin of that player)
    spottedReports.forEach(report => {
      const isMyTarget = game.assignments?.[me.id] === report.spotted_player_id;
      if (isMyTarget) {
        const spottedPlayer = players.find(p => p.id === report.spotted_player_id);
        const el = createMarkerEl('👁️', 'var(--gold)', `${spottedPlayer?.name || 'Unknown'} spotted ${timeAgo(report.created_at)}`);
        const marker = new mapboxgl.Marker(el)
          .setLngLat([report.lng, report.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25, className: 'assassins-popup' })
            .setHTML(`<div style="color:#0a0a0b;font-family:DM Sans,sans-serif;font-size:13px;font-weight:600;">${spottedPlayer?.name} spotted here<br><span style="font-weight:400;color:#666;">${timeAgo(report.created_at)}${report.note ? ' · ' + report.note : ''}</span></div>`))
          .addTo(mapRef.current);
        markersRef.current.push(marker);
      }
    });

    // Ping result marker
    if (pingResult?.found) {
      const targetPlayer = players.find(p => p.id === myTargetId);
      const el = createMarkerEl('🎯', 'var(--red)', `${targetPlayer?.name}'s last known location`);
      const marker = new mapboxgl.Marker(el)
        .setLngLat([pingResult.location.lng, pingResult.location.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25, className: 'assassins-popup' })
          .setHTML(`<div style="color:#0a0a0b;font-family:DM Sans,sans-serif;font-size:13px;font-weight:600;">🎯 ${targetPlayer?.name}<br><span style="font-weight:400;color:#666;">Last seen ${timeAgo(pingResult.location.created_at)}</span></div>`))
        .addTo(mapRef.current);
      marker.togglePopup();
      markersRef.current.push(marker);
      mapRef.current.flyTo({ center: [pingResult.location.lng, pingResult.location.lat], zoom: 15 });
    }
  }, [locations, safeZones, spottedReports, pingResult, mapLoaded]);

  const loadMapData = async () => {
    try {
      const [locs, spots, zones] = await Promise.all([
        fetchPlayerLocations(game.id),
        fetchSpottedReports(game.id),
        fetchSafeZones(game.id),
      ]);
      setLocations(locs);
      setSpottedReports(spots);
      setSafeZones(zones);
    } catch (e) { console.error('Map data load failed', e); }
  };

  // ─── Actions ────────────────────────────────────────────────
  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      await checkIn(game.id, me.id, pos.lng, pos.lat);
      setMyLocation(pos);
      await loadMapData();
      mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 15 });
      setMode('view');
    } catch (e) {
      setError(e.message || 'Could not get location');
    } finally {
      setLoading(false);
    }
  };

  const handlePing = async () => {
    setLoading(true);
    setError(null);
    setPingResult(null);
    try {
      const result = await pingTarget(game.id, me.id, myTargetId);
      setPingResult(result);
      if (!result.found) {
        setError('No known location for your target yet');
      }
      setMode('view');
    } catch (e) {
      setError(e.message || 'Ping failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSpot = async () => {
    if (!spotTarget) return;
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      await submitSpottedReport(game.id, spotTarget, me.id, pos.lng, pos.lat, spotNote);
      setSpotTarget(null);
      setSpotNote('');
      await loadMapData();
      setMode('view');
    } catch (e) {
      setError(e.message || 'Could not submit report');
    } finally {
      setLoading(false);
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Map Not Configured</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.6 }}>
            Add your Mapbox token to enable the map. Get a free token at mapbox.com
          </div>
          <Btn variant="ghost" onClick={onClose} style={{ width: '100%', textAlign: 'center' }}>← Back</Btn>
        </div>
      </div>
    );
  }

  const alivePlayers = players.filter(p => p.is_alive && p.id !== me.id);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, background: 'var(--bg)' }}>
      {/* Map */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        background: 'linear-gradient(to bottom, rgba(10,10,11,0.9), transparent)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={onClose} style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '8px 14px', color: 'var(--text)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>← Back</button>
        <div style={{ flex: 1 }} />
        <Badge color="var(--green)">Live Map</Badge>
      </div>

      {/* Bottom action panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(to top, rgba(10,10,11,0.95) 60%, transparent)',
        padding: '20px 16px',
      }}>
        {mode === 'view' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480, margin: '0 auto' }}>
            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCheckIn} disabled={loading} style={{
                flex: 1, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>📍 Check In</button>
              <button onClick={() => setMode('spot')} style={{
                flex: 1, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>👁️ Spotted</button>
              {isAlive && myTargetId && (
                <button onClick={handlePing} disabled={loading} style={{
                  flex: 1, padding: '12px', background: 'var(--red-glow)', border: '1px solid rgba(229,62,62,0.3)',
                  borderRadius: 10, color: 'var(--red)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>🎯 Ping</button>
              )}
            </div>
            {pingResult?.found && (
              <div style={{
                background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)',
                padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)',
              }}>
                🎯 Target last seen <strong style={{ color: 'var(--text)' }}>{timeAgo(pingResult.location.created_at)}</strong> — check the map
              </div>
            )}
          </div>
        )}

        {mode === 'spot' && (
          <div style={{ maxWidth: 480, margin: '0 auto' }} className="fade-up">
            <div style={{
              background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>👁️ Report a Sighting</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
                Your current location will be pinned. Only the spotted player's assassin will see this.
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Who did you see?
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {alivePlayers.map(p => (
                  <button key={p.id} onClick={() => setSpotTarget(p.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                    background: spotTarget === p.id ? 'var(--red-glow)' : 'var(--card)',
                    border: `1px solid ${spotTarget === p.id ? 'var(--red)' : 'var(--border)'}`,
                    borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    color: 'var(--text)', fontFamily: 'var(--font-body)',
                  }}>
                    <PlayerAvatar avatarUrl={p.avatar_url} emoji={p.avatar} size={20} />
                    {p.name}
                  </button>
                ))}
              </div>
              <Input value={spotNote} onChange={setSpotNote} placeholder="Add a note (optional)" style={{ fontSize: 13, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={handleSpot} disabled={!spotTarget || loading} style={{ flex: 1, padding: 12 }}>
                  {loading ? <Spinner /> : 'Submit Report'}
                </Btn>
                <Btn variant="secondary" onClick={() => { setMode('view'); setSpotTarget(null); setSpotNote(''); }} style={{ flex: 1, padding: 12 }}>
                  Cancel
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toast message={error} />

      <style>{`
        .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right { margin-bottom: 140px !important; }
        .assassins-popup .mapboxgl-popup-content { border-radius: 10px; padding: 12px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .assassins-popup .mapboxgl-popup-tip { border-top-color: white; }
      `}</style>
    </div>
  );
}

// ─── Helper functions ──────────────────────────────────────────

function createMarkerEl(emoji, color, tooltip) {
  const el = document.createElement('div');
  el.style.cssText = `width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;background:${color}22;border:2px solid ${color};cursor:pointer;`;
  el.textContent = emoji;
  if (tooltip) el.title = tooltip;
  return el;
}

function drawBoundaryCircle(map, center, radiusMeters) {
  const points = 64;
  const coords = [];
  const km = radiusMeters / 1000;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = km * Math.cos(angle);
    const dy = km * Math.sin(angle);
    const lat = center[1] + (dy / 110.574);
    const lng = center[0] + (dx / (111.320 * Math.cos(center[1] * Math.PI / 180)));
    coords.push([lng, lat]);
  }
  coords.push(coords[0]); // close ring

  if (map.getSource('boundary')) return;
  map.addSource('boundary', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } } });
  map.addLayer({ id: 'boundary-fill', type: 'fill', source: 'boundary', paint: { 'fill-color': '#e53e3e', 'fill-opacity': 0.05 } });
  map.addLayer({ id: 'boundary-line', type: 'line', source: 'boundary', paint: { 'line-color': '#e53e3e', 'line-width': 2, 'line-dasharray': [4, 3] } });
}

function drawSafeZone(map, zone) {
  const id = `safe-${zone.id}`;
  if (map.getSource(id)) return;

  const points = 32;
  const coords = [];
  const km = zone.radius_meters / 1000;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = km * Math.cos(angle);
    const dy = km * Math.sin(angle);
    const lat = zone.center_lat + (dy / 110.574);
    const lng = zone.center_lng + (dx / (111.320 * Math.cos(zone.center_lat * Math.PI / 180)));
    coords.push([lng, lat]);
  }
  coords.push(coords[0]);

  map.addSource(id, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } } });
  map.addLayer({ id: `${id}-fill`, type: 'fill', source: id, paint: { 'fill-color': '#48bb78', 'fill-opacity': 0.1 } });
  map.addLayer({ id: `${id}-line`, type: 'line', source: id, paint: { 'line-color': '#48bb78', 'line-width': 2 } });

  // Label
  const el = document.createElement('div');
  el.style.cssText = 'font-size:10px;font-weight:700;color:#48bb78;background:rgba(72,187,120,0.15);padding:2px 8px;border-radius:4px;white-space:nowrap;font-family:DM Sans,sans-serif;letter-spacing:0.04em;';
  el.textContent = `🛡️ ${zone.name}`;
  new mapboxgl.Marker(el).setLngLat([zone.center_lng, zone.center_lat]).addTo(map);
}
