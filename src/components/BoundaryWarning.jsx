import React, { useState, useEffect, useRef } from 'react';

export default function BoundaryWarning({ onDisqualify }) {
  const [remaining, setRemaining] = useState(120); // 2 minutes
  const disqualifiedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        if (next <= 0 && !disqualifiedRef.current) {
          disqualifiedRef.current = true;
          onDisqualify();
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= 30;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: urgent ? 'rgba(229,62,62,0.95)' : 'rgba(229,62,62,0.9)',
      color: 'white', padding: '12px 16px',
      paddingTop: 'max(12px, env(safe-area-inset-top))',
      zIndex: 200, textAlign: 'center',
      animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none',
      boxShadow: '0 4px 20px rgba(229,62,62,0.4)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        maxWidth: 480, margin: '0 auto',
      }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
            OUT OF BOUNDS
          </div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            Return to the play area or be disqualified
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700,
          marginLeft: 'auto', minWidth: 56, textAlign: 'right',
        }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      {/* Progress bar */}
      <div style={{
        width: '100%', maxWidth: 480, height: 3, background: 'rgba(255,255,255,0.2)',
        borderRadius: 2, margin: '8px auto 0', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: 'white',
          borderRadius: 2, width: `${(remaining / 120) * 100}%`,
          transition: 'width 1s linear',
        }} />
      </div>
    </div>
  );
}
