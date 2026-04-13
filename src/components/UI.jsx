import React from 'react';

export function Logo({ size = 'large' }) {
  const big = size === 'large';
  return (
    <div style={{ textAlign: 'center', padding: big ? '60px 0 20px' : '24px 0 12px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: big ? 52 : 28, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--text)' }}>ASSASSINS</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: big ? 11 : 9, letterSpacing: '0.3em', color: 'var(--red)', marginTop: big ? 8 : 4, textTransform: 'uppercase' }}>{big ? 'Trust No One' : 'Live Game'}</div>
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', style, disabled }) {
  const base = { cursor: disabled ? 'default' : 'pointer', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', borderRadius: 10, width: '100%', transition: 'all 0.2s', opacity: disabled ? 0.4 : 1 };
  const v = {
    primary: { ...base, background: 'var(--red)', color: 'white', fontWeight: 700, fontSize: 15, padding: '14px 28px', letterSpacing: '0.02em' },
    secondary: { ...base, background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, fontSize: 14, padding: '12px 24px', border: '1px solid var(--border)' },
    ghost: { ...base, background: 'transparent', color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, padding: '8px 16px', width: 'auto' },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...v[variant], ...style }}>{children}</button>;
}

export function Input({ value, onChange, placeholder, style, maxLength, type = 'text' }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength || 30} type={type}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', color: 'var(--text)', fontSize: 15, width: '100%', transition: 'border-color 0.2s', outline: 'none', fontFamily: 'var(--font-body)', ...style }}
      onFocus={e => (e.target.style.borderColor = 'var(--red)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
  );
}

export function Badge({ children, color = 'var(--red)', bg }) {
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, background: bg || `${color}18`, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>{children}</span>;
}

export function Label({ children }) {
  return <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{children}</label>;
}

export function Toast({ message, type = 'error' }) {
  if (!message) return null;
  return <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: type === 'error' ? 'var(--red)' : 'var(--green)', color: 'white', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 99, animation: 'fadeUp 0.3s ease', maxWidth: '90vw', textAlign: 'center' }}>{message}</div>;
}

export function PlayerAvatar({ avatarUrl, emoji, size = 40, style }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0, ...style }} />;
  }
  return <span style={{ fontSize: size * 0.6, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...style }}>{emoji || '👤'}</span>;
}

export function Spinner({ size = 20 }) {
  return <div style={{ width: size, height: size, border: '2px solid var(--border)', borderTopColor: 'var(--red)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />;
}

export function PhotoUpload({ onCapture, previewUrl, onClear, label = 'Add Photo', required = false }) {
  const cameraRef = React.useRef(null);
  const fileRef = React.useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  if (previewUrl) {
    return (
      <div style={{ position: 'relative' }}>
        <img src={previewUrl} alt="" style={{ width: '100%', maxHeight: 200, borderRadius: 12, objectFit: 'cover' }} />
        <button onClick={() => { onClear(); if (cameraRef.current) cameraRef.current.value = ''; if (fileRef.current) fileRef.current.value = ''; }}
          style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
    );
  }

  return (
    <div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => cameraRef.current?.click()}
          style={{ flex: 1, padding: '12px 8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>📷 Camera</button>
        <button onClick={() => fileRef.current?.click()}
          style={{ flex: 1, padding: '12px 8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>🖼️ Gallery</button>
      </div>
      {required && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>Photo required to join</div>}
    </div>
  );
}
