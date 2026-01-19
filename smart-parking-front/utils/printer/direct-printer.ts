import { invoke } from "@tauri-apps/api/core";
import { PRINTER_CONFIG } from "./printer-config";

/* ===================== TYPES ===================== */

interface ReceiptData {
  company_name?: string;
  company_subtitle?: string;

  receipt_type?: string;
  receipt_id?: string;
  receipt_number?: string;

  plate_number?: string;
  vehicle_type?: string;

  operator?: string;
  entry_time?: string;
  exit_time?: string;

  gate?: string;

  total_amount?: string;

  // TABLE
  item_description?: string;
  item_quantity?: string;
  item_day?: string;
  item_amount?: string;

  duration_minutes?: number;

  // QR
  qr_code_data?: string;
  tigopesa_number?: string;

  [key: string]: any;
}

interface PrintReceiptRequest {
  printer_name: string;
  receipt_data: ReceiptData;
}

/* ===================== PUBLIC API ===================== */

export async function printReceiptDirect(
  receiptData: ReceiptData,
  printerName?: string
): Promise<void> {
  const printer = printerName || PRINTER_CONFIG.defaultPrinterName;
  const formattedReceipt = formatReceiptForPrinting(receiptData);

  const request: PrintReceiptRequest = {
    printer_name: printer,
    receipt_data: formattedReceipt,
  };

  await invoke("print_receipt", { request });
}

/* ===================== FORMATTER ===================== */

function formatReceiptForPrinting(data: ReceiptData): ReceiptData {
  const now = new Date();

  const formattedDateTime = `${now
    .getDate()
    .toString()
    .padStart(2, "0")}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${now.getFullYear()} ${now
    .getHours()
    .toString()
    .padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

  const cleanAmount = extractNumericAmount(data.total_amount || "0");

  /* ========= BILLING RULE =========
     • Minimum = 0.5 Day
     • Every 12 hours = +0.5 Day
  ================================= */

  let billableDays = 0.5;

  if (typeof data.duration_minutes === "number") {
    const hours = data.duration_minutes / 60;
    billableDays = Math.ceil(hours / 12) * 0.5;
    if (billableDays < 0.5) billableDays = 0.5;
  } else if (data.item_quantity) {
    const parsed = parseFloat(data.item_quantity);
    billableDays = parsed < 0.5 ? 0.5 : parsed;
  }

  const quantity = billableDays.toFixed(1);

  /* ================= QR ================= */

  const tigopesaNumber = data.tigopesa_number || "45107230";
  const qrCodeData =
    data.qr_code_data ||
    generateTigoPesaQRCode(tigopesaNumber, cleanAmount);

  /* ================= FINAL DATA ================= */

  return {
    company_name: "CHATO DISTRICT COUNCIL",
    company_subtitle: "STAKABADHI YA MALIPO",

    receipt_number: data.receipt_id
      ? `Na. ${data.receipt_id}`
      : "Na. AUTO",

    date_time: `Tarehe: ${formattedDateTime}`,

    maelezo_title: "Maelezo",
    kiasi_title: "Kiasi (TZS)",

    item_description: data.vehicle_type || "Parking Fee",
    item_quantity: quantity,
    item_day: "Day",
    item_amount: cleanAmount,

    total_label: "JUMLA:",
    total_amount: cleanAmount,

    operator_label: "Mpokea Fedha:",
    operator_name: data.operator || "N/A",

    location_label: "Mahali:",
    location: data.gate || "N/A",

    qr_code_data: qrCodeData,
    tigopesa_number: tigopesaNumber,
  };
}

/* ===================== HELPERS ===================== */

function generateTigoPesaQRCode(phoneNumber: string, amount: string): string {
  const cleanAmount = amount.replace(/[^\d]/g, "");
  return `*150*01*${phoneNumber}*${cleanAmount}#`;
}

function extractNumericAmount(amount: string): string {
  const cleaned = amount.replace(/[^\d,]/g, "");
  return cleaned || "0";
}
