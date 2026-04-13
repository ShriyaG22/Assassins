import React, { useState } from 'react';
import { Logo, Btn, Input, Label, Toast, PhotoUpload, PlayerAvatar, Spinner } from '../components/UI';

export default function HomePage({ onCreateGame, onJoinGame, error, user, profile, onOpenProfile, onSignOut, onRules }) {
  const [name, setName] = useState(profile?.display_name || '');
  const [joinCode, setJoinCode] = useState('');
  const [view, setView] = useState('home'); // home | create | join
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPhotoChange, setShowPhotoChange] = useState(false);

  const avatarUrl = profile?.avatar_url || null;
  const hasPhoto = !!avatarUrl || !!photoPreview;

  const handlePhotoSelect = (file) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!name.trim() || loading || !hasPhoto) return;
    setLoading(true);
    try { await onCreateGame(name.trim(), photoFile); } finally { setLoading(false); }
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

        {/* User bar if logged in */}
        {user && profile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20,
          }}>
            <PlayerAvatar avatarUrl={profile.avatar_url} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.display_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {profile.games_won}W · {profile.total_kills} kills
              </div>
            </div>
            <button onClick={onOpenProfile} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px',
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>Profile</button>
          </div>
        )}

        {/* Guest bar — nudge to sign up */}
        {!user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border-light)', marginBottom: 20,
          }}>
            <span style={{ fontSize: 24 }}>👤</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Playing as Guest</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Sign in to track your stats</div>
            </div>
            <button onClick={onOpenProfile} style={{
              background: 'var(--red)', border: 'none', borderRadius: 8, padding: '6px 12px',
              color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>Sign In</button>
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 40px' }}>
          A live elimination game played across the city. Get assigned a target. Hunt them down. Don't get caught.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
          <Btn onClick={() => setView('create')}>Create a Game</Btn>
          <Btn variant="secondary" onClick={() => setView('join')}>Join with Code</Btn>
        </div>

        {/* How to Play */}
        <button onClick={onRules} style={{
          width: '100%', padding: '12px', background: 'none',
          border: '1px dashed var(--border-light)', borderRadius: 10,
          color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 16,
          transition: 'all 0.2s',
        }}>
          📖 How to Play & Rules
        </button>

        {/* Sign out for logged-in users */}
        {user && (
          <div style={{ textAlign: 'center', paddingBottom: 20 }}>
            <button onClick={onSignOut} style={{
              background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12,
              cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 8,
            }}>Sign Out</button>
          </div>
        )}

        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)', paddingBottom: 40 }}>
          min 3 players · works on any device
        </div>
        <Toast message={error} />
      </>
    );
  }

  // Create / Join views share photo upload + name
  const isCreate = view === 'create';
  const hasProfilePhoto = !!avatarUrl;
  const hasProfileName = !!profile?.display_name;

  return (
    <>
      <Logo />
      <div className="fade-up">
        {/* Profile preview for signed-in users with profile set up */}
        {user && hasProfilePhoto && hasProfileName && !showPhotoChange ? (
          <div style={{
            background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
            padding: 20, marginBottom: 20,
          }}>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 12,
            }}>Playing as</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <PlayerAvatar avatarUrl={photoPreview || avatarUrl} size={56} style={{ border: '2px solid var(--border-light)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{name || profile.display_name}</div>
                <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>✓ Profile photo ready</div>
              </div>
              <button onClick={() => setShowPhotoChange(true)} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px',
                color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>Change</button>
            </div>
          </div>
        ) : (
          /* Photo upload for guests or when user wants to change */
          <div style={{
            background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
            padding: 20, marginBottom: 20,
          }}>
            <Label>Your Photo (so targets can recognize you)</Label>
            {avatarUrl && !photoPreview && !showPhotoChange ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PlayerAvatar avatarUrl={avatarUrl} size={56} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Using profile photo</div>
                  <button onClick={() => setShowPhotoChange(true)} style={{
                    background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 11,
                    cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '4px 0',
                    textDecoration: 'underline',
                  }}>Use a different photo</button>
                </div>
              </div>
            ) : (
              <PhotoUpload
                onCapture={handlePhotoSelect}
                previewUrl={photoPreview}
                onClear={() => { setPhotoFile(null); setPhotoPreview(null); }}
                required={!avatarUrl}
              />
            )}
            {showPhotoChange && avatarUrl && !photoPreview && (
              <button onClick={() => { setShowPhotoChange(false); setPhotoFile(null); setPhotoPreview(null); }} style={{
                background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 11,
                cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '8px 0', textDecoration: 'underline',
              }}>Keep profile photo instead</button>
            )}
          </div>
        )}

        {!isCreate && (
          <>
            <Label>Game Code</Label>
            <Input value={joinCode} onChange={v => setJoinCode(v.toUpperCase())} placeholder="e.g. A3X9K2" maxLength={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 22, textAlign: 'center', letterSpacing: '0.2em' }} />
            <div style={{ height: 16 }} />
          </>
        )}

        {/* Only show codename field if no profile name, or let them edit it */}
        {user && hasProfileName && !showPhotoChange ? (
          /* Name is auto-populated, show small edit option */
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>Codename</Label>
            </div>
            <Input value={name} onChange={setName} placeholder="Your codename" />
          </div>
        ) : (
          <>
            <Label>Your Codename</Label>
            <Input value={name} onChange={setName} placeholder={isCreate ? 'e.g. Shadow, Viper...' : 'e.g. Ghost, Raven...'} />
            <div style={{ height: 16 }} />
          </>
        )}

        <Btn
          onClick={isCreate ? handleCreate : handleJoin}
          disabled={!name.trim() || loading || !hasPhoto || (!isCreate && joinCode.length < 4)}
        >
          {loading ? <Spinner /> : isCreate ? 'Create Game →' : 'Join Game →'}
        </Btn>
        <div style={{ height: 12 }} />
        <Btn variant="ghost" onClick={() => { setView('home'); setPhotoFile(null); setPhotoPreview(null); setShowPhotoChange(false); }} style={{ width: '100%', textAlign: 'center' }}>← Back</Btn>
      </div>
      <Toast message={error} />
    </>
  );
}
