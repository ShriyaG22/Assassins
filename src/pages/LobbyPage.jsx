import React, { useState } from 'react';
import { Logo, Btn, Badge, PlayerAvatar } from '../components/UI';

export default function LobbyPage({ game, players, me, isHost, onStart }) {
  const [countdownMinutes, setCountdownMinutes] = useState(3);
  const canStart = players.length >= 3;

  return (
    <>
      <Logo size="small" />
      <div className="fade-up" style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Badge color="var(--gold)">Waiting for players</Badge>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>{players.length} joined</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Share this code</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, letterSpacing: '6px', color: 'var(--text)' }}>{game.code}</div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Players</div>
        {players.map((p, i) => (
          <div key={p.id} className="slide-in" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            background: p.id === me.id ? 'var(--red-glow)' : 'transparent',
            borderRadius: 10, marginBottom: 3, animationDelay: `${i * 0.05}s`,
          }}>
            <PlayerAvatar avatarUrl={p.avatar_url} emoji={p.avatar} size={36} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{p.name}</span>
            {p.id === game.host_id && <Badge color="var(--gold)">Host</Badge>}
            {p.id === me.id && p.id !== game.host_id && <Badge color="var(--text-dim)">You</Badge>}
          </div>
        ))}
      </div>

      {/* Timer setting for host */}
      {isHost && (
        <div style={{
          background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
          padding: 18, marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            ⏱️ Spread-out Timer
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
            Give players time to spread around the area before targets are revealed. Set to 0 to start immediately.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={0} max={10} step={1} value={countdownMinutes}
              onChange={e => setCountdownMinutes(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--gold)' }}
            />
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)',
              minWidth: 50, textAlign: 'right',
            }}>
              {countdownMinutes === 0 ? 'None' : `${countdownMinutes} min`}
            </div>
          </div>
        </div>
      )}

      {isHost ? (
        <Btn onClick={() => onStart(countdownMinutes * 60)} disabled={!canStart}>
          {canStart
            ? countdownMinutes > 0
              ? `Start (${countdownMinutes} min countdown)`
              : 'Start Game Now'
            : 'Need at least 3 players'}
        </Btn>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 8 }}>
          Waiting for host to start the game...
        </div>
      )}
    </>
  );
}
