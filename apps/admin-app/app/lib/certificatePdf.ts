"use client";

import { jsPDF } from "jspdf";
// html2canvas-pro (not html2canvas): Tailwind v4's default palette uses the
// oklch/oklab CSS color functions, which the original html2canvas cannot
// parse ("Attempting to parse an unsupported color function"). This fork
// adds support for them and is otherwise API-compatible.
import html2canvas from "html2canvas-pro";

// Collect every stylesheet from the current page (link tags + inline style blocks).
// Re-injected into the print iframe so Tailwind classes, @font-face from next/font,
// and CSS variables all resolve correctly.
function collectPageStylesheets(): string {
  const linkTags = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  )
    .map((el) => `<link rel="stylesheet" href="${el.href}">`)
    .join("\n");

  const styleTags = Array.from(document.querySelectorAll("head > style"))
    .map((el) => `<style>${el.textContent ?? ""}</style>`)
    .join("\n");

  return `${linkTags}\n${styleTags}`;
}

// Wait for every <img> in the iframe document to fully load before printing,
// otherwise the badge and logo appear blank in the output.
function waitForIframeImages(doc: Document): Promise<void> {
  return Promise.all(
    Array.from(doc.querySelectorAll("img")).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          }),
    ),
  ).then(() => undefined);
}

// Uses the browser's native print-to-PDF pipeline instead of rasterising the
// DOM to a canvas image. This produces a true vector PDF: crisp text, sharp
// gradients, correct blend modes, and proper font rendering — without any of
// the html2canvas limitations.
//
// A hidden iframe is created containing the certificate HTML with all current
// page stylesheets. window.print() is called on that iframe; the browser opens
// its native print/save-as-PDF dialog. The returned Promise resolves when the
// print dialog is triggered so the loading spinner clears at the right moment.
export function downloadCertificatePdf(root: HTMLElement, fileName: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const stylesheets = collectPageStylesheets();
    // next/font sets CSS-variable classes (e.g. __variable_playfair) on <html>.
    // Mirror them in the iframe so font-family variables resolve correctly.
    const htmlClass = document.documentElement.className;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    // Off-screen with A4 landscape dimensions so layout resolves at print size.
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:297mm;height:210mm;border:none;";
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    };

    const doPrint = () => {
      const win = iframe.contentWindow!;
      win.focus();
      win.print();
      resolve();
    };

    // Wait for fonts then images before printing; images (badge, logo) load
    // asynchronously and must be complete or they appear blank in the output.
    iframe.addEventListener("load", () => {
      const win = iframe.contentWindow!;
      win.addEventListener("afterprint", cleanup);
      win.document.fonts.ready
        .then(() => waitForIframeImages(win.document))
        .then(doPrint)
        .catch(() => { doPrint(); cleanup(); });
    });

    // root.innerHTML gives the certificate content without the on-screen wrapper
    // styles (e.g. max-w-[900px]); the iframe's A4 body dimensions take over so
    // container queries and aspect-ratio fill the page correctly.
    iframe.srcdoc = `<!DOCTYPE html>
<html class="${htmlClass}">
<head>
<meta charset="utf-8">
<title>${fileName}</title>
${stylesheets}
<style>
  @page { size: A4 landscape; margin: 0; }
  html, body { margin: 0; padding: 0; width: 297mm; height: 210mm; overflow: hidden; }
  /* Force background colours/images to print — browsers suppress them by default */
  *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  * { box-shadow: none !important; }
</style>
</head>
<body>${root.innerHTML}</body>
</html>`;
  });
}

// Rasterises the certificate DOM node into a real PDF Blob (A4 landscape).
// Unlike downloadCertificatePdf above — which hands off to the browser's
// native print dialog — this returns actual PDF bytes, which is what's
// needed to hand the document to QZ Tray for silent printing.
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
