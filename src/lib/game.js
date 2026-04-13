export const uid = () => Math.random().toString(36).slice(2, 10);
export const gameCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
};
export const ts = () => new Date().toISOString();
export const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const AVATARS = ['🐺','🦊','🐱','🦁','🐯','🐻','🐼','🐨','🐸','🦉','🦅','🐙','🦈','🐊','🦎','🐍','🦂','🕷️','🐝','🦋'];

export function pickAvatar(used = []) {
  const avail = AVATARS.filter(a => !used.includes(a));
  const pool = avail.length > 0 ? avail : AVATARS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildChain(ids) {
  const s = [...ids].sort(() => Math.random() - 0.5);
  const a = {};
  for (let i = 0; i < s.length; i++) a[s[i]] = s[(i + 1) % s.length];
  return a;
}

export function processElimination(assignments, assassinId) {
  const targetId = assignments[assassinId];
  if (!targetId || targetId === assassinId) return { newAssignments: assignments, isGameOver: true };
  const n = { ...assignments };
  n[assassinId] = n[targetId];
  delete n[targetId];
  const alive = Object.keys(n).length;
  return { newAssignments: n, isGameOver: alive <= 1, targetId, alive };
}

export function getDeviceId() {
  let id = localStorage.getItem('assassins-device-id');
  if (!id) { id = uid() + uid(); localStorage.setItem('assassins-device-id', id); }
  return id;
}

export function getSession() {
  try { const r = localStorage.getItem('assassins-session'); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function setSession(s) { localStorage.setItem('assassins-session', JSON.stringify(s)); }
export function clearSession() { localStorage.removeItem('assassins-session'); }
