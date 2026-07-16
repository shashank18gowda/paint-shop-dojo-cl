// Domain types for the print integration. Intentionally generic so
// certificates, reports, labels, and any future print module share the same API.

export type QzErrorCode =
  | "CONNECTION_FAILED"
  | "PRINTER_NOT_FOUND"
  | "PRINT_FAILED";

/** "pdf" is the only type supported by the Paintshop Dojo Print Agent. */
export type PrintContentType = "pdf" | "image" | "html" | "raw";

export interface QzPrinterInfo {
  name: string;
  isDefault: boolean;
}

export interface PrintJobOptions {
  /** Target printer name. Falls back to the OS default printer when omitted. */
  printerName?: string;
  copies?: number;
  color?: "color" | "monochrome";
  duplex?: "simplex" | "long-edge" | "short-edge";
  /** Name shown in the OS print queue. */
  jobName?: string;
}

export interface PrintRequest {
  type: PrintContentType;
  /** Base64-encoded payload, no `data:` URI prefix. */
  data: string;
  options?: PrintJobOptions;
}
