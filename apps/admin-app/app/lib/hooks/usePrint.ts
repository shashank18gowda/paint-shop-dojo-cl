"use client";

import { useMutation } from "@tanstack/react-query";
import { printPdfBlob, describeQzError } from "../printing";
import type { PrintJobOptions } from "../printing";

/**
 * Generic silent-print hook. Works for any screen that can produce a PDF Blob
 * (certificates, reports, labels, etc.). Requires the Paintshop Dojo Print Agent
 * (local Node.js server on 127.0.0.1:8998) to be running on the user's machine.
 *
 * Usage:
 *   const { printBlob, isPrinting, error } = usePrint();
 *   await printBlob(myPdfBlob, { jobName: "My Doc" });
 */
export function usePrint() {
  const mutation = useMutation({
    mutationFn: ({ blob, options }: { blob: Blob; options?: PrintJobOptions }) =>
      printPdfBlob(blob, options),
  });

  return {
    printBlob: (blob: Blob, options?: PrintJobOptions) =>
      mutation.mutateAsync({ blob, options }),
    isPrinting: mutation.isPending,
    error: mutation.error ? describeQzError(mutation.error) : null,
    reset: mutation.reset,
  };
}
