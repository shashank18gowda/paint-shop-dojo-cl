"use client";

import { jsPDF } from "jspdf";
// html2canvas-pro (not html2canvas): Tailwind v4's default palette uses the
// oklch/oklab CSS color functions, which the original html2canvas cannot
// parse ("Attempting to parse an unsupported color function"). This fork
// adds support for them and is otherwise API-compatible.
import html2canvas from "html2canvas-pro";

// Rasterises the certificate DOM node into a real PDF Blob (A4 landscape).
// This is what's needed to hand the document to the Paintshop Dojo Print
// Agent for silent printing (see lib/hooks/usePrint.ts).
export async function generateCertificatePdfBlob(root: HTMLElement): Promise<Blob> {
  await document.fonts.ready;

  const canvas = await html2canvas(root, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageWidth, pageHeight);

  return pdf.output("blob");
}
