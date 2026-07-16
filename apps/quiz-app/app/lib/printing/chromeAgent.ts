"use client";

/**
 * Browser-side client for the Paintshop Print Agent (ws://127.0.0.1:8998).
 * The agent is a small Node.js server running locally on the user's machine.
 * Exports are identical to the old Chrome-extension bridge so nothing else changes.
 */

const AGENT_URL = "ws://127.0.0.1:8998";
const CONNECT_TIMEOUT_MS = 3_000;

// Module-level singletons — one WebSocket shared across all calls in the tab.
let ws: WebSocket | null = null;
let connecting: Promise<WebSocket> | null = null;
let seq = 0;
const pending = new Map<string, (res: Record<string, unknown>) => void>();

async function connect(): Promise<WebSocket> {
  if (ws?.readyState === WebSocket.OPEN) return ws;
  if (connecting) return connecting;

  connecting = new Promise<WebSocket>((resolve, reject) => {
    const conn = new WebSocket(AGENT_URL);

    const timer = setTimeout(() => {
      conn.close();
      reject(
        new Error(
          "Print agent not responding. " +
            "Run install.bat in apps/print-agent/ then start the agent with: node src/index.js",
        ),
      );
    }, CONNECT_TIMEOUT_MS);

    conn.onopen = () => {
      clearTimeout(timer);
      ws = conn;
      connecting = null;
      resolve(conn);
    };

    conn.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data as string) as Record<string, unknown>;
        const cb = pending.get(msg.requestId as string);
        if (cb) {
          pending.delete(msg.requestId as string);
          cb(msg);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    conn.onclose = () => {
      ws = null;
      connecting = null;
    };

    conn.onerror = () => {
      clearTimeout(timer);
      ws = null;
      connecting = null;
      reject(
        new Error(
          "Could not connect to the print agent. " +
            "Make sure the Paintshop Print Agent is running on this machine (apps/print-agent/).",
        ),
      );
    };
  });

  return connecting;
}

async function call<T extends object>(
  type: string,
  payload: Record<string, unknown> = {},
  timeoutMs = 10_000,
): Promise<T> {
  const conn = await connect();
  return new Promise<T>((resolve, reject) => {
    const requestId = `${++seq}_${Date.now()}`;

    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error("Print agent did not respond in time."));
    }, timeoutMs);

    pending.set(requestId, (res) => {
      clearTimeout(timer);
      const r = res as { success: boolean; error?: string } & T;
      if (r.success) resolve(r);
      else reject(new Error(r.error ?? "Print agent error"));
    });

    conn.send(JSON.stringify({ type, requestId, ...payload }));
  });
}

/** Returns true if the local print agent is running and reachable. */
export async function isAgentAvailable(): Promise<boolean> {
  try {
    await call("PING", {}, 2_000);
    return true;
  } catch {
    return false;
  }
}

export interface ChromePrinter {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  uri: string;
}

export async function getPrinters(): Promise<{ printers: ChromePrinter[] }> {
  const res = await call<{ printers: Array<{ name: string; isDefault: boolean }> }>(
    "GET_PRINTERS",
  );
  return {
    printers: res.printers.map((p) => ({
      id: p.name,
      name: p.name,
      description: "",
      isDefault: p.isDefault,
      uri: "",
    })),
  };
}

export interface ChromePrintOptions {
  printerId: string;
  title?: string;
  copies?: number;
  color?: "color" | "monochrome";
  duplex?: "simplex" | "long-edge" | "short-edge";
}

export function submitPrintJob(
  pdfBase64: string,
  options: ChromePrintOptions,
): Promise<{ status: string }> {
  return call<{ status: string }>("PRINT_JOB", {
    pdfBase64,
    printerName: options.printerId || undefined,
    jobName: options.title,
  });
}
