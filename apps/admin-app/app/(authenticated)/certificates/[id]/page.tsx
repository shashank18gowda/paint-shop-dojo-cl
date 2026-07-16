"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  IconArrowLeft,
  IconDownload,
  IconPrinter,
  IconCheck,
  IconCalendar,
  IconAward,
} from "../../../components/icons";
import { useCertificate } from "../../../lib/hooks/useCertificate";
import { usePrint } from "../../../lib/hooks/usePrint";
import type { ParticipantCertificate } from "../../../types/master-data.types";
import { CertificateTemplate } from "../../../components/certificate/CertificateTemplate";
import { downloadCertificatePdf, generateCertificatePdfBlob } from "../../../lib/certificatePdf";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CertificateDetailPage() {
  const { id } = useParams() as { id?: string };
  const { data: cert, isLoading, isError } = useCertificate(id ?? "");
  const [isDownloading, setIsDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  const { printBlob, isPrinting, error: printError } = usePrint();

  const participantHref = cert?.participantId
    ? `/participants/${cert.participantId}`
    : "/participants";
  const attemptHref = cert?.participantId
    ? `/attempts/${cert.attemptId}?participantId=${cert.participantId}&referrer=/certificates/${cert.attemptId}`
    : "/participants";

  async function handleDownload() {
    if (!certRef.current || !cert) return;
    setIsDownloading(true);
    try {
      await downloadCertificatePdf(certRef.current, cert.certificateNo);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(`Failed to generate PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDownloading(false);
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

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl space-y-6">
        <div className="h-10 w-64 rounded-lg bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
        <div className="rounded-xl p-8 bg-slate-200 animate-pulse h-96" />
      </div>
    );
  }

  if (isError || !cert) {
    return (
      <div className="p-8 max-w-7xl">
        <Link
          href="/certificates"
          className="text-sm text-slate-500 hover:underline"
        >
          ← Back to certificates
        </Link>
        <div className="mt-6 rounded-xl p-5 bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">
            Unable to load certificate details. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const performanceColor = cert.performanceColor ?? "#22c55e";

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/certificates"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <IconArrowLeft size={15} />
          </Link>
          <div>
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <Link href="/certificates" className="hover:underline">
                Certificates
              </Link>
              <span>/</span>
              <span
                className="font-mono font-semibold"
                style={{ color: "var(--text)" }}
              >
                {cert.certificateNo}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>
              Issued {formatDate(cert.issuedAt)} · PaintShop Dojo · TKM Training
              System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <IconDownload size={14} />
            {isDownloading ? "Generating…" : "Save as PDF"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "#EB0A1E",
              border: "1px solid #EB0A1E",
              color: "#fff",
            }}
          >
            <IconPrinter size={14} />
            {isPrinting ? "Printing…" : "Print"}
          </button>
          {printError && (
            <p className="text-xs" style={{ color: "#dc2626" }}>
              {printError}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-1 space-y-4">
          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
                style={{
                  background: `${performanceColor}18`,
                  color: performanceColor,
                }}
              >
                <IconAward size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-mono text-xs font-bold"
                  style={{ color: "var(--text)" }}
                >
                  {cert.certificateNo}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-sub)" }}
                >
                  Certificate ID
                </p>
              </div>
            </div>

            <div
              className="space-y-3"
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "1rem",
              }}
            >
              <Row label="Status">
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                  style={{
                    background: "rgba(34,197,94,0.10)",
                    color: "#16a34a",
                  }}
                >
                  <IconCheck size={11} />
                  Valid
                </span>
              </Row>
              <Row label="Performance">
                <span
                  className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: `${performanceColor}18`,
                    color: performanceColor,
                  }}
                >
                  {cert.performanceName}
                </span>
              </Row>
              <Row label="Score">
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--text)" }}
                >
                  {cert.score}/{cert.maxScore}{" "}
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-sub)" }}
                  >
                    ({Math.round(cert.percentage)}%)
                  </span>
                </span>
              </Row>
              <Row label="Issued On">
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: "var(--text)" }}
                >
                  <IconCalendar size={11} />
                  {formatDate(cert.issuedAt)}
                </span>
              </Row>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              className="text-xs font-semibold mb-3 uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Recipient
            </h3>
            <Link
              href={participantHref}
              className="flex items-center gap-3 mb-4 group"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shrink-0"
                style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E" }}
              >
                {cert.participantName
                  .split(" ")
                  .map((word) => word[0] ?? "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-bold group-hover:underline"
                  style={{ color: "var(--text)" }}
                >
                  {cert.participantName}
                </p>
                <p
                  className="text-xs font-mono"
                  style={{ color: "var(--text-sub)" }}
                >
                  {cert.employeeCode}
                </p>
              </div>
            </Link>
            <div
              className="space-y-2.5"
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "0.75rem",
              }}
            >
              <Row label="Designation">
                <span className="text-xs" style={{ color: "var(--text)" }}>
                  {cert.designationName}
                </span>
              </Row>
              <Row label="Line">
                <span className="text-xs" style={{ color: "var(--text)" }}>
                  {cert.lineName ?? "—"}
                </span>
              </Row>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              className="text-xs font-semibold mb-3 uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Source Attempt
            </h3>
            <div className="space-y-2.5">
              <Row label="Score">
                <span className="text-xs" style={{ color: "var(--text)" }}>
                  {cert.score}/{cert.maxScore}
                </span>
              </Row>
              <Row label="Percentage">
                <span className="text-xs" style={{ color: "var(--text)" }}>
                  {Math.round(cert.percentage)}%
                </span>
              </Row>
            </div>
            <Link
              href={attemptHref}
              className="mt-4 flex items-center justify-center w-full py-2 text-xs font-medium rounded-lg transition-colors"
              style={{ background: "var(--content-bg)", color: "var(--text)" }}
            >
              View Attempt Details →
            </Link>
          </div>
        </div>

        <div className="col-span-2">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderBottom: "1px solid var(--border)",
                background: "var(--content-bg)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Certificate Preview
              </p>
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                A4 landscape · 297 × 210 mm
              </p>
            </div>
            <div className="p-8" style={{ background: "#f9fafb" }}>
              <CertificatePreview cert={cert} certRef={certRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function CertificatePreview({
  cert,
  certRef,
}: {
  cert: ParticipantCertificate;
  certRef: React.RefObject<HTMLDivElement | null>;
}) {
  const participantMeta = [
    cert.employeeCode,
    cert.designationName,
    cert.lineName,
  ]
    .filter(Boolean)
    .join(" · ");

  // certRef wraps exactly the certificate width so html2canvas captures no
  // transparent side margins (which JPEG would render as white).
  return (
    <div ref={certRef} className="mx-auto max-w-[900px]">
      <CertificateTemplate
        participantName={cert.participantName}
        participantMeta={participantMeta}
        certificateNo={cert.certificateNo}
        issuedDate={formatDate(cert.issuedAt)}
        bodyText={
          <>
            We appreciate you for successfully completing the{" "}
            <strong>Paint Shop Dojo Training Program</strong> and demonstrating
            a performance level of <strong>{cert.performanceName}</strong> with
            a score of <strong>{Math.round(cert.percentage)}%</strong>. Your
            dedication will be of prime importance in the success of TKM.
          </>
        }
        className="shadow-2xl"
      />
    </div>
  );
}
