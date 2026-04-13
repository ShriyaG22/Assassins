import { supabase } from './supabase';
import { buildChain, processElimination, uid, gameCode, ts, pickAvatar } from './game';

// ─── GAMES ─────────────────────────────────────────────────────

export async function createGame(playerName, deviceId, avatarUrl, authUserId) {
  const code = gameCode();
  const playerId = uid();
  const emoji = pickAvatar();
  const { data: game, error: gameErr } = await supabase
    .from('games')
    .insert({ code, host_id: playerId, status: 'lobby', assignments: {}, created_at: ts() })
    .select().single();
  if (gameErr) throw gameErr;

  const { error: playerErr } = await supabase.from('players').insert({
    id: playerId, game_id: game.id, device_id: deviceId, name: playerName,
    avatar: emoji, avatar_url: avatarUrl || null, is_alive: true, kills: 0,
    joined_at: ts(), auth_user_id: authUserId || null,
  });
  if (playerErr) throw playerErr;
  return { game, playerId, emoji };
}

export async function joinGame(code, playerName, deviceId, avatarUrl, authUserId) {
  const { data: game, error: findErr } = await supabase
    .from('games').select('*').eq('code', code.toUpperCase()).single();
  if (findErr || !game) throw new Error('Game not found');
  if (game.status !== 'lobby') throw new Error('Game already started');

  const { data: existing } = await supabase.from('players').select('name, avatar').eq('game_id', game.id);
  if (existing?.some(p => p.name.toLowerCase() === playerName.toLowerCase())) throw new Error('Name already taken');
  if ((existing?.length || 0) >= 20) throw new Error('Game is full (max 20)');

  const playerId = uid();
  const usedAvatars = existing?.map(p => p.avatar) || [];
  const emoji = pickAvatar(usedAvatars);

  const { error: playerErr } = await supabase.from('players').insert({
    id: playerId, game_id: game.id, device_id: deviceId, name: playerName,
    avatar: emoji, avatar_url: avatarUrl || null, is_alive: true, kills: 0,
    joined_at: ts(), auth_user_id: authUserId || null,
  });
  if (playerErr) throw playerErr;
  return { game, playerId, emoji };
}

export async function fetchGame(gameId) {
  const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
  if (error) throw error;
  return data;
}

export async function fetchPlayers(gameId) {
  const { data, error } = await supabase.from('players').select('*').eq('game_id', gameId).order('joined_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchFeed(gameId) {
  const { data, error } = await supabase.from('feed').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

// ─── GAME ACTIONS ──────────────────────────────────────────────

export async function startGame(gameId) {
  const players = await fetchPlayers(gameId);
  if (players.length < 3) throw new Error('Need at least 3 players');
  const assignments = buildChain(players.map(p => p.id));
  const { error } = await supabase.from('games').update({ status: 'active', assignments, started_at: ts() }).eq('id', gameId);
  if (error) throw error;
  return assignments;
}

export async function uploadEvidence(gameId, assassinId, file) {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${gameId}/${assassinId}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('evidence').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function reportElimination(gameId, assassinId, photoFile) {
  const game = await fetchGame(gameId);
  if (game.status !== 'active') throw new Error('Game is not active');
  const targetId = game.assignments[assassinId];
  if (!targetId) throw new Error('No target assigned');

  const { newAssignments, isGameOver, alive } = processElimination(game.assignments, assassinId);

  let photoUrl = null;
  if (photoFile) {
    try { photoUrl = await uploadEvidence(gameId, assassinId, photoFile); } catch (e) { console.error('Photo upload failed', e); }
  }

  const players = await fetchPlayers(gameId);
  const assassin = players.find(p => p.id === assassinId);
  const target = players.find(p => p.id === targetId);

  await supabase.from('games').update({
    assignments: newAssignments, status: isGameOver ? 'finished' : 'active',
    finished_at: isGameOver ? ts() : null, winner_id: isGameOver ? assassinId : null,
  }).eq('id', gameId);

  await supabase.from('players').update({ is_alive: false }).eq('id', targetId);
  await supabase.from('players').update({ kills: (assassin?.kills || 0) + 1 }).eq('id', assassinId);

  await supabase.from('feed').insert({
    game_id: gameId, type: 'elimination', assassin_id: assassinId, target_id: targetId,
    assassin_name: assassin?.name || 'Unknown', target_name: target?.name || 'Unknown',
    remaining: alive, photo_url: photoUrl, created_at: ts(),
  });

  if (isGameOver) {
    await supabase.from('feed').insert({
      game_id: gameId, type: 'winner', assassin_id: assassinId,
      assassin_name: assassin?.name || 'Unknown', remaining: 1, created_at: ts(),
    });

    // Update profile stats for all registered players
    for (const p of players) {
      if (p.auth_user_id) {
        try {
          const profile = await supabase.from('profiles').select('*').eq('id', p.auth_user_id).single();
          if (profile.data) {
            const won = p.id === assassinId;
            await supabase.from('profiles').update({
              games_played: (profile.data.games_played || 0) + 1,
              games_won: (profile.data.games_won || 0) + (won ? 1 : 0),
              total_kills: (profile.data.total_kills || 0) + (p.kills || 0) + (p.id === assassinId ? 1 : 0),
              updated_at: ts(),
            }).eq('id', p.auth_user_id);
          }
        } catch (e) { console.error('Stats update failed for', p.name, e); }
      }
    }
  }

  return { isGameOver, newAssignments };
}

// ─── PROFILE LOOKUP ────────────────────────────────────────────

export async function fetchPlayerProfile(authUserId) {
  if (!authUserId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', authUserId).single();
  if (error) return null;
  return data;
}

// ─── REALTIME ──────────────────────────────────────────────────

export function subscribeToGame(gameId, callbacks) {
  const channel = supabase.channel(`game-${gameId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (p) => callbacks.onGameUpdate?.(p.new))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, () => callbacks.onPlayersUpdate?.())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed', filter: `game_id=eq.${gameId}` }, (p) => callbacks.onFeedUpdate?.(p.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}
