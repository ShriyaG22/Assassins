# ☠ ASSASSINS

A live elimination game played across the city. Get assigned a target. Hunt them down. Don't get caught.

Built with **React + Vite + Supabase** (real-time multiplayer) and deployable as a **PWA** so friends can install it on their phones.

---

## Quick Start (5 minutes)

Your Supabase backend is already set up! Database, tables, realtime — all done. Just deploy.

### 1. Run locally (to test)

```bash
# Unzip and enter the folder
cd assassins-app

# Copy the env file (credentials are pre-filled)
cp .env.example .env

# Install and run
npm install
npm run dev
```

Open `http://localhost:5173` on your phone and laptop to test multiplayer.

### 2. Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com), sign in with GitHub
3. Click **Import Project** → select your repo
4. Add environment variables (copy from `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**
6. You'll get a URL like `assassins-xyz.vercel.app` — share it with friends!

---

## How to Play

1. **One person creates a game** and gets a 6-character code
2. **Share the code** with friends — they open the app and join
3. **Host starts the game** once everyone's in (minimum 3 players)
4. **Each player sees their secret target** — only you know who you're hunting
5. **Hunt your target IRL** — tag them, sticker them, water gun, whatever your group decides
6. **Report the elimination** in the app — you'll inherit their target
7. **Last one standing wins** 👑

### Rules to agree on with your group

- **Kill method**: physical tag? water gun? sticker on back?
- **Safe zones**: apartments? offices? subway?
- **Time limits**: no kills before 8am? game deadline?
- **Witnesses**: require a photo or witness?

---

## Project Structure

```
assassins-app/
├── index.html              # Entry point
├── vite.config.js          # Vite + PWA config
├── package.json
├── .env.example            # Supabase credentials template
├── public/
│   └── favicon.svg
├── supabase/
│   └── schema.sql          # Run this in Supabase SQL Editor
└── src/
    ├── main.jsx            # React mount
    ├── App.jsx             # Main app with state management
    ├── index.css           # Global styles + animations
    ├── components/
    │   └── UI.jsx          # Shared components (Btn, Input, Badge...)
    ├── lib/
    │   ├── supabase.js     # Supabase client init
    │   ├── game.js         # Game logic (chain, elimination, helpers)
    │   └── api.js          # Database operations + realtime subscriptions
    └── pages/
        ├── HomePage.jsx    # Create / Join screens
        ├── LobbyPage.jsx   # Waiting room with player list
        └── GamePage.jsx    # Active game (target, feed, players)
```

---

## PWA — Install on Phone

After deploying, open the URL on your phone:
- **iOS**: Tap Share → "Add to Home Screen"
- **Android**: Tap the banner or Menu → "Install App"

The app will work fullscreen like a native app.

---

## Future Ideas

- 📸 **Photo proof** — require a selfie with your target to confirm kills
- 📍 **Geo-fenced safe zones** — auto-detect when you're in a safe area
- 💬 **Anonymous taunts** — send messages to your hunter without knowing who they are
- 🔔 **Push notifications** — get alerted when someone near you is eliminated
- 🏆 **Seasons & leaderboards** — track stats across multiple games
- 🤝 **Alliances** — temporary truces between players

---

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (Postgres + Realtime subscriptions)
- **Hosting**: Vercel (or any static host)
- **PWA**: vite-plugin-pwa for installability
- **Auth**: Anonymous device-based identity (no login required)
