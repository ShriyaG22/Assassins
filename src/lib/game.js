export const uid = () => Math.random().toString(36).slice(2, 10);
export const gameCode = () => { const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let r=''; for(let i=0;i<6;i++) r+=c[Math.floor(Math.random()*c.length)]; return r; };
export const ts = () => new Date().toISOString();
export const timeAgo = (iso) => { const s=Math.floor((Date.now()-new Date(iso).getTime())/1000); if(s<60)return'just now'; if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; return`${Math.floor(s/86400)}d ago`; };
export const AVATARS = ['🐺','🦊','🐱','🦁','🐯','🐻','🐼','🐨','🐸','🦉','🦅','🐙','🦈','🐊','🦎','🐍','🦂','🕷️','🐝','🦋'];
export function pickAvatar(used=[]) { const a=AVATARS.filter(x=>!used.includes(x)); const p=a.length>0?a:AVATARS; return p[Math.floor(Math.random()*p.length)]; }
export function buildChain(ids) { const s=[...ids].sort(()=>Math.random()-0.5); const a={}; for(let i=0;i<s.length;i++) a[s[i]]=s[(i+1)%s.length]; return a; }
export function processElimination(assignments,assassinId) { const tid=assignments[assassinId]; if(!tid||tid===assassinId) return{newAssignments:assignments,isGameOver:true}; const n={...assignments}; n[assassinId]=n[tid]; delete n[tid]; const alive=Object.keys(n).length; return{newAssignments:n,isGameOver:alive<=1,targetId:tid,alive}; }
export function getDeviceId() { let id=localStorage.getItem('assassins-device-id'); if(!id){id=uid()+uid();localStorage.setItem('assassins-device-id',id);} return id; }
export function getSession() { try{const r=localStorage.getItem('assassins-session');return r?JSON.parse(r):null;}catch{return null;} }
export function setSession(s) { localStorage.setItem('assassins-session',JSON.stringify(s)); }
export function clearSession() { localStorage.removeItem('assassins-session'); }

// ─── CODENAME GENERATOR ───────────────────────────────────────
const ADJECTIVES = [
  'Silent','Shadow','Crimson','Iron','Phantom','Midnight','Savage','Rogue','Frozen','Blazing',
  'Dark','Swift','Steel','Golden','Silver','Scarlet','Venom','Storm','Feral','Wicked',
  'Noble','Ashen','Ember','Jade','Obsidian','Ivory','Copper','Violet','Azure','Onyx',
  'Dire','Toxic','Arctic','Solar','Lunar','Neon','Hollow','Rapid','Brutal','Chaos',
  'Mystic','Primal','Regal','Stealth','Lethal','Ghost','Dread','Blaze','Grim','Stark',
  'Covert','Cunning','Fierce','Agile','Ruthless','Elusive','Vigilant','Prowling','Lurking','Deadly',
];

const ANIMALS = [
  'Wolf','Cobra','Hawk','Viper','Panther','Raven','Fox','Shark','Falcon','Jaguar',
  'Scorpion','Serpent','Tiger','Eagle','Lynx','Mantis','Owl','Cougar','Stallion','Python',
  'Bear','Leopard','Crane','Jackal','Phoenix','Dragon','Raptor','Hornet','Barracuda','Mongoose',
  'Osprey','Mamba','Coyote','Puma','Condor','Stingray','Talon','Wolverine','Asp','Komodo',
  'Cheetah','Badger','Marlin','Pelican','Orca','Moose','Bison','Crow','Sparrow','Beetle',
];

export function generateCodename(usedCodenames = []) {
  const used = new Set(usedCodenames.map(c => c.toLowerCase()));
  let attempts = 0;
  while (attempts < 200) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const codename = `${adj} ${animal}`;
    if (!used.has(codename.toLowerCase())) return codename;
    attempts++;
  }
  // Fallback with number suffix
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal} ${Math.floor(Math.random() * 99)}`;
}
