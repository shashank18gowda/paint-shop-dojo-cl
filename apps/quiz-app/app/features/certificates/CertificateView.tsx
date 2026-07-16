"use client";

import { useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCertificate } from "../../lib/hooks/useCertificate";
import { usePrint } from "../../lib/hooks/usePrint";
import { generateCertificatePdfBlob } from "../../lib/certificatePdf";
import { useSessionStore } from "../../store/session";
import { PrintIcon, DownloadIcon, Spinner } from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";
import { CertificateTemplate } from "../../components/certificate/CertificateTemplate";

export default function CertificateView() {
  const router = useRouter();
  const { attemptId } = useParams<{ attemptId: string }>();
  useSessionStore((s) => s.token);
  const [downloading, setDownloading] = useState(false);
  const { data: cert, isPending, isError } = useCertificate(attemptId);
  const certRef = useRef<HTMLDivElement>(null);
  const { printBlob, isPrinting, error: printError } = usePrint();

  async function handleDownload() {
    if (!certRef.current || !cert) return;
    setDownloading(true);
    try {
      const root = certRef.current;

      const linkTags = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
      )
        .map((el) => `<link rel="stylesheet" href="${el.href}">`)
        .join("\n");
      const styleTags = Array.from(document.querySelectorAll("head > style"))
        .map((el) => `<style>${el.textContent ?? ""}</style>`)
        .join("\n");
      // next/font sets CSS-variable classes on <html>; mirror them so
      // font-family variables (e.g. --font-playfair-display) resolve correctly.
      const htmlClass = document.documentElement.className;

      await new Promise<void>((resolve) => {
        const iframe = document.createElement("iframe");
        iframe.setAttribute("aria-hidden", "true");
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

        iframe.addEventListener("load", () => {
          const win = iframe.contentWindow!;
          win.addEventListener("afterprint", cleanup);
          // Wait for fonts then images before printing so nothing appears blank.
          const waitImgs = Promise.all(
            Array.from(win.document.querySelectorAll("img")).map((img) =>
              img.complete
                ? Promise.resolve()
                : new Promise<void>((res) => {
                    img.onload = () => res();
                    img.onerror = () => res();
                  }),
            ),
          );
          win.document.fonts.ready
            .then(() => waitImgs)
            .then(doPrint)
            .catch(() => { doPrint(); cleanup(); });
        });

        iframe.srcdoc = `<!DOCTYPE html>
<html class="${htmlClass}">
<head>
<meta charset="utf-8">
<title>${cert.certificateNo ?? "certificate"}</title>
${linkTags}
${styleTags}
<style>
  @page { size: A4 landscape; margin: 0; }
  html, body { margin: 0; padding: 0; width: 297mm; height: 210mm; overflow: hidden; }
  *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  * { box-shadow: none !important; }
</style>
</head>
<body>${root.innerHTML}</body>
</html>`;
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(`Failed to download: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloading(false);
    }
  }

  async function handlePrint() {
    if (!certRef.current || !cert) return;
    try {
      const blob = await generateCertificatePdfBlob(certRef.current);
      await printBlob(blob, { jobName: `Certificate ${cert.certificateNo}` });
    } catch (err) {
      console.error("Print failed:", err);
      alert(`Failed to print: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (isPending) return <PageShell><div className="flex flex-1 items-center justify-center"><Spinner size={36} /></div></PageShell>;

  if (isError || !cert) return (
    <PageShell>
      <PageHeader onBack={() => router.back()} />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center flex flex-col gap-4">
          <p className="text-4xl">⚠️</p>
          <p style={{ color: "var(--text)" }}>Certificate not found.</p>
          <button onClick={() => router.back()} className="rounded-full py-2 px-6 text-sm font-semibold text-white" style={{ background: "#EB0A1E" }}>Go Back</button>
        </div>
      </div>
    </PageShell>
  );

  const issued = new Date(cert.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const participantMeta = [cert.employeeCode, cert.designationName, cert.lineName].filter(Boolean).join(" · ");

  return (
    <>
      <style>{`
        @media print {
          @page { size: landscape; }
          body { margin: 0; }
          .no-print { display: none !important; }
          .cert-card { box-shadow: none !important; border-radius: 0 !important; width: 100vw !important; max-width: 100% !important; }
        }
      `}</style>

      <PageShell>
        <PageHeader onBack={() => router.back()} />

        <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full gap-5 pb-6">

          {/* Certificate card */}
          <div className="cert-card w-full" ref={certRef}>
            <CertificateTemplate
              participantName={cert.participantName}
              participantMeta={participantMeta}
              certificateNo={cert.certificateNo}
              issuedDate={issued}
              className="shadow-2xl"
              bodyText={
                <>
                  We appreciate you for successfully completing the{" "}
                  <strong>Paint Shop Dojo Training Program</strong> and
                  demonstrating a performance level of{" "}
                  <strong>{cert.performanceName}</strong> with a score of{" "}
                  <strong>{Math.round(cert.percentage)}%</strong>. Your
                  dedication will be of prime importance in the success of
                  TKM.
                </>
              }
            />
          </div>

          {/* Actions */}
          <div className="no-print flex flex-col gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{ background: "#EB0A1E", boxShadow: "0 8px 24px rgba(235,10,30,0.25)", opacity: downloading ? 0.7 : 1 }}
            >
              {/* {downloading ? <Spinner size={16} /> : <DownloadIcon />} */}
              {downloading ? "Downloading…" : "Download PDF"}
              {/* {downloading ? "Loading.." : "Print PDF"} */}

            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{ background: "#EB0A1E", boxShadow: "0 8px 24px rgba(235,10,30,0.25)", opacity: downloading ? 0.7 : 1 }}
            >
              {isPrinting ? <Spinner size={16} /> : <PrintIcon />}
              {isPrinting ? "Printing…" : "Print"}
            </button>
            {printError && (
              <p className="text-xs text-center" style={{ color: "#dc2626" }}>
                {printError}
              </p>
            )}
            {/* <button
              onClick={() => window.print()}
              className="w-full rounded-full py-3.5 text-base font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: "var(--bg-card)", border: "2px solid var(--border)", color: "var(--text)" }}
            >
              <PrintIcon /> Print
            </button> */}
            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => router.back()}
                className="text-sm transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Back to Results
              </button>
            </div>
          </div>

        </div>
      </PageShell>
    </>
  );
}
