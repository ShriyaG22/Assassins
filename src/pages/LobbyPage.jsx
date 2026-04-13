import React from 'react';
import { Logo, Btn, Badge, PlayerAvatar } from '../components/UI';

export default function LobbyPage({ game, players, me, isHost, onStart, onViewProfile }) {
  const canStart = players.length >= 3;
  return (
    <>
      <Logo size="small" />
      <div className="fade-up" style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Badge color="var(--gold)">Waiting for players</Badge>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{players.length} joined</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Share this code</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--text)' }}>{game.code}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Players</div>
        {players.map((p, i) => (
          <div key={p.id}
            onClick={() => p.auth_user_id && onViewProfile?.(p.auth_user_id)}
            className="slide-in" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              background: p.id === me.id ? 'var(--red-glow)' : 'transparent',
              borderRadius: 10, marginBottom: 4, animationDelay: `${i * 0.05}s`,
              cursor: p.auth_user_id ? 'pointer' : 'default',
            }}>
            <PlayerAvatar avatarUrl={p.avatar_url} emoji={p.avatar} size={40} />
            <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{p.name}</span>
            {p.id === game.host_id && <Badge color="var(--gold)">Host</Badge>}
            {p.id === me.id && p.id !== game.host_id && <Badge color="var(--text-dim)">You</Badge>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 40 }}>
        {isHost ? (
          <Btn onClick={onStart} disabled={!canStart}>
            {canStart ? `Start Game (${players.length} players)` : 'Need at least 3 players'}
          </Btn>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 8 }}>Waiting for host to start the game...</div>
        )}
      </div>
    </>
  );
}
