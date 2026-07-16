"use client";

import Image from "next/image";
import { useId, type ReactNode } from "react";
import {
  Playfair_Display,
  Cinzel_Decorative,
  Cormorant_Garamond,
} from "next/font/google";

const heading = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const decorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["700", "900"],
});

const body = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600", "700"],
});

const NAVY = "#16284c";
const CREAM = "#fffdf3";

export interface CertificateSignatory {
  name: string;
  title: string;
  subtitle?: string;
}

export interface CertificateTemplateProps {
  /** Name of the participant — shown on the awarded-to line. */
  participantName: string;
  /** Small caption under the participant name, e.g. employee code / designation / line. */
  participantMeta?: string;
  /** Sub-title under "Certificate", e.g. OF ACHIEVEMENT / OF APPRECIATION. */
  certificateLabel?: string;
  /** Main body copy. Wrap key terms in <strong> for emphasis. */
  bodyText: ReactNode;
  certificateNo?: string;
  issuedDate?: string;
  signatories?: [CertificateSignatory, CertificateSignatory];
  proLabel?: string;
  logoSrc?: string;
  badgeSrc?: string;
  className?: string;
}

const DEFAULT_SIGNATORIES: [CertificateSignatory, CertificateSignatory] = [
  {
    name: "M Abdul Khadir",
    title: "General Manager",
    subtitle: "Global Best Manufacturing",
  },
  {
    name: "B Padmanabha",
    title: "EVP & Director",
    subtitle: "Manufacturing",
  },
];

export function CertificateTemplate({
  participantName,
  participantMeta,
  certificateLabel = "OF APPRECIATION",
  bodyText,
  certificateNo,
  issuedDate,
  signatories = DEFAULT_SIGNATORIES,
  proLabel = "Toyota Pro",
  logoSrc = "/toyotalogo.png",
  badgeSrc = "/badge.jpg",
  className = "",
}: CertificateTemplateProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        aspectRatio: "297 / 210",
        background: CREAM,
        border: `1.4cqw solid ${NAVY}`,
        containerType: "inline-size",
      }}
    >
      <CornerOrnament
        gradientId={`${uid}-tl`}
        className="absolute top-[0.7cqw] left-[0.7cqw] h-[15cqw] w-[15cqw]"
      />
      <CornerOrnament
        gradientId={`${uid}-tr`}
        flipX
        className="absolute top-[0.7cqw] right-[0.7cqw] h-[15cqw] w-[15cqw]"
      />
      <CornerOrnament
        gradientId={`${uid}-bl`}
        flipY
        className="absolute bottom-[0.7cqw] left-[0.7cqw] h-[15cqw] w-[15cqw]"
      />
      <CornerOrnament
        gradientId={`${uid}-br`}
        flipX
        flipY
        className="absolute bottom-[0.7cqw] right-[0.7cqw] h-[15cqw] w-[15cqw]"
      />

      {/* <div className="relative flex h-full flex-col justify-between px-[5.5cqw] py-[3cqw]"> */}
      <div className="relative flex h-full flex-col justify-between px-[5.5cqw] pt-[10cqw] pb-[3cqw]">
        {/* Header */}

        <div className="flex items-center justify-between gap-[2cqw]">
          <div className="relative ml-[5.5cqw] h-[10cqw] w-[10cqw] shrink-0 overflow-hidden rounded-[0.8cqw] shadow-sm ring-1 ring-black/5">
            <Image
              src={logoSrc}
              alt="Toyota Kirloskar Motor"
              fill
              sizes="10vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="flex-1 px-[1cqw] text-center">
            {/* <h1
              className={`${heading.className} text-[4.3cqw] font-bold leading-tight`}
              style={{ color: "#15171c" }}
            >
              Toyota Kirloskar Motor
            </h1> */}
            <h1
              className={`${heading.className} mb-[1.5cqw] text-[4.3cqw] font-bold leading-tight`}
              style={{ color: "#15171c" }}
            >
              Toyota Kirloskar Motor
            </h1>
            <h2
              className={`${decorative.className} mt-[0.5cqw] text-[4cqw] font-bold leading-none`}
              style={{ color: NAVY }}
            >
              Certificate
            </h2>
            <p
              className="mt-[0.8cqw] text-[1.5cqw] font-semibold uppercase tracking-[0.4em]"
              style={{ color: "#3f4654" }}
            >
              {certificateLabel}
            </p>
          </div>

          <div className="mr-[5.5cqw] flex w-[11cqw] shrink-0 flex-col items-center">
            <ToyotaProIcon className="h-[9cqw] w-[11cqw]" />
            <p
              className={`${heading.className} mt-[0.5cqw] text-center text-[1.4cqw] font-bold leading-tight`}
              style={{ color: "#15171c" }}
            >
              {proLabel}
            </p>
          </div>
        </div>

        {/* Awarded to / name / body */}
        <div>
          <p
            className={`${body.className} text-center text-[2cqw] italic`}
            style={{ color: "#5b6472" }}
          >
            This certificate is proudly awarded to
          </p>

          <div className="mt-[1.1cqw] text-center">
            <p
              className={`${heading.className} text-[4.7cqw] font-bold leading-tight`}
              style={{ color: NAVY }}
            >
              {participantName}
            </p>
            <div
              className="mx-auto mt-[0.9cqw] h-px w-[55%]"
              style={{ background: NAVY, opacity: 0.35 }}
            />
            {participantMeta && (
              <p
                className="mt-[0.8cqw] text-[1.35cqw] uppercase tracking-[0.25em]"
                style={{ color: "#9ca3af" }}
              >
                {participantMeta}
              </p>
            )}
          </div>

          <div className="mt-[2.2cqw] px-[3cqw]">
            <p
              className={`${body.className} text-center text-[2.3cqw] italic leading-relaxed [&_strong]:font-bold [&_strong]:not-italic [&_strong]:text-[#16284c]`}
              style={{ color: "#3f4654" }}
            >
              {bodyText}
            </p>
          </div>
        </div>

        {/* Footer: badge (signatures removed — Certificate of Appreciation has no signatories) */}
        <div>
          <div className="flex items-end justify-center gap-[2cqw]">
            {/* <SignatureBlock {...signatories[0]} className="ml-[5.5cqw]" /> */}
            <div className="relative h-[15cqw] w-[15cqw] shrink-0">
              <Image
                src={badgeSrc}
                alt=""
                fill
                sizes="10vw"
                className="object-contain mix-blend-multiply"
              />
            </div>
            {/* <SignatureBlock {...signatories[1]} className="mr-[5.5cqw]" /> */}
          </div>

          {(certificateNo || issuedDate) && (
            <div
              className="mt-[1.3cqw] flex items-center justify-center gap-[1.3cqw] text-[1.1cqw] uppercase tracking-[0.25em]"
              style={{ color: "#b0b6c0" }}
            >
              {certificateNo && <span>Certificate No. {certificateNo}</span>}
              {certificateNo && issuedDate && <span>•</span>}
              {issuedDate && <span>Issued {issuedDate}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Signatures removed — Certificate of Appreciation is unsigned. Kept here in
// case a future certificate type needs signatories again.
// function SignatureBlock({
//   name,
//   title,
//   subtitle,
//   className = "",
// }: CertificateSignatory & { className?: string }) {
//   return (
//     <div className={`w-[26%] text-center ${className}`}>
//       <p
//         className={`${heading.className} text-[2.1cqw] italic leading-tight`}
//         style={{ color: "#1f2530" }}
//       >
//         {name}
//       </p>
//       <div
//         className="mx-auto mt-[0.7cqw] h-px w-full"
//         style={{ background: "#9ca3af" }}
//       />
//       <p
//         className="mt-[0.7cqw] text-[1.4cqw] font-semibold uppercase tracking-[0.15em]"
//         style={{ color: "#3f4654" }}
//       >
//         {title}
//       </p>
//       {subtitle && (
//         <p className="text-[1.2cqw]" style={{ color: "#9ca3af" }}>
//           {subtitle}
//         </p>
//       )}
//     </div>
//   );
// }

/**
 * Hand-drawn gold filigree corner flourish, mirrored for all 4 corners via an
 * SVG-native <g transform>. Deliberately NOT mirrored with a CSS class
 * (e.g. -scale-x-100) on the <svg> itself: html2canvas (used by the silent
 * print path — see certificatePdf.ts) fails to composite elements with a
 * negative-scale CSS transform, silently dropping them from the raster —
 * every corner but the untransformed top-left went missing on real printouts.
 * A transform baked into the SVG's own render tree renders correctly in both
 * the browser and html2canvas.
 */
function CornerOrnament({
  className,
  gradientId,
  flipX = false,
  flipY = false,
}: {
  className?: string;
  gradientId: string;
  flipX?: boolean;
  flipY?: boolean;
}) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  const tx = flipX ? 140 : 0;
  const ty = flipY ? 140 : 0;
  const mirror =
    flipX || flipY ? `matrix(${sx} 0 0 ${sy} ${tx} ${ty})` : undefined;

  return (
    <svg
      viewBox="0 0 140 140"
      aria-hidden="true"
      className={`pointer-events-none ${className ?? ""}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6e8b8" />
          <stop offset="55%" stopColor="#d3ad4a" />
          <stop offset="100%" stopColor="#a3781e" />
        </linearGradient>
      </defs>
      <g transform={mirror}>
        <g fill="none" stroke={`url(#${gradientId})`} strokeLinecap="round">
          <path d="M4 70 V22 Q4 4 22 4 H70" strokeWidth="3" />
          <path
            d="M16 90 V34 Q16 16 34 16 H90"
            strokeWidth="1.5"
            opacity="0.55"
          />
          <path
            d="M22 58 C22 36 38 22 60 24 C80 26 90 44 78 58 C68 69 52 64 54 50 C55 41 65 39 70 46"
            strokeWidth="2.5"
          />
        </g>
        <g fill={`url(#${gradientId})`}>
          <circle cx="70" cy="46" r="3" />
          <circle cx="22" cy="58" r="2" />
          <ellipse cx="104" cy="6" rx="14" ry="5" transform="rotate(12 104 6)" />
          <ellipse
            cx="129"
            cy="12"
            rx="9"
            ry="3.5"
            transform="rotate(12 129 12)"
          />
          <ellipse cx="6" cy="104" rx="5" ry="14" transform="rotate(12 6 104)" />
          <ellipse
            cx="12"
            cy="129"
            rx="3.5"
            ry="9"
            transform="rotate(12 12 129)"
          />
          <circle cx="92" cy="3" r="2" />
          <circle cx="3" cy="92" r="2" />
        </g>
      </g>
    </svg>
  );
}

/** "Toyota Pro" badge icon: an innovation/circuit gear paired with a hard-hat operator. */
function ToyotaProIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Gear / circuit emblem */}
      <g transform="translate(60,85)">
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x="-7"
            y="-52"
            width="14"
            height="20"
            rx="3"
            transform={`rotate(${i * 45})`}
            fill="#3f7e94"
          />
        ))}
        <circle r="36" fill="#3f7e94" />
        <circle r="14" fill="#eef7f9" />
        <g stroke="#eef7f9" strokeWidth="3" strokeLinecap="round">
          <line x1="0" y1="0" x2="0" y2="-34" />
          <line x1="0" y1="0" x2="29" y2="18" />
          <line x1="0" y1="0" x2="-29" y2="18" />
        </g>
        <g fill="#eef7f9">
          <circle cx="0" cy="-34" r="4" />
          <circle cx="29" cy="18" r="4" />
          <circle cx="-29" cy="18" r="4" />
        </g>
      </g>

      {/* Operator with hard hat */}
      <g transform="translate(128,80)">
        <path
          d="M-32 78 C-32 38 -16 22 0 22 C16 22 32 38 32 78 Z"
          fill="#1f2a3d"
        />
        <path d="M-10 30 L0 46 L10 30 Z" fill="#ffffff" />
        <path d="M-5 32 L5 32 L3 60 L0 68 L-3 60 Z" fill="#2f6fb0" />
        <circle cx="0" cy="-8" r="22" fill="#f3c69b" />
        <ellipse cx="0" cy="-22" rx="27" ry="6" fill="#e8650c" />
        <path d="M-22 -22 a22 20 0 0 1 44 0 Z" fill="#ff7a1e" />
        <path
          d="M0 -42 v8"
          stroke="#e8650c"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
