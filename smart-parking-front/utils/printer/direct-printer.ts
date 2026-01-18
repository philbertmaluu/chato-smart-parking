import { invoke } from '@tauri-apps/api/core';
import { PRINTER_CONFIG } from './printer-config';

interface ReceiptData {
  company_name?: string;
  company_subtitle?: string;
  receipt_type?: string;
  receipt_id?: string;
  plate_number?: string;
  vehicle_type?: string;
  operator?: string;
  entry_time?: string;
  exit_time?: string;
  total_amount?: string;
  gate?: string;
  footer?: string;
  item_quantity?: string;
  item_day?: string;
  [key: string]: any;
}

interface PrintReceiptRequest {
  printer_name: string;
  receipt_data: ReceiptData;
}

/**
 * Sends formatted receipt data to the Tauri backend for direct printing
 */
export async function printReceiptDirect(
  receiptData: ReceiptData,
  printerName?: string
): Promise<void> {
  const printer = printerName || PRINTER_CONFIG.defaultPrinterName;

  const formattedReceipt = formatReceiptForPrinting(receiptData);

  try {
    const request: PrintReceiptRequest = {
      printer_name: printer,
      receipt_data: formattedReceipt,
    };

    const result = await invoke<string>('print_receipt', { request });
    console.log('Print result:', result);
  } catch (error: any) {
    console.error('Direct print error:', error);
    throw new Error(`Failed to print receipt: ${error?.message || error}`);
  }
}

/**
 * Formats receipt data for professional ESC/POS printing
 * - Clean, structured layout
 * - Prevents negative days
 * - Proper alignment and spacing
 * - Tanzanian-style receipt formatting
 */
function formatReceiptForPrinting(data: ReceiptData): ReceiptData {
  const now = new Date();
  const formattedDateTime = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  ).toString().padStart(2, '0')}/${now.getFullYear()} ${now
    .getHours()
    .toString()
    .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
    .getSeconds()
    .toString()
    .padStart(2, '0')}`;

  // Clean amount (only digits + comma)
  const cleanAmount = extractNumericAmount(data.total_amount || "3000");

  // Fix negative/zero days
  let quantity = "1.0";
  if (data.item_quantity) {
    const parsed = parseFloat(data.item_quantity);
    quantity = Math.max(0, parsed).toFixed(1); // never negative
  }

  return {
    // Header
    company_name: "CHATO DISTRICT COUNCIL",
    company_subtitle: "STAKABADHI YA MALIPO",

    // Document identifiers
    receipt_number: data.receipt_id 
      ? `Na. ${data.receipt_id}` 
      : "Na. 6076449C8T-3740B8BC",

    receipt_ref: data.receipt_ref || "Kumb. Na. MC1060120203000320252600000180",

    date_time: `Tarehe: ${formattedDateTime}`,

    // Main content
    maelezo_title: "Maelezo",
    kiasi_title: "Kiasi (TZS)",

    item_description: data.vehicle_type || "Large Buses Stand Fee (Bus)",
    item_quantity: quantity,
    item_day: "Day",
    item_amount: cleanAmount,

    // Footer & operator info
    total_label: "JUMLA:",
    total_amount: cleanAmount,

    operator_label: "Mpokea Fedha:",
    operator_name: data.operator || "LINDA B. SARTAA",

    location_label: "Mipaji:",
    location: data.gate || "JOHANUTA",

    footer: "*** MWISHO WA STAKABADHI ***",
  };
}

/**
 * Extracts numeric value with comma formatting (removes everything except digits & comma)
 */
function extractNumericAmount(amount?: string): string {
  if (!amount) return "0";
  const cleaned = amount.replace(/[^\d,]/g, '');
  return cleaned || "0";
}