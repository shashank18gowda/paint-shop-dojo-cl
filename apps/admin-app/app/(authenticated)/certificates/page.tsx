"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconSearch, IconChevronDown, IconChevronLeft, IconChevronRight,
  IconDownload, IconPrinter, IconAward, IconCheck,
  IconCalendar, IconEye, IconMoreVertical,
} from "../../components/icons";
import { useCertificates } from "../../lib/hooks/useCertificates";
import { useLines } from "../../lib/hooks/useLines";
import { usePlants } from "../../lib/hooks/usePlants";
import { CertificateTemplate } from "../../components/certificate/CertificateTemplate";
import type { ParticipantCertificate } from "../../types/master-data.types";
import { downloadCertificatePdf, generateCertificatePdfBlob } from "../../lib/certificatePdf";
import { usePrint } from "../../lib/hooks/usePrint";

const PAGE_SIZE = 10;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg cursor-pointer focus:outline-none"
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
        <IconChevronDown size={13} />
      </span>
    </div>
  );
}

function ActionMenu({ cert }: { cert: ParticipantCertificate }) {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const hiddenCertRef = useRef<HTMLDivElement>(null);
  const { printBlob } = usePrint();

  // Triggered after the hidden CertificateTemplate is mounted in the DOM.
  useEffect(() => {
    if (!isDownloading || !hiddenCertRef.current) return;

    const root = hiddenCertRef.current;

    Promise.resolve().then(async () => {
      try {
        await downloadCertificatePdf(root, cert.certificateNo);
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert(`Failed to generate PDF: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsDownloading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDownloading]);

    useEffect(() => {
    if (!isPrinting || !hiddenCertRef.current) return;

    const root = hiddenCertRef.current;

    Promise.resolve().then(async () => {
      try {
        const blob = await generateCertificatePdfBlob(root);
        await printBlob(blob, { jobName: `Certificate ${cert.certificateNo}` });
      } catch (err) {
        console.error("Print failed:", err);
        alert(`Failed to print: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsPrinting(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrinting]);

  const participantMeta = [cert.employeeCode, cert.designationName, cert.lineName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <IconMoreVertical size={15} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-lg py-1 shadow-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Link
              href={`/certificates/${cert.attemptId}`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--content-bg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              onClick={() => setOpen(false)}
            >
              <IconEye size={14} /> View Certificate
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              onClick={() => { setIsDownloading(true); setOpen(false); }}
              disabled={isDownloading}
            >
              <IconDownload size={14} />
              {isDownloading ? "Loading…" : "Print PDF"}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--text)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--content-bg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              onClick={() => { setIsPrinting(true); setOpen(false); }}
              disabled={isPrinting}
            >
              <IconPrinter size={14} />
              {isPrinting ? "Printing…" : "Print"}
            </button>
          </div>
        </>
      )}

      {/* Off-screen CertificateTemplate rendered only during PDF capture */}
      {(isDownloading || isPrinting) && (
        <div
          ref={hiddenCertRef}
          style={{
            position: "fixed",
            top: 0,
            left: "-9999px",
            width: "1200px",
            zIndex: -1,
            pointerEvents: "none",
          }}
          aria-hidden
        >
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
          />
        </div>
      )}
    </div>
  );
}

export default function CertificatesPage() {
  const [search, setSearch] = useState("");
  const [desg, setDesg] = useState("All Designations");
  const [status, setStatus] = useState("All Status");
  const [lineId, setLineId] = useState("");
  const [plantId, setPlantId] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  const { data: lines } = useLines();
  const { data: plants } = usePlants();

  const query = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    designationName: desg !== "All Designations" ? desg : undefined,
    status: status !== "All Status" ? status : undefined,
    lineId: lineId || undefined,
    plantId: plantId || undefined,
  };

  const { data, isLoading, isError } = useCertificates(query);
  const certificates = data?.data ?? [];
  const total = data?.total ?? 0;
  const validCount = data?.validCount ?? total;
  const issuedThisMonth = data?.issuedThisMonth ?? 0;
  const todayCount = certificates.filter((c) => new Date(c.issuedAt).toDateString() === new Date().toDateString()).length;
  const designationOptions = ["All Designations", ...(data?.designationOptions ?? [])].map((option) => ({ label: option, value: option }));
  const statusOptions = ["All Status", ...(data?.statusOptions ?? ["Valid"])].map((option) => ({ label: option, value: option }));
  const lineOptions = [{ label: "All Lines", value: "" }, ...(lines ?? []).map((l) => ({ label: l.name, value: l.id }))];
  const plantOptions = [{ label: "All Plants", value: "" }, ...(plants ?? []).map((p) => ({ label: p.name, value: p.id }))];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = totalPages <= 5 ?
    Array.from({ length: totalPages }, (_, index) => index + 1) :
    [1, 2, 3, "...", totalPages];

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl space-y-4">
        <div className="h-10 w-48 rounded-lg bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl p-5 bg-slate-200 animate-pulse h-28" />
          ))}
        </div>
        <div className="rounded-xl p-4 bg-slate-200 animate-pulse h-16" />
        <div className="rounded-xl p-4 bg-slate-200 animate-pulse h-72" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-7xl text-sm text-red-500">Unable to load certificates. Please try again.</div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Certificates</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {validCount} valid · {todayCount} issued today
          </p>
        </div>
        {/*<button
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
        >
          <IconDownload size={14} />
          Bulk Export
        </button> */}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total Issued</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{total}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>in the current filter</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Valid</p>
          <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>{validCount}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-sub)" }}>100% of issued certificates</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Issued This Month</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{issuedThisMonth}</p>
          <p className="text-xs mt-1" style={{ color: "#16a34a" }}>from current filter</p>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }}>
              <IconSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by name, employee code, or certificate number…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
              style={{ background: "var(--content-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <FilterSelect value={desg} onChange={(value) => { setDesg(value); setPage(1); }} options={designationOptions} />
          <FilterSelect value={lineId} onChange={(value) => { setLineId(value); setPage(1); }} options={lineOptions} />
          <FilterSelect value={plantId} onChange={(value) => { setPlantId(value); setPage(1); }} options={plantOptions} />
          <FilterSelect value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={statusOptions} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--content-bg)" }}>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Certificate No.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Participant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Designation</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Performance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Issued</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-sub)" }}>
                  No certificates match your filters.
                </td>
              </tr>
            ) : (
              certificates.map((cert, index) => {
                const performanceColor = cert.performanceColor ?? "#22c55e";
                return (
                  <tr
                    key={cert.id}
                    style={{
                      borderBottom: index < certificates.length - 1 ? "1px solid var(--border)" : "none",
                      opacity: 1,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--content-bg)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                          style={{ background: `${performanceColor}18`, color: performanceColor }}
                        >
                          <IconAward size={15} />
                        </div>
                        <Link href={`/certificates/${cert.attemptId}`} className="font-mono text-xs font-bold hover:underline" style={{ color: "var(--text)" }}>
                          {cert.certificateNo}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shrink-0" style={{ background: "rgba(235,10,30,0.08)", color: "#EB0A1E" }}>
                          {cert.participantName.split(" ").map((word) => word[0] ?? "").join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: "var(--text)" }}>{cert.participantName}</p>
                          <p className="text-xs font-mono" style={{ color: "var(--text-sub)" }}>{cert.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--text-muted)" }}>{cert.designationName}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${performanceColor}18`, color: performanceColor }}
                        >
                          {cert.performanceName}
                        </span>
                        <span className="text-xs font-bold" style={{ color: "var(--text)" }}>{Math.round(cert.percentage)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        <IconCalendar size={11} />
                        {formatDate(cert.issuedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.10)", color: "#16a34a" }}>
                        <IconCheck size={11} />
                        Valid
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionMenu cert={cert} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--content-bg)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total} certificates
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              disabled={page === 1}
            >
              <IconChevronLeft size={13} />
            </button>
            {pageNumbers.map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => typeof item === "number" && setPage(item)}
                className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-md text-xs font-medium"
                style={
                  item === page
                    ? { background: "#EB0A1E", color: "#fff" }
                    : { color: "var(--text-muted)", border: "1px solid transparent" }
                }
                disabled={item === "..."}
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              disabled={page >= totalPages}
            >
              <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
