"use client";

import { ensureQzConnected } from "./qzConnection";
import { getPrinters } from "./chromeAgent";
import { QzPrintError } from "./qzErrors";
import type { QzPrinterInfo } from "./qzTypes";

async function fetchPrinters() {
  const { printers } = await getPrinters().catch((err) => {
    throw new QzPrintError("PRINTER_NOT_FOUND", "Could not retrieve the printer list.", err);
  });
  return printers;
}

export async function getDefaultPrinter(): Promise<string> {
  await ensureQzConnected();
  const printers = await fetchPrinters();
  const def = printers.find((p) => p.isDefault) ?? printers[0];
  if (!def) throw new QzPrintError("PRINTER_NOT_FOUND", "No default printer is configured on this machine.");
  return def.name;
}

export async function listPrinters(): Promise<QzPrinterInfo[]> {
  await ensureQzConnected();
  const printers = await fetchPrinters();
  return printers.map((p) => ({ name: p.name, isDefault: p.isDefault }));
}

export async function findPrinter(query: string): Promise<string> {
  await ensureQzConnected();
  const printers = await fetchPrinters();
  const lq = query.toLowerCase();
  const match = printers.find((p) => p.name.toLowerCase().includes(lq));
  if (!match) throw new QzPrintError("PRINTER_NOT_FOUND", `No printer found matching "${query}".`);
  return match.name;
}
