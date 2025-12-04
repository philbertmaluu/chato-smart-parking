import { API_ENDPOINTS } from './endpoints';
import { get, post } from './api';

export interface PrinterStatus {
  enabled: boolean;
  connection_type: string;
  network: {
    ip: string;
    port: number;
  };
  model: {
    name: string;
    serial: string;
    width: number;
    characters_per_line: number;
  };
  auto_print: {
    on_entry: boolean;
    on_exit: boolean;
  };
}

export interface PrinterStatusResponse {
  success: boolean;
  data: PrinterStatus;
  messages: string;
  status: number;
}

export interface PrintResponse {
  success: boolean;
  data: {
    passage_id?: number;
    passage_number?: string;
    plate_number?: string;
    receipt_id?: number;
    receipt_number?: string;
    total_amount?: number;
  };
  messages: string;
  status: number;
}

export interface TestConnectionResponse {
  success: boolean;
  data: {
    success: boolean;
    message: string;
    config?: {
      type: string;
      ip: string;
      port: number;
    };
  };
  messages: string;
  status: number;
}

/**
 * Printer Service for thermal receipt printing
 */
export class PrinterService {
  /**
   * Get printer status and configuration
   */
  static async getStatus(): Promise<PrinterStatusResponse> {
    return get<PrinterStatusResponse>(API_ENDPOINTS.PRINTER.STATUS);
  }

  /**
   * Test printer connection (prints test page)
   */
  static async testConnection(): Promise<TestConnectionResponse> {
    return post<TestConnectionResponse>(API_ENDPOINTS.PRINTER.TEST, {});
  }

  /**
   * Print entry receipt for a vehicle passage
   */
  static async printEntryReceipt(passageId: number | string): Promise<PrintResponse> {
    return post<PrintResponse>(API_ENDPOINTS.PRINTER.PRINT_ENTRY(passageId), {});
  }

  /**
   * Print exit receipt for a vehicle passage
   */
  static async printExitReceipt(passageId: number | string): Promise<PrintResponse> {
    return post<PrintResponse>(API_ENDPOINTS.PRINTER.PRINT_EXIT(passageId), {});
  }

  /**
   * Print receipt by receipt ID
   */
  static async printReceipt(receiptId: number | string): Promise<PrintResponse> {
    return post<PrintResponse>(API_ENDPOINTS.PRINTER.PRINT_RECEIPT(receiptId), {});
  }
}

