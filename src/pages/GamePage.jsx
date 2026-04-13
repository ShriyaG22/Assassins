import React, { useState, useRef } from 'react';
import { Logo, Btn, Badge, PlayerAvatar, PhotoUpload, Spinner } from '../components/UI';
import { timeAgo } from '../lib/game';

export default function GamePage({ game, players, feed, me, onEliminate, onViewProfile }) {
  const [tab, setTab] = useState('target');
  const [confirmKill, setConfirmKill] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(null);

  const isAlive = !!game.assignments?.[me.id];
  const targetId = game.assignments?.[me.id];
  const target = players.find(p => p.id === targetId);
  const myKills = players.find(p => p.id === me.id)?.kills || 0;
  const alive = Object.keys(game.assignments || {}).length;
  const isWinner = game.status === 'finished' && isAlive;

  const handlePhotoSelect = (file) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };
  const clearPhoto = () => { setPhotoFile(null); setPhotoPreview(null); };
  const handleKill = async () => {
    setUploading(true);
    try { await onEliminate(photoFile); setConfirmKill(false); clearPhoto(); } finally { setUploading(false); }
  };

  return (
    <>
      <Logo size="small" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Badge color={isAlive ? 'var(--green)' : 'var(--red)'}>{isWinner ? '👑 WINNER' : isAlive ? '● Alive' : '☠ Eliminated'}</Badge>
        <Badge color="var(--text-muted)" bg="var(--surface)">{alive} remaining</Badge>
        <Badge color="var(--gold)" bg="var(--gold-glow)">{myKills} kills</Badge>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {['target', 'feed', 'players'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: tab === t ? 'var(--card)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-dim)',
            border: tab === t ? '1px solid var(--border)' : '1px solid transparent', transition: 'all 0.2s',
            cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-body)', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* ─── TARGET TAB ─── */}
      {tab === 'target' && (
        <div className="fade-up">
          {isAlive && target && !isWinner ? (
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Your Target</div>

              {/* Target photo */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <PlayerAvatar avatarUrl={target.avatar_url} emoji={target.avatar} size={100}
                  style={{ border: '3px solid var(--red)', cursor: target.auth_user_id ? 'pointer' : 'default' }}
                />
              </div>

              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{target.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 28 }}>
                ID: {target.id.slice(0, 6).toUpperCase()}
              </div>

              {target.auth_user_id && (
                <Btn variant="ghost" onClick={() => onViewProfile?.(target.auth_user_id)} style={{ width: '100%', textAlign: 'center', marginBottom: 16, color: 'var(--blue)' }}>
                  View Profile →
                </Btn>
              )}

              {!confirmKill ? (
                <Btn onClick={() => setConfirmKill(true)}>Report Elimination</Btn>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Confirm you eliminated <strong style={{ color: 'var(--text)' }}>{target.name}</strong>?
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: 12, border: '1px dashed var(--border-light)', padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>📸 Add Evidence Photo</div>
                    <PhotoUpload onCapture={handlePhotoSelect} previewUrl={photoPreview} onClear={clearPhoto} />
                    {!photoPreview && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, fontStyle: 'italic' }}>Photo proof recommended but optional</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={handleKill} disabled={uploading} style={{ flex: 1 }}>
                      {uploading ? '⏳ Uploading...' : photoFile ? 'Confirm Kill ☠' : 'Confirm (no photo)'}
                    </Btn>
                    <Btn variant="secondary" onClick={() => { setConfirmKill(false); clearPhoto(); }} style={{ flex: 1 }}>Cancel</Btn>
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

      {/* ─── FEED TAB ─── */}
      {tab === 'feed' && (
        <div className="fade-up" style={{ paddingBottom: 40 }}>
          {feed.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40, fontSize: 13 }}>No eliminations yet. The hunt is on...</div>
          ) : feed.map((f, i) => (
            <div key={f.id} className="slide-in" style={{ padding: '14px 16px', borderLeft: `2px solid ${f.type === 'winner' ? 'var(--gold)' : 'var(--red)'}`, marginBottom: 12, animationDelay: `${i * 0.05}s` }}>
              {f.type === 'elimination' ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600 }}><span style={{ color: 'var(--red)' }}>☠</span> {f.target_name} was eliminated by {f.assassin_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{timeAgo(f.created_at)} · {f.remaining} players remain</div>
                  {f.photo_url && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>📸 Evidence</div>
                      <img src={f.photo_url} alt="Evidence" onClick={() => setExpandedPhoto(expandedPhoto === f.id ? null : f.id)}
                        style={{ width: '100%', maxHeight: expandedPhoto === f.id ? 400 : 140, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', transition: 'max-height 0.3s ease' }} />
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

      {/* ─── PLAYERS TAB ─── */}
      {tab === 'players' && (
        <div className="fade-up" style={{ paddingBottom: 40 }}>
          {players.map((p, i) => (
            <div key={p.id} className="slide-in"
              onClick={() => p.auth_user_id && onViewProfile?.(p.auth_user_id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderRadius: 10, marginBottom: 4, opacity: p.is_alive ? 1 : 0.35,
                animationDelay: `${i * 0.04}s`, cursor: p.auth_user_id ? 'pointer' : 'default',
              }}>
              <PlayerAvatar avatarUrl={p.avatar_url} emoji={p.avatar} size={40}
                style={{ filter: p.is_alive ? 'none' : 'grayscale(1)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, flex: 1, textDecoration: p.is_alive ? 'none' : 'line-through' }}>{p.name}</span>
              {p.is_alive ? <Badge color="var(--green)">Alive</Badge> : <Badge color="var(--text-dim)">Eliminated</Badge>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
