"use client";

// Thin alias kept so any existing import of useQzPrint still compiles.
// New code should import usePrint instead.
import { usePrint } from "./usePrint";

export function useQzPrint() {
  const { printBlob, isPrinting, error, reset } = usePrint();
  return { printPdf: printBlob, isPrinting, error, reset };
}
