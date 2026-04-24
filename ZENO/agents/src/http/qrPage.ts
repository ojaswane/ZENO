export function renderQrPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ZENO — Pair Device</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        background: radial-gradient(1200px 600px at 30% 10%, rgba(168,85,247,.28), transparent 60%),
                    radial-gradient(900px 500px at 70% 20%, rgba(34,197,94,.18), transparent 60%),
                    #070712;
        color: #fff;
      }
      .card {
        width: min(920px, 100%);
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 18px;
        padding: 22px;
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 18px;
      }
      @media (max-width: 860px) { .card { grid-template-columns: 1fr; } }
      .title { font-size: 26px; font-weight: 800; letter-spacing: 0.06em; }
      .muted { color: rgba(255,255,255,0.70); font-size: 14px; margin-top: 8px; line-height: 1.45; }
      .box {
        background: rgba(0,0,0,0.35);
        border: 1px solid rgba(192,132,252,0.25);
        border-radius: 16px;
        padding: 16px;
        display: grid;
        place-items: center;
      }
      .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
      .pill {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        padding: 8px 10px;
        border-radius: 999px;
        font-size: 13px;
        color: rgba(255,255,255,0.86);
      }
      button {
        cursor: pointer;
        border: 0;
        border-radius: 10px;
        padding: 10px 12px;
        font-weight: 700;
        background: linear-gradient(135deg, #c084fc, #a855f7);
        color: #0b0b12;
      }
      button.secondary {
        background: rgba(255,255,255,0.08);
        color: #fff;
        border: 1px solid rgba(255,255,255,0.12);
      }
      img { width: 100%; max-width: 360px; border-radius: 12px; background: #fff; }
      .status { margin-top: 10px; font-size: 14px; color: #fbbf24; }
      .ok { color: #22c55e; }
      .err { color: #ef4444; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    </style>
  </head>
  <body>
    <div class="card">
      <div>
        <div class="title">ZENO Pairing</div>
        <div class="muted">
          Scan this QR from your phone. Make sure your phone is on the same Wi‑Fi/LAN as this laptop.
        </div>

        <div class="row">
          <span class="pill">Session: <code id="sessionId">—</code></span>
          <span class="pill">Server URL: <code id="serverUrl">—</code></span>
        </div>

        <div class="row">
          <button id="regen">Generate new QR</button>
          <button class="secondary" id="copy">Copy payload</button>
        </div>

        <div id="status" class="status">Connecting…</div>
      </div>

      <div class="box">
        <img id="qrImg" alt="QR Code" />
      </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
      const statusEl = document.getElementById('status');
      const sessionEl = document.getElementById('sessionId');
      const urlEl = document.getElementById('serverUrl');
      const imgEl = document.getElementById('qrImg');
      const regenBtn = document.getElementById('regen');
      const copyBtn = document.getElementById('copy');

      let lastPayload = null;

      function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.className = 'status' + (kind ? (' ' + kind) : '');
      }

      const socket = io();

      socket.on('connect', () => {
        setStatus('Connected. Generating QR…');
        socket.emit('create-session');
      });

      socket.on('session-created', (payload) => {
        lastPayload = payload;
        sessionEl.textContent = payload.sessionId;
        urlEl.textContent = payload.serverUrl;
        imgEl.src = payload.qrCodeDataUrl;
        setStatus('Waiting for mobile to scan…');
      });

      socket.on('session-joined', (payload) => {
        if (payload.role === 'client') setStatus('Mobile connected!', 'ok');
      });

      socket.on('error', (e) => {
        setStatus((e && e.message) ? e.message : 'Unknown error', 'err');
      });

      regenBtn.addEventListener('click', () => {
        setStatus('Generating QR…');
        socket.emit('create-session');
      });

      copyBtn.addEventListener('click', async () => {
        if (!lastPayload) return;
        const text = JSON.stringify({ sessionId: lastPayload.sessionId, serverUrl: lastPayload.serverUrl });
        try {
          await navigator.clipboard.writeText(text);
          setStatus('Copied pairing JSON to clipboard.', 'ok');
        } catch {
          setStatus('Failed to copy. Clipboard blocked by browser.', 'err');
        }
      });
    </script>
  </body>
</html>`;
}

