/**
 * Printer Configuration
 * Default printer settings for direct USB printing from frontend
 */

export const DEFAULT_PRINTER_NAME = "POS-80C (copy 1)";

export const PRINTER_CONFIG = {
  /**
   * Default printer name to use for direct printing
   * This should match the exact Windows printer name
   */
  defaultPrinterName: process.env.NEXT_PUBLIC_DEFAULT_PRINTER_NAME || DEFAULT_PRINTER_NAME,
  
  /**
   * Whether to use direct frontend printing (Tauri) or backend API printing
   * Set to true to use direct USB printing from frontend
   * Set to false to use backend API printing
   */
  useDirectPrinting: true,
} as const;

