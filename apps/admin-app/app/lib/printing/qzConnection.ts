"use client";

// Availability check for the Paintshop Dojo Print Agent (local WebSocket server).
// Replaces the QZ Tray WebSocket connection — no persistent connection is needed;
// each call opens a short-lived WebSocket to the agent on 127.0.0.1:8998.
import { isAgentAvailable } from "./chromeAgent";
import { QzPrintError } from "./qzErrors";

export async function ensureQzConnected(): Promise<void> {
  const available = await isAgentAvailable();
  if (!available) {
    throw new QzPrintError(
      "CONNECTION_FAILED",
      "The Paintshop Dojo Print Agent is not running on this computer. " +
        "Start it from apps/print-agent/ (see install.bat), then reload the page.",
    );
  }
}

// No persistent connection to track — these are kept for API compatibility.
export function isQzConnected(): boolean {
  return true;
}

export function disconnectQz(): Promise<void> {
  return Promise.resolve();
}
