import { supabase } from './supabase';
import { ts } from './game';

export async function createSafeZone(gameId, name, lng, lat, radiusMeters = 100) {
  const { data, error } = await supabase.from('safe_zones').insert({ game_id: gameId, name, center_lng: lng, center_lat: lat, radius_meters: radiusMeters, created_at: ts() }).select().single();
  if (error) throw error; return data;
}
export async function fetchSafeZones(gameId) { const { data, error } = await supabase.from('safe_zones').select('*').eq('game_id', gameId); if (error) throw error; return data || []; }
export async function deleteSafeZone(zoneId) { await supabase.from('safe_zones').delete().eq('id', zoneId); }
export async function updateGameBoundary(gameId, boundary) { await supabase.from('games').update({ boundary }).eq('id', gameId); }
export async function checkIn(gameId, playerId, lng, lat) { const { data, error } = await supabase.from('player_locations').insert({ game_id: gameId, player_id: playerId, lng, lat, type: 'checkin', created_at: ts() }).select().single(); if (error) throw error; return data; }
export async function fetchPlayerLocations(gameId) { const { data, error } = await supabase.from('player_locations').select('*').eq('game_id', gameId).order('created_at', { ascending: false }); if (error) throw error; const latest = {}; for (const loc of (data || [])) { if (!latest[loc.player_id]) latest[loc.player_id] = loc; } return Object.values(latest); }
export async function submitSpottedReport(gameId, spottedPlayerId, reporterId, lng, lat, note) { const { data, error } = await supabase.from('spotted_reports').insert({ game_id: gameId, spotted_player_id: spottedPlayerId, reporter_id: reporterId, lng, lat, note: note || null, created_at: ts() }).select().single(); if (error) throw error; return data; }
export async function fetchSpottedReports(gameId) { const { data, error } = await supabase.from('spotted_reports').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(50); if (error) throw error; return data || []; }
export async function canPing(gameId, pingerId) { const oneHourAgo = new Date(Date.now() - 60*60*1000).toISOString(); const { data } = await supabase.from('pings').select('id').eq('game_id', gameId).eq('pinger_id', pingerId).gte('created_at', oneHourAgo).limit(1); return (data || []).length === 0; }
export async function pingTarget(gameId, pingerId, targetId) { const allowed = await canPing(gameId, pingerId); if (!allowed) throw new Error('You can only ping once per hour'); await supabase.from('pings').insert({ game_id: gameId, pinger_id: pingerId, target_id: targetId, created_at: ts() }); const { data } = await supabase.from('player_locations').select('*').eq('game_id', gameId).eq('player_id', targetId).order('created_at', { ascending: false }).limit(1); if (data && data.length > 0) return { found: true, location: data[0] }; return { found: false, message: 'No known location for this target' }; }
export function getCurrentPosition() { return new Promise((resolve, reject) => { if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; } navigator.geolocation.getCurrentPosition((pos) => resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude }), (err) => reject(err), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }); }); }
