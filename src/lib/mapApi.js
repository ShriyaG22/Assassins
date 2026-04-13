import { supabase } from './supabase';
import { ts } from './game';

// ─── SAFE ZONES ────────────────────────────────────────────────

export async function createSafeZone(gameId, name, lng, lat, radiusMeters = 100) {
  const { data, error } = await supabase.from('safe_zones').insert({
    game_id: gameId, name, center_lng: lng, center_lat: lat, radius_meters: radiusMeters, created_at: ts(),
  }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchSafeZones(gameId) {
  const { data, error } = await supabase.from('safe_zones').select('*').eq('game_id', gameId);
  if (error) throw error;
  return data || [];
}

export async function deleteSafeZone(zoneId) {
  const { error } = await supabase.from('safe_zones').delete().eq('id', zoneId);
  if (error) throw error;
}

// ─── GAME BOUNDARY ─────────────────────────────────────────────

export async function updateGameBoundary(gameId, boundary) {
  const { error } = await supabase.from('games').update({ boundary }).eq('id', gameId);
  if (error) throw error;
}

// ─── PLAYER LOCATIONS ──────────────────────────────────────────

export async function checkIn(gameId, playerId, lng, lat) {
  const { data, error } = await supabase.from('player_locations').insert({
    game_id: gameId, player_id: playerId, lng, lat, type: 'checkin', created_at: ts(),
  }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchPlayerLocations(gameId) {
  // Get the most recent location for each player
  const { data, error } = await supabase
    .from('player_locations')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Deduplicate — keep only the latest per player
  const latest = {};
  for (const loc of (data || [])) {
    if (!latest[loc.player_id]) latest[loc.player_id] = loc;
  }
  return Object.values(latest);
}

// ─── SPOTTED REPORTS ───────────────────────────────────────────

export async function submitSpottedReport(gameId, spottedPlayerId, reporterId, lng, lat, note) {
  const { data, error } = await supabase.from('spotted_reports').insert({
    game_id: gameId, spotted_player_id: spottedPlayerId, reporter_id: reporterId,
    lng, lat, note: note || null, created_at: ts(),
  }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchSpottedReports(gameId) {
  const { data, error } = await supabase.from('spotted_reports')
    .select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

// ─── PINGS ─────────────────────────────────────────────────────

export async function canPing(gameId, pingerId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('pings')
    .select('id').eq('game_id', gameId).eq('pinger_id', pingerId)
    .gte('created_at', oneHourAgo).limit(1);
  if (error) throw error;
  return (data || []).length === 0;
}

export async function pingTarget(gameId, pingerId, targetId) {
  const allowed = await canPing(gameId, pingerId);
  if (!allowed) throw new Error('You can only ping once per hour');

  // Record the ping
  await supabase.from('pings').insert({
    game_id: gameId, pinger_id: pingerId, target_id: targetId, created_at: ts(),
  });

  // Get target's last known location
  const { data, error } = await supabase.from('player_locations')
    .select('*').eq('game_id', gameId).eq('player_id', targetId)
    .order('created_at', { ascending: false }).limit(1);
  if (error) throw error;

  if (data && data.length > 0) {
    return { found: true, location: data[0] };
  }
  return { found: false, message: 'No known location for this target' };
}

// ─── GEOLOCATION HELPER ────────────────────────────────────────

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}
