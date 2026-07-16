/**
 * Paintshop Dojo — Local Print Agent
 *
 * A tiny WebSocket server that runs on the user's machine (localhost:8998).
 * The web app connects to it directly from the browser and sends PDF print jobs.
 * No authentication needed — only software on the same machine can reach 127.0.0.1.
 *
 * Start: node src/index.js
 */

import { WebSocketServer } from 'ws';
import ptp from 'pdf-to-printer';
const { print, getPrinters, getDefaultPrinter } = ptp;
import { writeFileSync, unlink } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

const PORT = 8998;
const HOST = '127.0.0.1'; // never exposed to the network — loopback only

// ── Printer discovery ──────────────────────────────────────────────────────────
// Reuse pdf-to-printer's own (CIM-based) printer enumeration instead of a
// hand-rolled PowerShell call — it's the same library we use to print, so a
// machine that can't list printers this way can't print either.
async function listPrinters() {
  const [printers, defaultPrinter] = await Promise.all([
    getPrinters(),
    getDefaultPrinter().catch(() => null),
  ]);

  return printers.map((p) => ({
    name: p.name,
    isDefault: defaultPrinter != null && p.deviceId === defaultPrinter.deviceId,
  }));
}

// ── Message handlers ───────────────────────────────────────────────────────────
async function handleMessage(ws, raw) {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    send(ws, null, { success: false, error: 'Invalid JSON' });
    return;
  }

  const { type, requestId, ...payload } = msg;

  if (type === 'PING') {
    send(ws, requestId, { success: true });
    return;
  }

  if (type === 'GET_PRINTERS') {
    try {
      const printers = await listPrinters();
      send(ws, requestId, { success: true, printers });
    } catch (err) {
      send(ws, requestId, { success: false, error: err.message });
    }
    return;
  }

  if (type === 'PRINT_JOB') {
    const { pdfBase64, printerName } = payload;
    const tmpFile = join(tmpdir(), `psd_${randomUUID()}.pdf`);

    try {
      writeFileSync(tmpFile, Buffer.from(pdfBase64, 'base64'));

      const options = {};
      if (printerName) options.printer = printerName;

      await print(tmpFile, options);
      send(ws, requestId, { success: true });
    } catch (err) {
      console.error('[agent] Print error:', err.message);
      send(ws, requestId, { success: false, error: err.message });
    } finally {
      unlink(tmpFile, () => {}); // best-effort cleanup
    }
    return;
  }

  send(ws, requestId, { success: false, error: `Unknown message type: ${type}` });
}

function send(ws, requestId, data) {
  try {
    ws.send(JSON.stringify({ requestId, ...data }));
  } catch {
    // client may have disconnected
  }
}

// ── WebSocket server ───────────────────────────────────────────────────────────
const wss = new WebSocketServer({ host: HOST, port: PORT }, () => {
  console.log(`[Paintshop Print Agent] ws://${HOST}:${PORT} — ready`);
});

wss.on('connection', (ws, req) => {
  console.log(`[agent] connected: ${req.socket.remoteAddress}`);
  ws.on('message', (raw) => handleMessage(ws, raw));
  ws.on('error', (err) => console.error('[agent] client error:', err.message));
  ws.on('close', () => console.log('[agent] client disconnected'));
});

wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[agent] Port ${PORT} is already in use — another instance may be running.`);
  } else {
    console.error('[agent] Server error:', err.message);
  }
  process.exit(1);
});

process.on('SIGINT', () => { wss.close(); process.exit(0); });
process.on('SIGTERM', () => { wss.close(); process.exit(0); });
