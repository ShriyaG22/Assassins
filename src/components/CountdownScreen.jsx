import React, { useState, useEffect, useRef } from 'react';
import { Btn, Badge } from './UI';

export default function CountdownScreen({ game, isHost, onSkip, onTimerEnd }) {
  const [remaining, setRemaining] = useState(0);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!game.countdown_started_at || !game.countdown_seconds) return;
    const startTime = new Date(game.countdown_started_at).getTime();
    const endTime = startTime + game.countdown_seconds * 1000;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endTime - now) / 1000));
      setRemaining(left);
      if (left <= 0 && !endedRef.current) {
        endedRef.current = true;
        onTimerEnd();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [game.countdown_started_at, game.countdown_seconds]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = game.countdown_seconds > 0 ? 1 - (remaining / game.countdown_seconds) : 1;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg)', zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Pulsing background glow */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 350, height: 350, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(212,168,83,${0.1 + progress * 0.15}) 0%, transparent 70%)`,
        animation: 'pulse 2s ease-in-out infinite',
      }} />

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 360, width: '100%' }}>
        {/* Status badge */}
        <div style={{ marginBottom: 24 }}>
          <Badge color="var(--gold)">Game Starting</Badge>
        </div>

        {/* SPREAD OUT message */}
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 900,
          color: 'var(--text)', letterSpacing: '0.05em', marginBottom: 8,
          textShadow: '0 0 40px rgba(212,168,83,0.3)',
        }}>
          SPREAD OUT!
        </div>

        <div style={{
          fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6,
        }}>
          Get moving! You have limited time to spread around the area before targets are revealed.
        </div>

        {/* Timer display */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 700,
          color: remaining <= 10 ? 'var(--red)' : 'var(--text)',
          letterSpacing: '0.05em', marginBottom: 8,
          transition: 'color 0.3s',
          animation: remaining <= 10 ? 'pulse 1s ease-in-out infinite' : 'none',
        }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 4, background: 'var(--border)', borderRadius: 2,
          marginBottom: 32, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: remaining <= 10 ? 'var(--red)' : 'var(--gold)',
            borderRadius: 2, width: `${progress * 100}%`,
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>

        {/* Tips */}
        <div style={{
          background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
          padding: 16, marginBottom: 24, textAlign: 'left',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            While you wait
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            🏃 Move away from other players<br />
            🗺️ Stay inside the game boundary<br />
            🔐 Memorize your codename<br />
            📱 Keep the app open
          </div>
        </div>

        {/* Host skip button */}
        {isHost && (
          <Btn onClick={onSkip}>
            ⚡ Start Game Now
          </Btn>
        )}

        {!isHost && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
            Waiting for timer to end or host to start...
          </div>
        )}
      </div>
    </div>
  );
}
