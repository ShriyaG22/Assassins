import React from 'react';
import { Logo, Btn } from '../components/UI';

export default function RulesPage({ onBack }) {
  return (
    <>
      <Logo size="small" />
      <div className="fade-up" style={{ paddingBottom: 40 }}>

        {/* HOW TO PLAY */}
        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 16, color: 'var(--text)' }}>How to Play</div>

        {[
          { n: '1', t: 'Create or Join a Game', d: 'One player creates a game and gets a 6-letter code. Share that code with friends — they enter it to join. You need at least 3 players to start.' },
          { n: '2', t: 'Set Up Your Profile', d: 'Upload a photo of yourself so your assassin can recognize you. You\'ll also receive a secret codename — guard it carefully.' },
          { n: '3', t: 'Get Your Target', d: 'Once the host starts the game, each player is secretly assigned one target. You\'ll see their name and photo. Nobody knows who is hunting them.' },
          { n: '4', t: 'Hunt Them Down', d: 'Find your target in the real world and "eliminate" them. Your group decides the method — a tag, a sticker, a water gun, whatever you agree on.' },
          { n: '5', t: 'Prove the Kill', d: 'To confirm an elimination, you must enter your target\'s secret codename AND upload a photo as evidence. You get 3 attempts at the codename — fail all 3 and the kill is rejected.' },
          { n: '6', t: 'Inherit Their Target', d: 'When you eliminate someone, you take over their target. The chain gets shorter. Keep hunting until you\'re the last one standing.' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--red-glow)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{s.n}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.t}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.d}</div>
          </div>
        ))}

        <div style={{ height: 24 }} />

        {/* RULES */}
        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 16, color: 'var(--text)' }}>Rules</div>

        {[
          { e: '🎯', t: 'One Target at a Time', d: 'You can only eliminate the specific person assigned to you. You cannot eliminate anyone else.' },
          { e: '🔐', t: 'Codename Required', d: 'You must learn your target\'s secret codename to confirm a kill. Get it from them in person — it\'s part of the game.' },
          { e: '📸', t: 'Photo Evidence Mandatory', d: 'Every elimination requires a photo as proof. No photo, no kill.' },
          { e: '🛡️', t: 'Safe Zones', d: 'The host can mark safe zones on the map. Eliminations inside safe zones don\'t count.' },
          { e: '🗺️', t: 'Stay In Bounds', d: 'The host sets a boundary on the map. Stay inside the play area.' },
          { e: '🚫', t: 'Play Safe', d: 'Don\'t trespass, don\'t run into traffic, don\'t play in unsafe areas. If someone asks you to stop, stop immediately.' },
          { e: '🤝', t: 'No Teaming', d: 'No alliances or sharing target information. Everyone is on their own.' },
          { e: '⚡', t: 'Report Quickly', d: 'Report eliminations as soon as they happen so the chain updates.' },
        ].map((r, i) => (
          <div key={i} style={{ padding: '14px 18px', borderLeft: '2px solid var(--border-light)', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.e} {r.t}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.d}</div>
          </div>
        ))}

        <div style={{ height: 24 }} />

        {/* MAP FEATURES */}
        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 16, color: 'var(--text)' }}>Map Features</div>

        {[
          { e: '📍', t: 'Check In', d: 'Voluntarily share your current location. Use this to taunt your assassin or bait your target.' },
          { e: '👁️', t: 'Spotted Report', d: 'See someone in the wild? Submit a "Spotted" report. Only that player\'s assassin can see it.' },
          { e: '🎯', t: 'Ping Your Target', d: 'Once per hour, reveal your target\'s last known location on the map.' },
          { e: '🛡️', t: 'Safe Zones on Map', d: 'Green circles mark safe zones. You cannot be eliminated inside these areas.' },
          { e: '🔴', t: 'Play Boundary', d: 'The red dashed circle shows the game\'s play area. Stay inside it.' },
        ].map((r, i) => (
          <div key={i} style={{ padding: '14px 18px', borderLeft: '2px solid var(--border-light)', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.e} {r.t}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.d}</div>
          </div>
        ))}

        <div style={{ height: 24 }} />

        {/* TIPS */}
        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 16, color: 'var(--text)' }}>Strategy Tips</div>

        {[
          { e: '🕵️', t: 'Be Paranoid', d: 'Someone is hunting you and you don\'t know who. Change your routine. Take different routes.' },
          { e: '🔐', t: 'Guard Your Codename', d: 'Your codename is your last line of defense. Don\'t share it casually — your assassin needs it to eliminate you.' },
          { e: '📱', t: 'Use the Map Wisely', d: 'Check in at decoy locations to mislead your assassin. Save your ping for when you have time to act.' },
          { e: '🎭', t: 'Get Their Codename', d: 'You need your target\'s codename to eliminate them. Be creative — befriend them, trick them, or catch them off guard.' },
          { e: '🎉', t: 'Have Fun', d: 'The best games have drama, close calls, and great stories. Don\'t take it too seriously.' },
        ].map((r, i) => (
          <div key={i} style={{ padding: '14px 18px', borderLeft: '2px solid var(--border-light)', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.e} {r.t}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.d}</div>
          </div>
        ))}

        <Btn variant="ghost" onClick={onBack} style={{ width: '100%', textAlign: 'center', marginTop: 16 }}>← Back</Btn>
      </div>
    </>
  );
}
