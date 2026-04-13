/**
 * discord-bridge.js — MultiChat
 *
 * Requirements: node >= 16, npm install ws
 * Run: node discord-bridge.js
 */

const WebSocket = require('ws');
const fs        = require('fs');

// ── Load config — supports Electron (env vars) and standalone (config.js) ────
let BOT_TOKEN  = process.env.DISCORD_BOT_TOKEN  || '';
let CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
const WS_PORT  = parseInt(process.env.DISCORD_BRIDGE_WS_PORT || process.env.PORT) || 8081;

// Fallback: load from config.js if env vars not set
if (!BOT_TOKEN || !CHANNEL_ID) {
  try {
    const vm  = require('vm');
    const raw = fs.readFileSync('./config.js', 'utf8');
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(raw, ctx);
    const CONFIG = ctx.CONFIG;
    if (CONFIG) {
      BOT_TOKEN  = BOT_TOKEN  || CONFIG.DISCORD_BOT_TOKEN  || '';
      CHANNEL_ID = CHANNEL_ID || CONFIG.DISCORD_CHANNEL_ID || '';
    }
  } catch(e) {
    // config.js not found — that's OK if env vars are set
  }
}

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_DISCORD_BOT_TOKEN') {
  console.error('❌  No Discord bot token found. Set DISCORD_BOT_TOKEN env var or fill in config.js.');
  process.exit(1);
}

console.log(`✅  Discord bridge ready — channel: ${CHANNEL_ID}`);

// ── Local WS server → multichat.html ─────────────────────────────────────────
const wss     = new WebSocket.Server({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🔗  MultiChat connected (${clients.size} client(s))`);
  // Send a test message so you can confirm the pipe is working
  ws.send(JSON.stringify({
    platform: 'discord',
    username: 'Bridge',
    text: '✅ Discord bridge connected successfully!'
  }));
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌  MultiChat disconnected (${clients.size} client(s))`);
  });
});

wss.on('error', (err) => {
  console.error('❌  WS server error:', err.message);
});

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  let sent  = 0;
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
      sent++;
    }
  });
  console.log(`📡  Broadcast to ${sent} client(s)`);
}

console.log(`✅  Bridge WS server listening on ws://127.0.0.1:${WS_PORT}`);

// ── Discord Gateway ───────────────────────────────────────────────────────────
const DISCORD_GATEWAY = 'wss://gateway.discord.gg/?v=10&encoding=json';
const INTENTS         = (1 << 9) | (1 << 15); // GUILD_MESSAGES + MESSAGE_CONTENT

let heartbeatInterval = null;
let sequence          = null;
let discordWs         = null;
let sessionId         = null;
let resumeUrl         = null;

function connectDiscord() {
  const url = resumeUrl || DISCORD_GATEWAY;
  console.log('🔄  Connecting to Discord Gateway…');
  discordWs = new WebSocket(url);

  discordWs.on('open', () => console.log('✅  Discord Gateway connected'));

  discordWs.on('message', (raw) => {
    let payload;
    try { payload = JSON.parse(raw); } catch { return; }
    const { op, d, s, t } = payload;

    if (s !== null && s !== undefined) sequence = s;

    // Op 10 Hello — identify and start heartbeat
    if (op === 10) {
      const jitter = d.heartbeat_interval * Math.random();
      setTimeout(sendHeartbeat, jitter);
      heartbeatInterval = setInterval(sendHeartbeat, d.heartbeat_interval);

      discordWs.send(JSON.stringify({
        op: 2,
        d: {
          token:   BOT_TOKEN,
          intents: INTENTS,
          properties: { os: 'windows', browser: 'multichat', device: 'multichat' }
        }
      }));
    }

    // Op 11 Heartbeat ACK
    if (op === 11) console.log('💓  Heartbeat ACK');

    // Op 0 Dispatch
    if (op === 0) {
      if (t === 'READY') {
        sessionId = d.session_id;
        resumeUrl = d.resume_gateway_url + '/?v=10&encoding=json';
        console.log(`🤖  Logged in as ${d.user.username}`);
        console.log(`👂  Watching channel ${CHANNEL_ID}`);
      }

      if (t === 'MESSAGE_CREATE') {
        console.log(`📨  Message in channel ${d.channel_id} from ${d.author?.username}: "${d.content?.slice(0,50)}"`);

        if (d.channel_id !== CHANNEL_ID) {
          console.log(`    ↳ Ignored (not target channel ${CHANNEL_ID})`);
          return;
        }
        if (d.author?.bot) {
          console.log(`    ↳ Ignored (bot message)`);
          return;
        }

        const username = d.member?.nick || d.author?.global_name || d.author?.username || 'Discord User';
        const text     = d.content || '';

        if (!text.trim()) {
          console.log(`    ↳ Ignored (empty text)`);
          return;
        }

        console.log(`💬  Forwarding: ${username}: ${text}`);
        broadcast({ platform: 'discord', username, text });
      }
    }

    // Op 7 Reconnect
    if (op === 7) { console.log('🔁  Reconnect requested'); reconnect(); }

    // Op 9 Invalid session
    if (op === 9) {
      console.warn('⚠️  Invalid session — re-identifying in 5s');
      sessionId = null; resumeUrl = null;
      setTimeout(connectDiscord, 5000);
    }
  });

  discordWs.on('close', (code, reason) => {
    clearInterval(heartbeatInterval);
    console.warn(`⚠️  Discord closed (${code}: ${reason}) — reconnecting in 5s`);
    setTimeout(connectDiscord, 5000);
  });

  discordWs.on('error', (err) => console.error('❌  Discord error:', err.message));
}

function sendHeartbeat() {
  if (discordWs?.readyState === WebSocket.OPEN) {
    discordWs.send(JSON.stringify({ op: 1, d: sequence }));
    console.log(`💓  Heartbeat sent (seq: ${sequence})`);
  }
}

function reconnect() {
  clearInterval(heartbeatInterval);
  discordWs?.terminate();
  setTimeout(connectDiscord, 1000);
}

connectDiscord();
