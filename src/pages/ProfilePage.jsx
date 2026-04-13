import React, { useState, useEffect } from 'react';
import { Logo, Btn, Input, Label, Badge, PlayerAvatar, PhotoUpload, Spinner, Toast } from '../components/UI';
import { getProfile, updateProfile, uploadAvatar } from '../lib/auth';

export default function ProfilePage({ user, onBack, viewUserId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isOwnProfile = !viewUserId || viewUserId === user?.id;
  const targetId = viewUserId || user?.id;

  useEffect(() => {
    if (!targetId) return;
    (async () => {
      try {
        const p = await getProfile(targetId);
        setProfile(p);
        setName(p.display_name || '');
      } catch (e) {
        setError('Could not load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [targetId]);

  const handlePhotoSelect = (file) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      let avatarUrl = profile.avatar_url;
      if (photoFile) {
        avatarUrl = await uploadAvatar(user.id, photoFile);
      }
      const updated = await updateProfile(user.id, { display_name: name.trim(), avatar_url: avatarUrl });
      setProfile(updated);
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Logo size="small" />
        <div style={{ textAlign: 'center', padding: 60 }}><Spinner size={32} /></div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Logo size="small" />
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Profile not found</div>
        <Btn variant="ghost" onClick={onBack} style={{ width: '100%', textAlign: 'center' }}>← Back</Btn>
      </>
    );
  }

  const winRate = profile.games_played > 0 ? Math.round((profile.games_won / profile.games_played) * 100) : 0;

  return (
    <>
      <Logo size="small" />
      <div className="fade-up">
        {/* Avatar + Name */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <PlayerAvatar avatarUrl={photoPreview || profile.avatar_url} size={100}
              style={{ border: '3px solid var(--border-light)' }} />
          </div>
          {!editing ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{profile.display_name}</div>
              {profile.phone && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{profile.phone}</div>
              )}
            </>
          ) : (
            <div style={{ maxWidth: 280, margin: '0 auto' }}>
              <Input value={name} onChange={setName} placeholder="Display name" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24,
        }}>
          {[
            { label: 'Games Played', value: profile.games_played, color: 'var(--text)' },
            { label: 'Wins', value: profile.games_won, color: 'var(--gold)' },
            { label: 'Total Kills', value: profile.total_kills, color: 'var(--red)' },
            { label: 'Win Rate', value: `${winRate}%`, color: 'var(--green)' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
              padding: '16px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-display)', color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Edit controls (own profile only) */}
        {isOwnProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {editing ? (
              <>
                <Label>Profile Photo</Label>
                <PhotoUpload
                  onCapture={handlePhotoSelect}
                  previewUrl={photoPreview}
                  onClear={() => { setPhotoFile(null); setPhotoPreview(null); }}
                />
                <div style={{ height: 8 }} />
                <Btn onClick={handleSave} disabled={!name.trim() || saving}>
                  {saving ? <Spinner /> : 'Save Changes'}
                </Btn>
                <Btn variant="secondary" onClick={() => { setEditing(false); setName(profile.display_name); setPhotoFile(null); setPhotoPreview(null); }}>
                  Cancel
                </Btn>
              </>
            ) : (
              <Btn variant="secondary" onClick={() => setEditing(true)}>Edit Profile</Btn>
            )}
          </div>
        )}

        <div style={{ height: 16 }} />
        <Btn variant="ghost" onClick={onBack} style={{ width: '100%', textAlign: 'center' }}>← Back</Btn>
      </div>
      <Toast message={error} />
    </>
  );
}
