import React, { useState } from 'react';
import { Logo, Btn, Input, Label, Toast, PhotoUpload, Spinner } from '../components/UI';

export default function HomePage({ onCreateGame, onJoinGame, onRules, onSetupBoundary, error }) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoSelect = (file) => { setPhotoFile(file); const r = new FileReader(); r.onload = (e) => setPhotoPreview(e.target.result); r.readAsDataURL(file); };
  const hasPhoto = !!photoPreview;

  const handleCreate = async () => {
    if (!name.trim() || loading || !hasPhoto) return;
    setLoading(true);
    try {
      // Host flow: pass data to parent, which will show boundary setup first
      await onCreateGame(name.trim(), photoFile, true);
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!name.trim() || joinCode.length < 4 || loading || !hasPhoto) return;
    setLoading(true);
    try { await onJoinGame(joinCode, name.trim(), photoFile); } finally { setLoading(false); }
  };

  if (view === 'home') {
    return (
      <>
        <Logo />
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 24px' }}>
          A live elimination game played across the city. Get assigned a target. Hunt them down. Don't get caught.
        </p>

        <div onClick={onRules} className="fade-up" style={{
          background: 'linear-gradient(135deg, rgba(229,62,62,0.1), rgba(212,168,83,0.1))',
          borderRadius: 16, border: '1px solid var(--border)',
          padding: '22px', marginBottom: 24, cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: 'var(--red-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
            }}>📖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>How to Play & Rules</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>New to Assassins? Learn the game, map features, safe zones, and strategy tips</div>
            </div>
            <span style={{ color: 'var(--text-dim)', fontSize: 20 }}>→</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
          <Btn onClick={() => setView('create')}>Create a Game</Btn>
          <Btn variant="secondary" onClick={() => setView('join')}>Join with Code</Btn>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)', paddingBottom: 40 }}>
          min 3 players · works on any device
        </div>
        <Toast message={error} />
      </>
    );
  }

  const isCreate = view === 'create';
  return (
    <>
      <Logo />
      <div className="fade-up">
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20, marginBottom: 20 }}>
          <Label>Your Photo (so targets can recognize you)</Label>
          <PhotoUpload onCapture={handlePhotoSelect} previewUrl={photoPreview} onClear={() => { setPhotoFile(null); setPhotoPreview(null); }} required={true} />
        </div>

        {!isCreate && (
          <>
            <Label>Game Code</Label>
            <Input value={joinCode} onChange={v => setJoinCode(v.toUpperCase())} placeholder="e.g. A3X9K2" maxLength={6} style={{ fontFamily: 'var(--font-mono)', fontSize: 22, textAlign: 'center', letterSpacing: '0.2em' }} />
            <div style={{ height: 16 }} />
          </>
        )}

        <Label>Your Name</Label>
        <Input value={name} onChange={setName} placeholder="Enter your real name" />
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          {isCreate
            ? "You'll set up the game boundary next, then receive your secret codename."
            : "Your name is visible to other players. You'll receive a secret codename next."
          }
        </div>
        <div style={{ height: 16 }} />
        <Btn onClick={isCreate ? handleCreate : handleJoin} disabled={!name.trim() || loading || !hasPhoto || (!isCreate && joinCode.length < 4)}>
          {loading ? <Spinner /> : isCreate ? 'Next: Set Game Area →' : 'Join Game →'}
        </Btn>
        <div style={{ height: 12 }} />
        <Btn variant="ghost" onClick={() => { setView('home'); setPhotoFile(null); setPhotoPreview(null); }} style={{ width: '100%', textAlign: 'center' }}>← Back</Btn>
      </div>
      <Toast message={error} />
    </>
  );
}
