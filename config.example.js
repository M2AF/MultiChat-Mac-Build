/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           MultiChat — Configuration File            ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * HOW TO USE:
 *   1. Rename this file from  config.example.js  →  config.js
 *   2. Fill in YOUR values below (replace everything in CAPS)
 *   3. Save the file — that's it!
 *
 * ⚠️  NEVER commit config.js to GitHub.
 *     It contains your secret bot token.
 *     It is already listed in .gitignore for your safety.
 */

const CONFIG = {

  // ════════════════════════════════════════════════════
  // 1. YOUR NAME
  //    Shown in the top-left of the overlay
  // ════════════════════════════════════════════════════
  BRAND_NAME: 'YourName',


  // ════════════════════════════════════════════════════
  // 2. YOUR STREAM LINKS
  //    Shown as clickable links in the overlay header.
  //    Remove any platforms you don't use.
  // ════════════════════════════════════════════════════
  CHANNELS: {
    twitch:   'https://twitch.tv/YOUR_TWITCH_USERNAME',
    youtube:  'https://youtube.com/@YOUR_YOUTUBE_HANDLE',
    kick:     'https://kick.com/YOUR_KICK_USERNAME',
    abstract: 'https://portal.abs.xyz/stream/YOUR_ABSTRACT_USERNAME',
  },


  // ════════════════════════════════════════════════════
  // 3. STREAMER.BOT
  //    Leave this as-is if Streamer.bot is running on
  //    the same PC as OBS (default port 8080).
  // ════════════════════════════════════════════════════
  SB_WS_URL: 'ws://127.0.0.1:8080/',


  // ════════════════════════════════════════════════════
  // 4. ABSTRACT CHAIN CHAT
  //    Find your channel_id in your AbsTools dashboard:
  //    https://abstools.top → Settings → copy the WS URL
  //    Leave blank if you don't use Abstract.
  // ════════════════════════════════════════════════════
  ABS_WS_URL: 'wss://abstools.top/api/ws?channel_id=YOUR_ABSTRACT_CHANNEL_ID',


  // ════════════════════════════════════════════════════
  // 5. DISCORD BRIDGE
  //
  //    OPTION A — Running discord-bridge.js locally:
  //      DISCORD_WS_URL: 'ws://127.0.0.1:8081/',
  //
  //    OPTION B — Hosted on Railway (recommended):
  //      DISCORD_WS_URL: 'wss://your-app.up.railway.app/',
  //
  //    HOW TO GET YOUR BOT TOKEN:
  //      → discord.com/developers/applications
  //      → Select your app → Bot tab → Reset Token → Copy
  //
  //    HOW TO GET YOUR CHANNEL ID:
  //      → In Discord, right-click the channel → Copy Channel ID
  //      (Enable Developer Mode in Discord Settings → Advanced first)
  // ════════════════════════════════════════════════════
  DISCORD_WS_URL:     'ws://127.0.0.1:8081/',
  DISCORD_BOT_TOKEN:  'YOUR_DISCORD_BOT_TOKEN',
  DISCORD_CHANNEL_ID: 'YOUR_DISCORD_CHANNEL_ID',


  // ════════════════════════════════════════════════════
  // 6. DEFAULT APPEARANCE
  //    Only used the very first time you open the app.
  //    After that your settings are saved automatically.
  //
  //    bgColor  — background RGB values (0-255 each)
  //    bgAlpha  — opacity: 0 = transparent, 1 = solid
  //    fontScale — text size: 1 = 100%, 1.5 = 150%
  // ════════════════════════════════════════════════════
  DEFAULTS: {
    bgColor:   { r: 14, g: 14, b: 16 },
    bgAlpha:   1,
    fontScale: 1,
  },

};
