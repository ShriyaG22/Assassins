import { supabase } from './supabase';
import { buildChain, processElimination, uid, gameCode, ts, pickAvatar, generateCodename } from './game';

// ─── CODENAME HELPERS ──────────────────────────────────────────
export async function getUsedCodenames(gameId) {
  const { data } = await supabase.from('players').select('codename').eq('game_id', gameId);
  return (data || []).map(p => p.codename).filter(Boolean);
}
export async function assignCodename(gameId) { const used = await getUsedCodenames(gameId); return generateCodename(used); }
export async function updatePlayerCodename(playerId, codename) { const { error } = await supabase.from('players').update({ codename }).eq('id', playerId); if (error) throw error; }
export async function verifyTargetCodename(gameId, assassinId, enteredCodename) {
  const game = await fetchGame(gameId);
  const targetId = game.assignments?.[assassinId];
  if (!targetId) return { valid: false, message: 'No target assigned' };
  const { data: target } = await supabase.from('players').select('codename').eq('id', targetId).single();
  if (!target?.codename) return { valid: false, message: 'Target has no codename' };
  const match = target.codename.toLowerCase().trim() === enteredCodename.toLowerCase().trim();
  return { valid: match, message: match ? 'Codename verified!' : 'Incorrect codename' };
}

// ─── GAMES ─────────────────────────────────────────────────────
export async function createGame(playerName, deviceId, avatarUrl, codename) {
  const code = gameCode(); const playerId = uid(); const emoji = pickAvatar();
  const { data: game, error: ge } = await supabase.from('games').insert({ code, host_id: playerId, status: 'lobby', assignments: {}, created_at: ts() }).select().single();
  if (ge) throw ge;
  const { error: pe } = await supabase.from('players').insert({ id: playerId, game_id: game.id, device_id: deviceId, name: playerName, avatar: emoji, avatar_url: avatarUrl || null, is_alive: true, kills: 0, joined_at: ts(), codename: codename || null });
  if (pe) throw pe;
  return { game, playerId, emoji };
}

export async function joinGame(code, playerName, deviceId, avatarUrl, codename) {
  const { data: game, error: fe } = await supabase.from('games').select('*').eq('code', code.toUpperCase()).single();
  if (fe || !game) throw new Error('Game not found');
  if (game.status !== 'lobby') throw new Error('Game already started');
  const { data: existing } = await supabase.from('players').select('name,avatar,codename').eq('game_id', game.id);
  if (existing?.some(p => p.name.toLowerCase() === playerName.toLowerCase())) throw new Error('Name already taken');
  if ((existing?.length || 0) >= 20) throw new Error('Game is full (max 20)');
  const playerId = uid(); const usedAvatars = existing?.map(p => p.avatar) || []; const emoji = pickAvatar(usedAvatars);
  const { error: pe } = await supabase.from('players').insert({ id: playerId, game_id: game.id, device_id: deviceId, name: playerName, avatar: emoji, avatar_url: avatarUrl || null, is_alive: true, kills: 0, joined_at: ts(), codename: codename || null });
  if (pe) throw pe;
  return { game, playerId, emoji };
}

export async function fetchGame(gameId) { const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single(); if (error) throw error; return data; }
export async function fetchPlayers(gameId) { const { data, error } = await supabase.from('players').select('*').eq('game_id', gameId).order('joined_at', { ascending: true }); if (error) throw error; return data || []; }
export async function fetchFeed(gameId) { const { data, error } = await supabase.from('feed').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(50); if (error) throw error; return data || []; }

// ─── START WITH COUNTDOWN ──────────────────────────────────────
export async function startGameWithCountdown(gameId, countdownSeconds) {
  const players = await fetchPlayers(gameId);
  if (players.length < 3) throw new Error('Need at least 3 players');
  const assignments = buildChain(players.map(p => p.id));
  const { error } = await supabase.from('games').update({
    status: countdownSeconds > 0 ? 'countdown' : 'active',
    assignments,
    countdown_seconds: countdownSeconds,
    countdown_started_at: countdownSeconds > 0 ? ts() : null,
    started_at: countdownSeconds > 0 ? null : ts(),
  }).eq('id', gameId);
  if (error) throw error;
  return assignments;
}

export async function skipCountdown(gameId) {
  const { error } = await supabase.from('games').update({
    status: 'active',
    started_at: ts(),
    countdown_started_at: null,
  }).eq('id', gameId);
  if (error) throw error;
}

// ─── DISQUALIFY PLAYER ─────────────────────────────────────────
export async function disqualifyPlayer(gameId, playerId) {
  const game = await fetchGame(gameId);
  if (!game.assignments[playerId]) return;
  const { newAssignments, isGameOver } = processElimination(game.assignments, playerId);
  // For DQ, the player who was hunting them gets their target
  // We need to find who was hunting the DQ'd player
  let hunterId = null;
  for (const [assassin, target] of Object.entries(game.assignments)) {
    if (target === playerId) { hunterId = assassin; break; }
  }
  // Remove DQ'd player from chain
  const fixedAssignments = { ...game.assignments };
  if (hunterId) fixedAssignments[hunterId] = fixedAssignments[playerId];
  delete fixedAssignments[playerId];
  const alive = Object.keys(fixedAssignments).length;

  await supabase.from('games').update({
    assignments: fixedAssignments,
    status: alive <= 1 ? 'finished' : game.status,
    winner_id: alive <= 1 ? Object.keys(fixedAssignments)[0] : null,
  }).eq('id', gameId);
  await supabase.from('players').update({ is_alive: false, disqualified: true, disqualified_at: ts() }).eq('id', playerId);
  const player = (await fetchPlayers(gameId)).find(p => p.id === playerId);
  await supabase.from('feed').insert({
    game_id: gameId, type: 'elimination', assassin_name: 'BOUNDARY',
    target_id: playerId, target_name: player?.name || 'Unknown',
    remaining: alive, created_at: ts(),
  });
}

// ─── ELIMINATIONS ──────────────────────────────────────────────
export async function uploadEvidence(gameId, assassinId, file) {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${gameId}/${assassinId}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('evidence').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function reportElimination(gameId, assassinId, photoFile) {
  if (!photoFile) throw new Error('Photo evidence is required');
  const game = await fetchGame(gameId);
  if (game.status !== 'active') throw new Error('Game is not active');
  const targetId = game.assignments[assassinId];
  if (!targetId) throw new Error('No target assigned');
  const { newAssignments, isGameOver, alive } = processElimination(game.assignments, assassinId);
  let photoUrl = null;
  try { photoUrl = await uploadEvidence(gameId, assassinId, photoFile); } catch (e) { throw new Error('Photo upload failed — please try again'); }
  const players = await fetchPlayers(gameId);
  const assassin = players.find(p => p.id === assassinId);
  const target = players.find(p => p.id === targetId);
  await supabase.from('games').update({ assignments: newAssignments, status: isGameOver ? 'finished' : 'active', finished_at: isGameOver ? ts() : null, winner_id: isGameOver ? assassinId : null }).eq('id', gameId);
  await supabase.from('players').update({ is_alive: false }).eq('id', targetId);
  await supabase.from('players').update({ kills: (assassin?.kills || 0) + 1 }).eq('id', assassinId);
  await supabase.from('feed').insert({ game_id: gameId, type: 'elimination', assassin_id: assassinId, target_id: targetId, assassin_name: assassin?.name || 'Unknown', target_name: target?.name || 'Unknown', remaining: alive, photo_url: photoUrl, created_at: ts() });
  if (isGameOver) {
    await supabase.from('feed').insert({ game_id: gameId, type: 'winner', assassin_id: assassinId, assassin_name: assassin?.name || 'Unknown', remaining: 1, created_at: ts() });
  }
  return { isGameOver, newAssignments };
}

export async function uploadGuestAvatar(deviceId, file) {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `guests/${deviceId}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export function subscribeToGame(gameId, callbacks) {
  const channel = supabase.channel(`game-${gameId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (p) => callbacks.onGameUpdate?.(p.new))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, () => callbacks.onPlayersUpdate?.())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed', filter: `game_id=eq.${gameId}` }, (p) => callbacks.onFeedUpdate?.(p.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}
