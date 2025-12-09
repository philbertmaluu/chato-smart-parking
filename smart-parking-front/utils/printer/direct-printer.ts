import { invoke } from '@tauri-apps/api/core';
import { PRINTER_CONFIG } from './printer-config';

interface ReceiptData {
  company_name?: string;
  receipt_type?: string;
  receipt_id?: string;
  plate_number?: string;
  amount?: string;
  footer?: string;
  [key: string]: any;
}

interface PrintReceiptRequest {
  printer_name: string;
  receipt_data: ReceiptData;
}

/**
 * Print receipt directly to USB printer using Tauri command
 * This works without backend - prints directly from frontend
 * 
 * @param printerName - Windows printer name (e.g., "POS-80C" or "POS80C" for shared). 
 *                      If not provided, uses default from PRINTER_CONFIG
 * @param receiptData - Receipt data to print
 */
export async function printReceiptDirect(
  receiptData: ReceiptData,
  printerName?: string
): Promise<void> {
  const printer = printerName || PRINTER_CONFIG.defaultPrinterName;
  try {
    const request: PrintReceiptRequest = {
      printer_name: printer,
      receipt_data: receiptData,
    };

    const result = await invoke<string>('print_receipt', { request });
    console.log('Print result:', result);
  } catch (error) {
    console.error('Direct print error:', error);
    throw new Error(`Failed to print: ${error}`);
  }
}

/**
 * Get list of available Windows printers
 */
export async function getAvailablePrinters(): Promise<string[]> {
  try {
    const printers = await invoke<string[]>('get_available_printers');
    return printers;
  } catch (error) {
    console.error('Failed to get printers:', error);
    // Fallback to common printer names
    return [
      'POS-80C',
      'POS-80C (copy 1)',
      'POS-80C (copy 2)',
      'POS80C',
    ];
  }
}

