import React, { useState } from 'react';
import { Logo, Btn, Badge, Input, PlayerAvatar, PhotoUpload, Spinner } from '../components/UI';
import { timeAgo } from '../lib/game';

export default function GamePage({ game, players, feed, me, myCodename, onEliminate, onVerifyCodename }) {
  const [tab, setTab] = useState('target');
  const [confirmKill, setConfirmKill] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [codenameInput, setCodenameInput] = useState('');
  const [codenameVerified, setCodenameVerified] = useState(false);
  const [codenameAttempts, setCodenameAttempts] = useState(0);
  const [codenameError, setCodenameError] = useState('');
  const [codenameRejected, setCodenameRejected] = useState(false);

  const isAlive = !!game.assignments?.[me.id];
  const targetId = game.assignments?.[me.id];
  const target = players.find(p => p.id === targetId);
  const myKills = players.find(p => p.id === me.id)?.kills || 0;
  const alive = Object.keys(game.assignments || {}).length;
  const isWinner = game.status === 'finished' && isAlive;

  const handlePhotoSelect = (file) => { setPhotoFile(file); const r = new FileReader(); r.onload = (e) => setPhotoPreview(e.target.result); r.readAsDataURL(file); };
  const clearPhoto = () => { setPhotoFile(null); setPhotoPreview(null); };

  const handleVerifyCodename = async () => {
    if (!codenameInput.trim()) return;
    const result = await onVerifyCodename(codenameInput);
    if (result.valid) {
      setCodenameVerified(true);
      setCodenameError('');
    } else {
      const newAttempts = codenameAttempts + 1;
      setCodenameAttempts(newAttempts);
      if (newAttempts >= 3) {
        setCodenameRejected(true);
        setCodenameError('Kill report rejected — 3 failed attempts. You need to learn your target\'s codename.');
      } else {
        setCodenameError(`Incorrect codename. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? '' : 's'} remaining.`);
      }
      setCodenameInput('');
    }
  };

  const handleKill = async () => {
    if (!photoFile || !codenameVerified) return;
    setUploading(true);
    try { await onEliminate(photoFile); setConfirmKill(false); clearPhoto(); resetCodename(); } finally { setUploading(false); }
  };

  const resetCodename = () => {
    setCodenameInput(''); setCodenameVerified(false); setCodenameAttempts(0); setCodenameError(''); setCodenameRejected(false);
  };

  const handleCancel = () => { setConfirmKill(false); clearPhoto(); resetCodename(); };

  return (
    <>
      {/* Codename banner at the very top */}
      {myCodename && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(229,62,62,0.12), rgba(212,168,83,0.08))',
          borderRadius: 12, border: '1px solid rgba(229,62,62,0.2)',
          padding: '10px 16px', marginBottom: 12, textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'var(--red)', textTransform: 'uppercase', marginBottom: 2 }}>Your Secret Codename</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{myCodename}</div>
        </div>
      )}

      <Logo size="small" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Badge color={isAlive ? 'var(--green)' : 'var(--red)'}>{isWinner ? '👑 WINNER' : isAlive ? '● Alive' : '☠ Eliminated'}</Badge>
        <Badge color="var(--text-muted)" bg="var(--surface)">{alive} remaining</Badge>
        <Badge color="var(--gold)" bg="var(--gold-glow)">{myKills} kills</Badge>
      </div>
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {['target', 'feed', 'players'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: tab === t ? 'var(--card)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-dim)', border: tab === t ? '1px solid var(--border)' : '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {tab === 'target' && (
        <div className="fade-up">
          {isAlive && target && !isWinner ? (
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Your target</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <PlayerAvatar avatarUrl={target.avatar_url} emoji={target.avatar} size={100} style={{ border: '3px solid var(--red)' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{target.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 28 }}>ID: {target.id.slice(0, 6).toUpperCase()}</div>

              {!confirmKill ? (
                <Btn onClick={() => setConfirmKill(true)}>Report Elimination</Btn>
              ) : codenameRejected ? (
                <div>
                  <div style={{ background: 'rgba(229,62,62,0.1)', borderRadius: 12, border: '1px solid rgba(229,62,62,0.3)', padding: 20, marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🚫</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Kill Report Rejected</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      You failed to provide the correct codename in 3 attempts. You need to find out your target's secret codename before you can eliminate them.
                    </div>
                  </div>
                  <Btn variant="secondary" onClick={handleCancel}>Dismiss</Btn>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Confirm you eliminated <strong style={{ color: 'var(--text)' }}>{target.name}</strong>?
                  </div>

                  {/* Step 1: Codename verification */}
                  <div style={{
                    background: 'var(--bg)', borderRadius: 12,
                    border: codenameVerified ? '1px solid var(--green)' : '1px dashed var(--border-light)',
                    padding: 16, marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 11, color: codenameVerified ? 'var(--green)' : 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                      {codenameVerified ? '✓ Codename Verified' : '🔐 Step 1: Enter Target\'s Codename'}
                    </div>
                    {!codenameVerified ? (
                      <>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.5 }}>
                          You must know your target's secret codename to confirm the kill.
                        </div>
                        <Input value={codenameInput} onChange={setCodenameInput} placeholder="e.g. Silent Cobra" style={{ fontSize: 14, marginBottom: 8, textAlign: 'center' }} />
                        {codenameError && (
                          <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8, fontWeight: 600 }}>⚠ {codenameError}</div>
                        )}
                        <Btn onClick={handleVerifyCodename} disabled={!codenameInput.trim()} style={{ padding: 10, fontSize: 13 }}>
                          Verify Codename ({3 - codenameAttempts} attempts left)
                        </Btn>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--green)' }}>Codename confirmed. Proceed to upload evidence.</div>
                    )}
                  </div>

                  {/* Step 2: Photo evidence */}
                  <div style={{
                    background: 'var(--bg)', borderRadius: 12,
                    border: photoFile ? '1px solid var(--green)' : '1px dashed var(--border-light)',
                    padding: 16, marginBottom: 16,
                    opacity: codenameVerified ? 1 : 0.4,
                    pointerEvents: codenameVerified ? 'auto' : 'none',
                  }}>
                    <div style={{ fontSize: 11, color: photoFile ? 'var(--green)' : 'var(--red)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                      {photoFile ? '✓ Evidence Attached' : '📸 Step 2: Upload Evidence Photo'}
                    </div>
                    <PhotoUpload onCapture={handlePhotoSelect} previewUrl={photoPreview} onClear={clearPhoto} required={true} />
                    {!photoFile && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>Photo evidence is mandatory</div>}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={handleKill} disabled={!photoFile || !codenameVerified || uploading} style={{ flex: 1 }}>
                      {uploading ? '⏳ Uploading...' : !codenameVerified ? '🔐 Verify Codename First' : !photoFile ? '📸 Add Photo' : 'Confirm Kill ☠'}
                    </Btn>
                    <Btn variant="secondary" onClick={handleCancel} style={{ flex: 1 }}>Cancel</Btn>
                  </div>
                </div>
              )}
            </div>
          ) : isWinner ? (
            <div style={{ background: 'var(--gold-glow)', borderRadius: 16, border: '1px solid rgba(212,168,83,0.3)', padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>👑</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>VICTORY</div>
              <div style={{ color: 'var(--gold)', fontSize: 14 }}>You are the last one standing.</div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>☠️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>You've been eliminated</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Watch the feed to see who wins.</div>
            </div>
          )}
        </div>
      )}

      {tab === 'feed' && (
        <div className="fade-up" style={{ paddingBottom: 40 }}>
          {feed.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40, fontSize: 13 }}>No eliminations yet. The hunt is on...</div>
          ) : feed.map((f, i) => (
            <div key={f.id} className="slide-in" style={{ padding: '14px 16px', borderLeft: '2px solid ' + (f.type === 'winner' ? 'var(--gold)' : 'var(--red)'), marginBottom: 12, animationDelay: i * 0.05 + 's' }}>
              {f.type === 'elimination' ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600 }}><span style={{ color: 'var(--red)' }}>☠</span> {f.target_name} was eliminated by {f.assassin_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{timeAgo(f.created_at)} · {f.remaining} players remain</div>
                  {f.photo_url && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>📸 Evidence</div>
                      <img src={f.photo_url} alt="Evidence" onClick={() => setExpandedPhoto(expandedPhoto === f.id ? null : f.id)} style={{ width: '100%', maxHeight: expandedPhoto === f.id ? 400 : 140, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', transition: 'max-height 0.3s ease' }} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>👑 {f.assassin_name} wins the game!</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{timeAgo(f.created_at)}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'players' && (
        <div className="fade-up" style={{ paddingBottom: 40 }}>
          {players.map((p, i) => (
            <div key={p.id} className="slide-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 4, opacity: p.is_alive ? 1 : 0.35, animationDelay: i * 0.04 + 's' }}>
              <PlayerAvatar avatarUrl={p.avatar_url} emoji={p.avatar} size={40} style={{ filter: p.is_alive ? 'none' : 'grayscale(1)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, flex: 1, textDecoration: p.is_alive ? 'none' : 'line-through' }}>{p.name}</span>
              {p.is_alive ? <Badge color="var(--green)">Alive</Badge> : <Badge color="var(--text-dim)">Eliminated</Badge>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
