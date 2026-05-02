import React, { useState, useEffect, useRef } from 'react';
import { getDeviceId, getSession, setSession, clearSession, generateCodename } from './lib/game';
import { createGame, joinGame, fetchGame, fetchPlayers, fetchFeed, startGameWithCountdown, skipCountdown, reportElimination, uploadGuestAvatar, subscribeToGame, verifyTargetCodename, disqualifyPlayer } from './lib/api';
import { updateGameBoundary, createSafeZone, getCurrentPosition } from './lib/mapApi';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import RulesPage from './pages/RulesPage';
import CodenameReveal from './components/CodenameReveal';
import CountdownScreen from './components/CountdownScreen';
import BoundaryWarning from './components/BoundaryWarning';
import { Btn, Toast } from './components/UI';

let GameMap, BoundarySetup;
try { GameMap = React.lazy(() => import('./components/GameMap')); BoundarySetup = React.lazy(() => import('./components/BoundarySetup')); } catch {}

function isInsideBoundary(boundary, lat, lng) {
  if (!boundary?.center || !boundary?.radius_meters) return true;
  const [bLng, bLat] = boundary.center;
  const R = 6371000;
  const dLat = (lat - bLat) * Math.PI / 180;
  const dLng = (lng - bLng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(bLat*Math.PI/180) * Math.cos(lat*Math.PI/180) * Math.sin(dLng/2)**2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return dist <= boundary.radius_meters;
}

export default function App() {
  const [session, setSessionState] = useState(null);
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState('home');
  const [showMap, setShowMap] = useState(false);
  const [showBoundarySetup, setShowBoundarySetup] = useState(false);
  const [showCodenameReveal, setShowCodenameReveal] = useState(false);
  const [pendingCodename, setPendingCodename] = useState('');
  const [pendingCreateData, setPendingCreateData] = useState(null); // stores name, avatarUrl for create flow
  const [outOfBounds, setOutOfBounds] = useState(false);
  const boundaryCheckRef = useRef(null);

  const deviceId = getDeviceId();

  useEffect(() => {
    const saved = getSession();
    if (saved?.gameId) { setSessionState(saved); loadGameData(saved.gameId).finally(() => setLoading(false)); }
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (!session?.gameId) return;
    const unsub = subscribeToGame(session.gameId, {
      onGameUpdate: (g) => setGame(g),
      onPlayersUpdate: async () => { const p = await fetchPlayers(session.gameId); setPlayers(p); },
      onFeedUpdate: async () => { const f = await fetchFeed(session.gameId); setFeed(f); const g = await fetchGame(session.gameId); setGame(g); },
    });
    const poll = setInterval(async () => {
      try { const [g, p, f] = await Promise.all([fetchGame(session.gameId), fetchPlayers(session.gameId), fetchFeed(session.gameId)]); setGame(g); setPlayers(p); setFeed(f); } catch {}
    }, 5000);
    return () => { unsub(); clearInterval(poll); };
  }, [session?.gameId]);

  // Boundary checking during active game
  useEffect(() => {
    if (!game || game.status !== 'active' || !game.boundary || !session) return;
    const me = players.find(p => p.id === session.playerId);
    if (!me?.is_alive || me?.disqualified) return;
    const check = async () => {
      try { const pos = await getCurrentPosition(); setOutOfBounds(!isInsideBoundary(game.boundary, pos.lat, pos.lng)); } catch {}
    };
    check();
    boundaryCheckRef.current = setInterval(check, 30000);
    return () => { if (boundaryCheckRef.current) clearInterval(boundaryCheckRef.current); };
  }, [game?.status, game?.boundary, session?.playerId]);

  const loadGameData = async (gameId) => {
    try { const [g, p, f] = await Promise.all([fetchGame(gameId), fetchPlayers(gameId), fetchFeed(gameId)]); setGame(g); setPlayers(p); setFeed(f); } catch { clearSession(); setSessionState(null); }
  };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(null), 4000); };

  // ─── CREATE GAME FLOW: photo+name → boundary setup → codename → lobby ───
  const handleCreateGame = async (name, photoFile) => {
    try {
      let avatarUrl = null;
      if (photoFile) avatarUrl = await uploadGuestAvatar(deviceId, photoFile);
      // Save the data and show boundary setup
      setPendingCreateData({ name, avatarUrl });
      setShowBoundarySetup(true);
    } catch (e) { showError(e.message || 'Failed'); }
  };

  // After boundary setup completes, create the game then show codename
  const handleBoundarySaveForCreate = async ({ boundary, safeZones: zones }) => {
    setShowBoundarySetup(false);
    const d = pendingCreateData;
    if (!d) return;
    try {
      const codename = generateCodename([]);
      const { game: g, playerId } = await createGame(d.name, deviceId, d.avatarUrl, codename);
      // Save boundary and safe zones to the new game
      if (boundary) await updateGameBoundary(g.id, boundary);
      for (const zone of zones) await createSafeZone(g.id, zone.name, zone.lng, zone.lat, zone.radius);
      // Store session but don't navigate yet — show codename reveal
      const sess = { gameId: g.id, playerId, name: d.name, codename };
      setSession(sess); setSessionState(sess);
      await loadGameData(g.id);
      setPendingCodename(codename);
      setPendingCreateData(null);
      setShowCodenameReveal(true);
    } catch (e) { showError(e.message || 'Failed to create game'); setPendingCreateData(null); }
  };

  // If host skips boundary setup
  const handleBoundarySkipForCreate = async () => {
    setShowBoundarySetup(false);
    const d = pendingCreateData;
    if (!d) return;
    try {
      const codename = generateCodename([]);
      const { game: g, playerId } = await createGame(d.name, deviceId, d.avatarUrl, codename);
      const sess = { gameId: g.id, playerId, name: d.name, codename };
      setSession(sess); setSessionState(sess);
      await loadGameData(g.id);
      setPendingCodename(codename);
      setPendingCreateData(null);
      setShowCodenameReveal(true);
    } catch (e) { showError(e.message || 'Failed to create game'); setPendingCreateData(null); }
  };

  // ─── JOIN GAME FLOW: photo+name → codename → lobby ───
  const handleJoinGame = async (code, name, photoFile) => {
    try {
      let avatarUrl = null;
      if (photoFile) avatarUrl = await uploadGuestAvatar(deviceId, photoFile);
      const codename = generateCodename([]);
      const { game: g, playerId } = await joinGame(code, name, deviceId, avatarUrl, codename);
      const sess = { gameId: g.id, playerId, name, codename };
      setSession(sess); setSessionState(sess);
      await loadGameData(g.id);
      setPendingCodename(codename);
      setShowCodenameReveal(true);
    } catch (e) { showError(e.message || 'Failed to join game'); }
  };

  // Codename accepted — go to lobby
  const handleCodenameAccept = () => {
    setShowCodenameReveal(false);
    setPage('home');
  };

  const handleCodenameRegenerate = () => { setPendingCodename(generateCodename([pendingCodename])); };

  // ─── LOBBY: edit boundary (separate from create flow) ───
  const [editingBoundary, setEditingBoundary] = useState(false);
  const handleBoundarySaveEdit = async ({ boundary, safeZones: zones }) => {
    try {
      if (session?.gameId) {
        if (boundary) await updateGameBoundary(session.gameId, boundary);
        for (const zone of zones) await createSafeZone(session.gameId, zone.name, zone.lng, zone.lat, zone.radius);
        await loadGameData(session.gameId);
      }
    } catch (e) { showError(e.message); }
    setEditingBoundary(false);
  };

  const handleStartGame = async (countdownSeconds) => {
    try { await startGameWithCountdown(session.gameId, countdownSeconds); await loadGameData(session.gameId); } catch (e) { showError(e.message); }
  };

  const handleSkipCountdown = async () => {
    try { await skipCountdown(session.gameId); await loadGameData(session.gameId); } catch (e) { showError(e.message); }
  };

  const handleCountdownEnd = async () => {
    try { await skipCountdown(session.gameId); await loadGameData(session.gameId); } catch (e) { showError(e.message); }
  };

  const handleEliminate = async (photoFile) => {
    try { await reportElimination(session.gameId, session.playerId, photoFile); await loadGameData(session.gameId); } catch (e) { showError(e.message); }
  };

  const handleVerifyCodename = async (enteredCodename) => {
    try { return await verifyTargetCodename(session.gameId, session.playerId, enteredCodename); } catch (e) { return { valid: false, message: e.message }; }
  };

  const handleDisqualify = async () => {
    try { await disqualifyPlayer(session.gameId, session.playerId); await loadGameData(session.gameId); setOutOfBounds(false); } catch (e) { showError(e.message); }
  };

  const handleLeave = () => { clearSession(); setSessionState(null); setGame(null); setPlayers([]); setFeed([]); setOutOfBounds(false); };

  // ─── RENDER ─────────────────────────────────────────────────

  // Codename reveal (shown after create or join)
  if (showCodenameReveal) {
    return <CodenameReveal codename={pendingCodename} onAccept={handleCodenameAccept} onRegenerate={handleCodenameRegenerate} loading={false} />;
  }

  // Boundary setup during CREATE flow
  if (showBoundarySetup && pendingCreateData && BoundarySetup) {
    return <React.Suspense fallback={<div style={{ textAlign: 'center', paddingTop: 200 }}>Loading map...</div>}>
      <BoundarySetup onSave={handleBoundarySaveForCreate} onSkip={handleBoundarySkipForCreate} />
    </React.Suspense>;
  }

  // Boundary setup during EDIT flow (from lobby)
  if (editingBoundary && BoundarySetup) {
    return <React.Suspense fallback={<div style={{ textAlign: 'center', paddingTop: 200 }}>Loading map...</div>}>
      <BoundarySetup onSave={handleBoundarySaveEdit} onSkip={() => setEditingBoundary(false)} />
    </React.Suspense>;
  }

  // Map overlay during active game
  if (showMap && game && session && GameMap) {
    const me = { id: session.playerId, name: session.name };
    return <React.Suspense fallback={<div style={{ textAlign: 'center', paddingTop: 200 }}>Loading map...</div>}>
      <GameMap game={game} players={players} me={me} onClose={() => setShowMap(false)} />
    </React.Suspense>;
  }

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 200 }}><div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, animation: 'pulse 1.5s infinite' }}>ASSASSINS</div></div>;

  if (page === 'rules') return <RulesPage onBack={() => setPage('home')} />;

  const me = session ? { id: session.playerId, name: session.name } : null;

  if (!session || !game) {
    return <HomePage onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} onRules={() => setPage('rules')} error={error} />;
  }

  // Countdown phase
  if (game.status === 'countdown') {
    return <CountdownScreen game={game} isHost={game.host_id === session.playerId} onSkip={handleSkipCountdown} onTimerEnd={handleCountdownEnd} />;
  }

  // Lobby
  if (game.status === 'lobby') {
    const isHost = game.host_id === session.playerId;
    return (
      <>
        <LobbyPage game={game} players={players} me={me} isHost={isHost} onStart={handleStartGame} />
        {isHost && (
          <Btn variant="secondary" onClick={() => setEditingBoundary(true)}
            style={{ marginBottom: 8, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🗺️ {game.boundary ? 'Edit Map Boundary' : 'Set Map Boundary & Safe Zones'}
          </Btn>
        )}
        <Btn variant="ghost" onClick={handleLeave} style={{ width: '100%', textAlign: 'center', marginTop: 8, paddingBottom: 40 }}>Leave Game</Btn>
      </>
    );
  }

  // Active / Finished game
  return (
    <>
      {outOfBounds && game.status === 'active' && <BoundaryWarning onDisqualify={handleDisqualify} />}
      <div style={{ paddingTop: outOfBounds ? 80 : 0 }}>
        <GamePage game={game} players={players} feed={feed} me={me} myCodename={session?.codename} onEliminate={handleEliminate} onVerifyCodename={handleVerifyCodename} />
        <div style={{ paddingBottom: 40, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {game.status === 'active' && (
            <Btn variant="secondary" onClick={() => setShowMap(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>🗺️ Open Map</Btn>
          )}
          <Btn variant="ghost" onClick={handleLeave} style={{ width: '100%', textAlign: 'center' }}>{game.status === 'finished' ? 'Back to Home' : 'Leave Game'}</Btn>
        </div>
        <Toast message={error} />
      </div>
    </>
  );
}
