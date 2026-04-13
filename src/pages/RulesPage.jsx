import React, { useState } from 'react';
import { Logo, Btn } from '../components/UI';

export default function RulesPage({ onBack }) {
  const [section, setSection] = useState('overview'); // overview | rules | map | tips

  const sections = [
    { key: 'overview', label: 'How to Play' },
    { key: 'rules', label: 'Rules' },
    { key: 'map', label: 'Map Features' },
    { key: 'tips', label: 'Tips' },
  ];

  return (
    <>
      <Logo size="small" />
      <div className="fade-up">

        {/* Section tabs */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 10,
          padding: 4, marginBottom: 20,
        }}>
          {sections.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)} style={{
              flex: 1, padding: '9px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: section === s.key ? 'var(--card)' : 'transparent',
              color: section === s.key ? 'var(--text)' : 'var(--text-dim)',
              border: section === s.key ? '1px solid var(--border)' : '1px solid transparent',
              transition: 'all 0.2s', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-body)',
            }}>{s.label}</button>
          ))}
        </div>

        {/* ─── HOW TO PLAY ─── */}
        {section === 'overview' && (
          <div className="fade-up" style={{ paddingBottom: 20 }}>
            <div style={cardStyle}>
              <div style={stepNumStyle}>1</div>
              <div style={stepTitleStyle}>Create or Join a Game</div>
              <div style={stepDescStyle}>
                One player creates a game and gets a 6-letter code. Share that code with friends — they enter it to join. You need at least 3 players to start.
              </div>
            </div>

            <div style={cardStyle}>
              <div style={stepNumStyle}>2</div>
              <div style={stepTitleStyle}>Upload Your Photo</div>
              <div style={stepDescStyle}>
                Everyone uploads a profile photo before joining. This is how other players will identify their target in the real world.
              </div>
            </div>

            <div style={cardStyle}>
              <div style={stepNumStyle}>3</div>
              <div style={stepTitleStyle}>Get Your Target</div>
              <div style={stepDescStyle}>
                Once the host starts the game, each player is secretly assigned one target — another player they must eliminate. You'll see their name and photo. Nobody knows who is hunting them.
              </div>
            </div>

            <div style={cardStyle}>
              <div style={stepNumStyle}>4</div>
              <div style={stepTitleStyle}>Hunt Them Down</div>
              <div style={stepDescStyle}>
                Find your target in the real world and "eliminate" them. Your group decides the method — a tag, a sticker, a water gun, whatever you agree on. Take a photo as evidence!
              </div>
            </div>

            <div style={cardStyle}>
              <div style={stepNumStyle}>5</div>
              <div style={stepTitleStyle}>Inherit Their Target</div>
              <div style={stepDescStyle}>
                When you eliminate someone, you take over their target. The chain gets shorter. Keep hunting until you're the last one standing.
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ ...stepNumStyle, background: 'var(--gold-glow)', color: 'var(--gold)' }}>👑</div>
              <div style={stepTitleStyle}>Last One Standing Wins</div>
              <div style={stepDescStyle}>
                The game ends when only one player remains. They are crowned the winner. Stats are tracked if you have an account.
              </div>
            </div>
          </div>
        )}

        {/* ─── RULES ─── */}
        {section === 'rules' && (
          <div className="fade-up" style={{ paddingBottom: 20 }}>
            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🎯 One Target at a Time</div>
              <div style={ruleDescStyle}>You can only eliminate the specific person assigned to you. You cannot eliminate anyone else, even in self-defense.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🛡️ Safe Zones</div>
              <div style={ruleDescStyle}>The host can mark safe zones on the map (like homes, offices, or schools). Eliminations inside safe zones don't count. Check the map to see where they are.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>📸 Photo Evidence</div>
              <div style={ruleDescStyle}>When you eliminate someone, take a photo as proof. Upload it when reporting the kill — it'll show up in the game feed for everyone to see.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🗺️ Stay In Bounds</div>
              <div style={ruleDescStyle}>The host sets a boundary on the map when creating the game. Stay within the play area. If you leave the boundary for extended periods, you may be disqualified.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>⏰ Elimination Method</div>
              <div style={ruleDescStyle}>Agree on the elimination method before starting. Common choices: physical tag, water gun, sticker on the back, or even just saying a code word.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🚫 Play Safe</div>
              <div style={ruleDescStyle}>This is a game — play responsibly. Don't trespass, don't run into traffic, don't play in unsafe areas. If someone asks you to stop, stop immediately. Safety always comes first.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🤝 No Teaming</div>
              <div style={ruleDescStyle}>No alliances or sharing target information. The fun is in the paranoia — everyone is on their own.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>⚡ Report Quickly</div>
              <div style={ruleDescStyle}>Report eliminations as soon as they happen so the chain updates. Delayed reports can cause confusion.</div>
            </div>
          </div>
        )}

        {/* ─── MAP FEATURES ─── */}
        {section === 'map' && (
          <div className="fade-up" style={{ paddingBottom: 20 }}>
            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>📍 Check In</div>
              <div style={ruleDescStyle}>Voluntarily share your current location on the map. Other players can see your check-in. Use this to taunt your assassin or bait your target!</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>👁️ Spotted Report</div>
              <div style={ruleDescStyle}>See someone in the wild? Submit a "Spotted" report. It drops a pin at your current location with the name of who you saw. Here's the twist: only that player's assassin can see the report. You're helping someone without knowing who.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🎯 Ping Your Target</div>
              <div style={ruleDescStyle}>Once per hour, you can "ping" to see your target's last known location on the map. This shows where they last checked in or were spotted. Use it strategically — you only get one per hour.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🛡️ Safe Zones on Map</div>
              <div style={ruleDescStyle}>Green circles on the map mark safe zones. You cannot be eliminated inside these areas. The host sets them before the game starts.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🔴 Play Boundary</div>
              <div style={ruleDescStyle}>The red dashed circle shows the game's play area. The host draws this when setting up the game. Stay inside it!</div>
            </div>
          </div>
        )}

        {/* ─── TIPS ─── */}
        {section === 'tips' && (
          <div className="fade-up" style={{ paddingBottom: 20 }}>
            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🕵️ Be Paranoid</div>
              <div style={ruleDescStyle}>Someone is hunting you and you don't know who. Look over your shoulder. Change your routine. Take different routes. That's half the fun.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>📱 Use the Map Wisely</div>
              <div style={ruleDescStyle}>Check in at decoy locations to mislead your assassin. Submit spotted reports to help other assassins. Save your ping for when you have time to act on the information.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🎭 Study Your Target</div>
              <div style={ruleDescStyle}>Memorize their photo. Learn their habits if you know them. The game rewards patience and planning over brute force.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>📸 Get the Shot</div>
              <div style={ruleDescStyle}>Always take a photo when you eliminate someone. It's more dramatic in the feed and settles any disputes about whether the kill was legitimate.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🏃 Move Unpredictably</div>
              <div style={ruleDescStyle}>If you check in at the same coffee shop every morning, your assassin will figure it out. Mix it up.</div>
            </div>

            <div style={ruleCardStyle}>
              <div style={ruleTitleStyle}>🎉 Have Fun</div>
              <div style={ruleDescStyle}>The best games have drama, close calls, and great stories. Don't take it too seriously — the goal is to have an unforgettable time with friends.</div>
            </div>
          </div>
        )}

        <Btn variant="ghost" onClick={onBack} style={{ width: '100%', textAlign: 'center', paddingBottom: 40 }}>← Back</Btn>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const cardStyle = {
  background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
  padding: '20px', marginBottom: 10, position: 'relative',
};
const stepNumStyle = {
  width: 32, height: 32, borderRadius: '50%', background: 'var(--red-glow)', color: 'var(--red)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, marginBottom: 10,
};
const stepTitleStyle = { fontSize: 15, fontWeight: 700, marginBottom: 6 };
const stepDescStyle = { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 };
const ruleCardStyle = {
  padding: '16px 18px', borderLeft: '2px solid var(--border-light)', marginBottom: 10,
};
const ruleTitleStyle = { fontSize: 14, fontWeight: 700, marginBottom: 4 };
const ruleDescStyle = { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 };
