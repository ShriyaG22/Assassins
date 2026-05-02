import React, { useState, useEffect } from 'react';
import { Btn, Spinner } from './UI';

export default function CodenameReveal({ codename, onAccept, onRegenerate, loading }) {
  const [revealed, setRevealed] = useState(false);
  const [displayText, setDisplayText] = useState('');

  // Scramble animation on mount and when codename changes
  useEffect(() => {
    setRevealed(false);
    setDisplayText('');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let frame = 0;
    const totalFrames = 20;
    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplayText(codename);
        setRevealed(true);
        clearInterval(interval);
      } else {
        // Progressively reveal real characters
        const progress = frame / totalFrames;
        let scrambled = '';
        for (let i = 0; i < codename.length; i++) {
          if (codename[i] === ' ') { scrambled += ' '; continue; }
          if (i / codename.length < progress) {
            scrambled += codename[i];
          } else {
            scrambled += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        setDisplayText(scrambled);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [codename]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg)', zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Background glow effect */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(229,62,62,0.15) 0%, transparent 70%)',
        animation: 'pulse 3s ease-in-out infinite',
      }} />

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 360 }}>
        {/* Label */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.3em',
          color: 'var(--red)', textTransform: 'uppercase', marginBottom: 16,
          animation: 'fadeUp 0.5s ease',
        }}>
          Your Codename Has Been Assigned
        </div>

        {/* Codename display */}
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 900,
          color: revealed ? 'var(--text)' : 'var(--text-dim)',
          letterSpacing: '0.02em', lineHeight: 1.2, marginBottom: 8,
          transition: 'color 0.3s ease',
          textShadow: revealed ? '0 0 40px rgba(229,62,62,0.3)' : 'none',
        }}>
          {displayText || '...'}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 13, color: 'var(--text-dim)', marginBottom: 40, lineHeight: 1.6,
          opacity: revealed ? 1 : 0, transition: 'opacity 0.5s ease 0.3s',
        }}>
          This is your secret identity. Guard it with your life.<br />
          An assassin must know your codename to eliminate you.
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10, width: '100%',
          opacity: revealed ? 1 : 0, transition: 'opacity 0.5s ease 0.5s',
        }}>
          <Btn onClick={onAccept} disabled={!revealed || loading}>
            {loading ? <Spinner /> : 'Accept Codename →'}
          </Btn>
          <Btn variant="ghost" onClick={onRegenerate} disabled={loading}
            style={{ width: '100%', textAlign: 'center' }}>
            🎲 Generate a new one
          </Btn>
        </div>

        {/* Decorative line */}
        <div style={{
          width: 60, height: 2, background: 'var(--red)', margin: '30px auto 0',
          opacity: revealed ? 0.5 : 0, transition: 'opacity 0.5s ease 0.6s',
        }} />
      </div>
    </div>
  );
}
