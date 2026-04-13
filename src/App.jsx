import React, { useState, useEffect } from 'react';
import { getDeviceId, getSession, setSession, clearSession } from './lib/game';
import { getUser, onAuthChange, getProfile, uploadGuestAvatar, signOut } from './lib/auth';
import { createGame, joinGame, fetchGame, fetchPlayers, fetchFeed, startGame, reportElimination, subscribeToGame } from './lib/api';
import { updateGameBoundary, createSafeZone } from './lib/mapApi';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import GameMap from './components/GameMap';
import BoundarySetup from './components/BoundarySetup';
import RulesPage from './pages/RulesPage';
import { Btn, Toast } from './components/UI';

export default function App() {
  const [authUser, setAuthUser] = useState(undefined); // undefined=loading, null=no user, object=user
  const [profile, setProfile] = useState(null);
  const [session, setSessionState] = useState(null);
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState('home'); // home | auth | profile | viewProfile
  const [viewProfileId, setViewProfileId] = useState(null);
  const [showNudge, setShowNudge] = useState(false);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('assassins-guest') === 'true');
  const [showMap, setShowMap] = useState(false);
  const [showBoundarySetup, setShowBoundarySetup] = useState(false);
  const [pendingGameData, setPendingGameData] = useState(null);

  const deviceId = getDeviceId();

  // ─── Auth listener ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setAuthUser(user || null);
      if (user) {
        try {
          const p = await getProfile(user.id);
          setProfile(p);
        } catch { setProfile(null); }
      } else {
        setProfile(null);
      }
    });
    // Also check immediately
    (async () => {
      try {
        const user = await getUser();
        setAuthUser(user || null);
        if (user) {
          const p = await getProfile(user.id);
          setProfile(p);
        }
      } catch { setAuthUser(null); }
    })();
    return unsub;
  }, []);

  // ─── Load saved game session ────────────────────────────────
  useEffect(() => {
    if (authUser === undefined) return; // still loading auth
    const saved = getSession();
    if (saved?.gameId) {
      setSessionState(saved);
      loadGameData(saved.gameId).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [authUser]);

  // ─── Realtime + polling fallback ─────────────────────────────
  useEffect(() => {
    if (!session?.gameId) return;
    
    // Subscribe to realtime
    const unsub = subscribeToGame(session.gameId, {
      onGameUpdate: (g) => setGame(g),
      onPlayersUpdate: async () => { const p = await fetchPlayers(session.gameId); setPlayers(p); },
      onFeedUpdate: async () => {
        const f = await fetchFeed(session.gameId);
        setFeed(f);
        const g = await fetchGame(session.gameId);
        setGame(g);
      },
    });

    // Polling fallback every 5 seconds (realtime can be unreliable on free tier)
    const poll = setInterval(async () => {
      try {
        const [g, p, f] = await Promise.all([fetchGame(session.gameId), fetchPlayers(session.gameId), fetchFeed(session.gameId)]);
        setGame(g); setPlayers(p); setFeed(f);
      } catch (e) { console.error('Poll failed', e); }
    }, 5000);

    return () => { unsub(); clearInterval(poll); };
  }, [session?.gameId]);

  // ─── Helpers ────────────────────────────────────────────────
  const loadGameData = async (gameId) => {
    try {
      const [g, p, f] = await Promise.all([fetchGame(gameId), fetchPlayers(gameId), fetchFeed(gameId)]);
      setGame(g); setPlayers(p); setFeed(f);
    } catch { clearSession(); setSessionState(null); }
  };

  const showError = (msg) => { setError(msg); setTimeout(() => setError(null), 3000); };

  // ─── Actions ────────────────────────────────────────────────
  const handleCreateGame = async (name, photoFile) => {
    try {
      let avatarUrl = profile?.avatar_url || null;
      if (photoFile) {
        avatarUrl = await uploadGuestAvatar(deviceId, photoFile);
      }
      const { game: g, playerId } = await createGame(name, deviceId, avatarUrl, authUser?.id || null);
      const sess = { gameId: g.id, playerId, name };
      setSession(sess); setSessionState(sess);
      await loadGameData(g.id);
      setPage('home');
    } catch (e) { showError(e.message || 'Failed to create game'); }
  };

  const handleBoundarySave = async ({ boundary, safeZones: zones }) => {
    try {
      if (pendingGameData?.gameId) {
        if (boundary) {
          await updateGameBoundary(pendingGameData.gameId, boundary);
        }
        for (const zone of zones) {
          await createSafeZone(pendingGameData.gameId, zone.name, zone.lng, zone.lat, zone.radius);
        }
        await loadGameData(pendingGameData.gameId);
      }
    } catch (e) { showError(e.message || 'Failed to save map settings'); }
    setShowBoundarySetup(false);
    setPendingGameData(null);
  };

  const handleJoinGame = async (code, name, photoFile) => {
    try {
      let avatarUrl = profile?.avatar_url || null;
      if (photoFile) {
        avatarUrl = await uploadGuestAvatar(deviceId, photoFile);
      }
      const { game: g, playerId } = await joinGame(code, name, deviceId, avatarUrl, authUser?.id || null);
      const sess = { gameId: g.id, playerId, name };
      setSession(sess); setSessionState(sess);
      await loadGameData(g.id);
      setPage('home');
    } catch (e) { showError(e.message || 'Failed to join game'); }
  };

  const handleStartGame = async () => {
    try { await startGame(session.gameId); await loadGameData(session.gameId); } catch (e) { showError(e.message); }
  };

  const handleEliminate = async (photoFile) => {
    try { await reportElimination(session.gameId, session.playerId, photoFile); await loadGameData(session.gameId); } catch (e) { showError(e.message); }
  };

  const handleLeave = () => {
    // Show nudge if guest
    if (!authUser && game?.status === 'finished') {
      setShowNudge(true);
      return;
    }
    clearSession(); setSessionState(null); setGame(null); setPlayers([]); setFeed([]);
  };

  const handleViewProfile = (userId) => {
    setViewProfileId(userId);
    setPage('viewProfile');
  };

  const handleLogin = async (user) => {
    setAuthUser(user);
    try {
      const p = await getProfile(user.id);
      setProfile(p);
    } catch {}
    setPage('home');
  };

  const handleSignOut = async () => {
    await signOut();
    setAuthUser(null);
    setProfile(null);
    setIsGuest(false);
    localStorage.removeItem('assassins-guest');
  };

  // ─── Boundary setup overlay ──────────────────────────────────
  if (showBoundarySetup) {
    return <BoundarySetup onSave={handleBoundarySave} onSkip={() => { setShowBoundarySetup(false); setPendingGameData(null); }} />;
  }

  // ─── Map overlay ────────────────────────────────────────────
  if (showMap && game && session) {
    const me = { id: session.playerId, name: session.name };
    return <GameMap game={game} players={players} me={me} onClose={() => setShowMap(false)} />;
  }

  // ─── Loading ────────────────────────────────────────────────
  if (loading || authUser === undefined) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 200 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, animation: 'pulse 1.5s infinite' }}>ASSASSINS</div>
      </div>
    );
  }

  // ─── Auth page ──────────────────────────────────────────────
  // Show auth screen if: user explicitly navigated to it, OR no auth user and not a guest
  if (page === 'auth' || (!authUser && !isGuest && !session)) {
    return <AuthPage onLogin={handleLogin} onSkip={() => { setIsGuest(true); localStorage.setItem('assassins-guest', 'true'); setPage('home'); }} />
  }

  // ─── Rules page ─────────────────────────────────────────────
  if (page === 'rules') {
    return <RulesPage onBack={() => setPage('home')} />;
  }

  // ─── Profile pages ─────────────────────────────────────────
  if (page === 'profile' && authUser) {
    return <ProfilePage user={authUser} onBack={() => setPage('home')} />;
  }
  if (page === 'viewProfile') {
    return <ProfilePage user={authUser} viewUserId={viewProfileId} onBack={() => setPage(session?.gameId ? 'home' : 'home')} />;
  }

  // ─── Guest nudge after game ─────────────────────────────────
  if (showNudge) {
    return (
      <>
        <div style={{ textAlign: 'center', paddingTop: 80 }} className="fade-up">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Great game!</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 300, margin: '0 auto 28px' }}>
            Want to save your stats and build a profile? Sign up with your phone number — takes 30 seconds.
          </p>
          <Btn onClick={() => { setShowNudge(false); setPage('auth'); }}>Save My Stats →</Btn>
          <div style={{ height: 12 }} />
          <Btn variant="ghost" onClick={() => {
            setShowNudge(false); clearSession(); setSessionState(null); setGame(null); setPlayers([]); setFeed([]);
          }} style={{ width: '100%', textAlign: 'center' }}>
            Skip for now
          </Btn>
        </div>
      </>
    );
  }

  const me = session ? { id: session.playerId, name: session.name } : null;

  // ─── No game → Home ────────────────────────────────────────
  if (!session || !game) {
    return (
      <HomePage
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        error={error}
        user={authUser}
        profile={profile}
        onOpenProfile={() => authUser ? setPage('profile') : setPage('auth')}
        onSignOut={handleSignOut}
        onRules={() => setPage('rules')}
      />
    );
  }

  // ─── Lobby ─────────────────────────────────────────────────
  if (game.status === 'lobby') {
    const isHost = game.host_id === session.playerId;
    return (
      <>
        <LobbyPage game={game} players={players} me={me} isHost={isHost}
          onStart={handleStartGame} onViewProfile={handleViewProfile} />
        {isHost && (
          <Btn variant="secondary" onClick={() => { setPendingGameData({ gameId: game.id }); setShowBoundarySetup(true); }}
            style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🗺️ {game.boundary ? 'Edit Map Boundary' : 'Set Map Boundary & Safe Zones'}
          </Btn>
        )}
        <Btn variant="ghost" onClick={() => { clearSession(); setSessionState(null); setGame(null); }}
          style={{ width: '100%', textAlign: 'center', marginTop: 8, paddingBottom: 40 }}>Leave Game</Btn>
      </>
    );
  }

  // ─── Active / Finished game ────────────────────────────────
  return (
    <>
      <GamePage game={game} players={players} feed={feed} me={me}
        onEliminate={handleEliminate} onViewProfile={handleViewProfile} />
      <div style={{ paddingBottom: 40, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {game.status === 'active' && (
          <Btn variant="secondary" onClick={() => setShowMap(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🗺️ Open Map
          </Btn>
        )}
        <Btn variant="ghost" onClick={handleLeave} style={{ width: '100%', textAlign: 'center' }}>
          {game.status === 'finished' ? 'Back to Home' : 'Leave Game'}
        </Btn>
      </div>
      <Toast message={error} />
    </>
  );
}
