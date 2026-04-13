# MultiChat — Stream Chat Overlay

Combine **Twitch, YouTube, Kick, Abstract, and Discord** chat into one clean overlay for OBS.

![platforms](https://img.shields.io/badge/platforms-Twitch%20%7C%20YouTube%20%7C%20Kick%20%7C%20Abstract%20%7C%20Discord-blueviolet)

---

## Quick Start

### What you need
- [OBS Studio](https://obsproject.com/)
- [Streamer.bot](https://streamer.bot/) — handles Twitch, YouTube, Kick
- [Node.js v16+](https://nodejs.org/) — only needed for the Discord bridge
- A Discord bot token — [create one free here](https://discord.com/developers/applications)

---

## Step 1 — Get the files

```bash
git clone https://github.com/YOUR_USERNAME/multichat.git
cd multichat
npm install
```

---

## Step 2 — Create your config

```bash
# Mac / Linux
cp config.example.js config.js

# Windows
copy config.example.js config.js
```

Open `config.js` in any text editor and fill in your details.  
Every setting has a comment explaining exactly what to put.

> ⚠️ **Never push `config.js` to GitHub** — it holds your secret bot token.  
> It's already in `.gitignore` but always double-check with `git status` before pushing.

---

## Step 3 — Set up Streamer.bot (Twitch / YouTube / Kick)

1. Open **Streamer.bot**
2. Go to **Servers/Clients → WebSocket Server**
3. Make sure it's **enabled** on port **8080**
4. Connect your Twitch, YouTube, and Kick accounts under their respective tabs

That's it — MultiChat will receive messages automatically.

---

## Step 4 — Set up your Discord bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**, give it a name
3. Go to the **Bot** tab → click **Reset Token** → copy the token into `config.js`
4. Scroll down to **Privileged Gateway Intents** and turn on:
   - ✅ **Message Content Intent**
5. Go to **OAuth2 → URL Generator**:
   - Tick **bot** under Scopes
   - Tick **View Channels** + **Read Message History** under Bot Permissions
6. Copy the generated URL → paste into your browser → add the bot to your server

**Getting your Channel ID:**
- In Discord, go to **Settings → Advanced** → turn on **Developer Mode**
- Right-click the channel you want → **Copy Channel ID**
- Paste it into `DISCORD_CHANNEL_ID` in `config.js`

---

## Step 5 — Run the Discord bridge

```bash
node discord-bridge.js
```

You should see:
```
✅  Config loaded — channel: 123456789
✅  Bridge WS server listening on ws://127.0.0.1:8081
✅  Discord Gateway connected
🤖  Logged in as YourBot
👂  Watching channel 123456789
```

Keep this terminal open while streaming.  
*(Or host it on Railway so it runs 24/7 — see Optional section below)*

---

## Step 6 — Add to OBS

**Option A — Browser Source (overlay on stream)**
1. In OBS, click **+** in the Sources panel → **Browser**
2. Check **Local File** → Browse → select `multichat.html`
3. Set your desired Width/Height (e.g. 400 × 900 for portrait)
4. Click OK

**Option B — OBS Dock (monitoring panel inside OBS)**
1. In OBS, go to **View → Docks → Custom Browser Docks**
2. Click **+** and set:
   - Name: `MultiChat`
   - URL: browse to your `multichat.html` file
3. Click Apply — it'll appear as a dockable panel inside OBS

**Option C — Desktop App (double-click to launch)**
```bash
npm start          # Run without building
npm run build      # Build a .exe installer → dist/ folder
```

---

## Controls

| Control | What it does |
|---|---|
| **BG** color swatch | Click to open the color picker (full color wheel + hex input) |
| **BG** opacity slider | 0% = fully transparent (great for OBS chroma key), 100% = solid |
| **Size** slider | Scale all chat text up or down |
| **UI button** (top-right corner) | Hides/shows header + footer + send bar — use this for the clean OBS overlay view |
| **Footer icons** | Filter by platform — click Twitch/YouTube/Kick/Abstract/Discord icons or All |
| **Send bar** | Type a message and press Enter or Send to All — broadcasts via Streamer.bot |

All settings **(color, opacity, font size, UI state)** are saved automatically and restored on next open.

**Reset to defaults:**
```js
// Open browser console (F12) on multichat.html and run:
localStorage.removeItem('multichat_settings')
```

---

## Optional — Host the Discord Bridge on Railway (run 24/7 for free)

Instead of running `node discord-bridge.js` before every stream, host it on [Railway](https://railway.app/).

1. Push your repo to GitHub *(confirm `config.js` is NOT in the commit)*
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select your repo
4. Go to your service → **Variables** tab → add:
   ```
   DISCORD_BOT_TOKEN=your-token-here
   DISCORD_CHANNEL_ID=your-channel-id
   PORT=8081
   ```
5. Go to **Settings → Networking → Generate Domain** → enter port `8081`
6. Copy the domain (e.g. `your-app.up.railway.app`)
7. Update `config.js` on your local machine:
   ```js
   DISCORD_WS_URL: 'wss://your-app.up.railway.app/',
   ```

---

## File Structure

```
multichat/
├── multichat.html        ← The chat overlay — open this in OBS
├── discord-bridge.js     ← Discord relay server (run with node)
├── electron-main.js      ← Desktop app entry point
├── preload.js            ← Electron/browser bridge
├── config.example.js     ← Configuration template (copy → config.js)
├── config.js             ← YOUR config — gitignored, never commit!
├── package.json
├── .env.example          ← Railway env var template
├── .gitignore
└── README.md
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Twitch/YouTube/Kick not showing | Check Streamer.bot WebSocket is enabled on port 8080 |
| Discord not showing | Make sure `Message Content Intent` is enabled on your bot |
| Discord shows "bridge connected" test message only | Bot connected but not receiving — check the Channel ID is correct |
| White screen on open | Check browser console (F12) for errors — usually a syntax error in config.js |
| Settings not saving | Make sure the file isn't being opened from inside a zip |
