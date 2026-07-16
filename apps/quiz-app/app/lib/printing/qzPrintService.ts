"use client";

import { ensureQzConnected } from "./qzConnection";
import { getPrinters, submitPrintJob } from "./chromeAgent";
import { QzPrintError } from "./qzErrors";
import type { PrintJobOptions, PrintRequest } from "./qzTypes";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — we pass the raw payload.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function resolvePrinterId(printerName?: string): Promise<string> {
  const { printers } = await getPrinters().catch((err) => {
    throw new QzPrintError("PRINTER_NOT_FOUND", "Could not retrieve the printer list.", err);
  });

  if (printerName) {
    const lq = printerName.toLowerCase();
    const match = printers.find((p) => p.name.toLowerCase().includes(lq));
    if (!match) throw new QzPrintError("PRINTER_NOT_FOUND", `No printer found matching "${printerName}".`);
    return match.id;
  }

  const def = printers.find((p) => p.isDefault) ?? printers[0];
  if (!def) throw new QzPrintError("PRINTER_NOT_FOUND", "No default printer is configured on this machine.");
  return def.id;
}

export async function printContent(request: PrintRequest): Promise<void> {
  await ensureQzConnected();

  if (request.type !== "pdf") {
    throw new QzPrintError(
      "PRINT_FAILED",
      `Content type "${request.type}" is not supported by the Chrome Print Agent. Only PDF is supported.`,
    );
  }

  const printerId = await resolvePrinterId(request.options?.printerName);

  try {
    await submitPrintJob(request.data, {
      printerId,
      title: request.options?.jobName ?? "Paintshop Dojo",
      copies: request.options?.copies,
      color: request.options?.color,
      duplex: request.options?.duplex,
    });
  } catch (err) {
    if (err instanceof QzPrintError) throw err;
    throw new QzPrintError(
      "PRINT_FAILED",
      "The print job could not be completed. Check the printer connection and try again.",
      err,
    );
  }
}

export function printPdfBase64(data: string, options?: PrintJobOptions): Promise<void> {
  return printContent({ type: "pdf", data, options });
}

export async function printPdfBlob(blob: Blob, options?: PrintJobOptions): Promise<void> {
  return printPdfBase64(await blobToBase64(blob), options);
}
