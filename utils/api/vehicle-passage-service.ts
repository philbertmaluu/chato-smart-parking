import { post, get, put, del } from './api';
import { API_ENDPOINTS } from './endpoints';

// Types for vehicle passage and gate control
export interface VehiclePassageData {
  plate_number: string;
  gate_id: number;
  body_type_id?: number;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  owner_name?: string;
  account_id?: number;
  payment_type_id?: number;
  passage_type?: 'toll' | 'free' | 'exempted';
  is_exempted?: boolean;
  exemption_reason?: string;
  notes?: string;
  payment_method?: string;
  payment_amount?: number;
  receipt_notes?: string;
}

export interface GateControlData {
  plate_number: string;
  gate_id: number;
  direction: 'entry' | 'exit';
  body_type_id?: number;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  owner_name?: string;
  account_id?: number;
  payment_type_id?: number;
  passage_type?: 'toll' | 'free' | 'exempted';
  is_exempted?: boolean;
  exemption_reason?: string;
  notes?: string;
}

export interface ManualGateControlData {
  gate_id: number;
  action: 'open' | 'close' | 'deny';
  reason?: string;
}

export interface EmergencyGateControlData {
  gate_id: number;
  action: 'open' | 'close' | 'deny';
  emergency_reason: string;
}

export interface VehiclePassageResponse {
  success: boolean;
  message: string;
  data?: any;
  gate_action?: 'open' | 'deny';
  vehicle?: any;
  account_info?: any;
  receipt?: any;
}

export interface GateControlResponse {
  success: boolean;
  message: string;
  gate_action?: 'open' | 'deny';
  data?: any;
  timestamp?: string;
}

export interface ReceiptData {
  id: number;
  receipt_number: string;
  vehicle_passage_id: number;
  amount: number;
  payment_method: string;
  issued_by: number;
  issued_at: string;
  notes?: string;
}

export interface VehiclePassage {
  id: number;
  passage_number: string;
  vehicle_id: number;
  account_id?: number;
  bundle_subscription_id?: number;
  payment_type_id: number;
  entry_time: string;
  entry_operator_id: number;
  entry_gate_id: number;
  entry_station_id: number;
  exit_time?: string;
  exit_operator_id?: number;
  exit_gate_id?: number;
  exit_station_id?: number;
  base_amount: number;
  discount_amount: number;
  total_amount: number;
  passage_type: 'toll' | 'free' | 'exempted';
  status: string;
  is_exempted: boolean;
  exemption_reason?: string;
  notes?: string;
  duration_minutes?: number;
  vehicle?: any;
  account?: any;
  bundle_subscription?: any;
  payment_type?: any;
  entry_operator?: any;
  exit_operator?: any;
  entry_gate?: any;
  exit_gate?: any;
  entry_station?: any;
  exit_station?: any;
  receipts?: ReceiptData[];
}

export interface GateStatus {
  gate: any;
  is_active: boolean;
  gate_type: string;
  station: any;
  last_control_action?: any;
  current_time: string;
}

export interface MonitoringDashboard {
  total_active_gates: number;
  gates_by_type: {
    entry: number;
    exit: number;
    both: number;
  };
  gate_statuses: GateStatus[];
  last_updated: string;
}

// Vehicle Passage Service
export class VehiclePassageService {
  /**
   * Process vehicle entry with plate detection and payment
   */
  static async processEntry(data: VehiclePassageData): Promise<VehiclePassageResponse> {
    return post(API_ENDPOINTS.VEHICLE_PASSAGES.ENTRY, data);
  }

  /**
   * Process vehicle exit with plate detection
   */
  static async processExit(data: {
    plate_number: string;
    gate_id: number;
    payment_confirmed?: boolean;
    notes?: string;
  }): Promise<VehiclePassageResponse> {
    return post(API_ENDPOINTS.VEHICLE_PASSAGES.EXIT, data);
  }

  /**
   * Quick plate lookup for gate control
   */
  static async quickLookup(plateNumber: string): Promise<VehiclePassageResponse> {
    return post(API_ENDPOINTS.VEHICLE_PASSAGES.QUICK_LOOKUP, { plate_number: plateNumber });
  }

  /**
   * Get all vehicle passages with pagination
   */
  static async getPassages(params?: {
    per_page?: number;
    search?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ data: VehiclePassage[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const url = `${API_ENDPOINTS.VEHICLE_PASSAGES.LIST}?${queryParams.toString()}`;
    return get(url);
  }

  /**
   * Get vehicle passage by ID
   */
  static async getPassageById(id: number): Promise<VehiclePassage> {
    return get(API_ENDPOINTS.VEHICLE_PASSAGES.DETAILS(id));
  }

  /**
   * Get passage by passage number
   */
  static async getPassageByNumber(passageNumber: string): Promise<VehiclePassage> {
    return get(API_ENDPOINTS.VEHICLE_PASSAGES.BY_PASSAGE_NUMBER(passageNumber));
  }

  /**
   * Get passages by vehicle ID
   */
  static async getPassagesByVehicle(vehicleId: number, perPage?: number): Promise<{ data: VehiclePassage[]; meta: any }> {
    const queryParams = perPage ? `?per_page=${perPage}` : '';
    return get(`${API_ENDPOINTS.VEHICLE_PASSAGES.BY_VEHICLE(vehicleId)}${queryParams}`);
  }

  /**
   * Get passages by station
   */
  static async getPassagesByStation(stationId: number, perPage?: number): Promise<{ data: VehiclePassage[]; meta: any }> {
    const queryParams = perPage ? `?per_page=${perPage}` : '';
    return get(`${API_ENDPOINTS.VEHICLE_PASSAGES.BY_STATION(stationId)}${queryParams}`);
  }

  /**
   * Get active passages
   */
  static async getActivePassages(): Promise<{ success: boolean; data: VehiclePassage[]; messages: string; status: number }> {
    return get(API_ENDPOINTS.VEHICLE_PASSAGES.ACTIVE_LIST);
  }

  /**
   * Get completed passages
   */
  static async getCompletedPassages(perPage?: number): Promise<{ data: VehiclePassage[]; meta: any }> {
    const queryParams = perPage ? `?per_page=${perPage}` : '';
    return get(`${API_ENDPOINTS.VEHICLE_PASSAGES.COMPLETED_LIST}${queryParams}`);
  }

  /**
   * Get passage statistics
   */
  static async getStatistics(startDate?: string, endDate?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const url = `${API_ENDPOINTS.VEHICLE_PASSAGES.STATISTICS}?${queryParams.toString()}`;
    return get(url);
  }

  /**
   * Update passage status
   */
  static async updateStatus(id: number, status: 'active' | 'cancelled' | 'refunded'): Promise<VehiclePassage> {
    return put(API_ENDPOINTS.VEHICLE_PASSAGES.UPDATE_STATUS(id), { status });
  }

  /**
   * Search passages
   */
  static async searchPassages(search: string, perPage?: number): Promise<{ data: VehiclePassage[]; meta: any }> {
    const queryParams = new URLSearchParams({ search });
    if (perPage) queryParams.append('per_page', perPage.toString());

    const url = `${API_ENDPOINTS.VEHICLE_PASSAGES.SEARCH}?${queryParams.toString()}`;
    return get(url);
  }
}

// Gate Control Service
export class GateControlService {
  /**
   * Process plate detection for gate control
   */
  static async processPlateDetection(data: GateControlData): Promise<GateControlResponse> {
    return post(API_ENDPOINTS.GATE_CONTROL.PLATE_DETECTION, data);
  }

  /**
   * Quick plate lookup for gate control
   */
  static async quickLookup(data: {
    plate_number: string;
    gate_id: number;
    direction: 'entry' | 'exit';
  }): Promise<GateControlResponse> {
    return post(API_ENDPOINTS.GATE_CONTROL.QUICK_LOOKUP, data);
  }

  /**
   * Manual gate control
   */
  static async manualControl(data: ManualGateControlData): Promise<GateControlResponse> {
    return post(API_ENDPOINTS.GATE_CONTROL.MANUAL, data);
  }

  /**
   * Emergency gate control
   */
  static async emergencyControl(data: EmergencyGateControlData): Promise<GateControlResponse> {
    return post(API_ENDPOINTS.GATE_CONTROL.EMERGENCY, data);
  }

  /**
   * Get gate status
   */
  static async getGateStatus(gateId: number): Promise<GateStatus> {
    return get(API_ENDPOINTS.GATE_CONTROL.GATE_STATUS(gateId));
  }

  /**
   * Get all active gates
   */
  static async getActiveGates(): Promise<{ success: boolean; data: any[]; messages: string; status: number }> {
    return get(API_ENDPOINTS.GATE_CONTROL.ACTIVE_GATES);
  }

  /**
   * Get gate control history
   */
  static async getGateControlHistory(gateId: number): Promise<any> {
    return get(API_ENDPOINTS.GATE_CONTROL.GATE_HISTORY(gateId));
  }

  /**
   * Test gate connection
   */
  static async testGateConnection(gateId: number): Promise<any> {
    return get(API_ENDPOINTS.GATE_CONTROL.TEST_CONNECTION(gateId));
  }

  /**
   * Get monitoring dashboard
   */
  static async getMonitoringDashboard(): Promise<MonitoringDashboard> {
    return get(API_ENDPOINTS.GATE_CONTROL.MONITORING_DASHBOARD);
  }
}

// Receipt Service
export class ReceiptService {
  /**
   * Get receipt by ID
   */
  static async getReceiptById(id: number): Promise<ReceiptData> {
    return get(API_ENDPOINTS.RECEIPTS.DETAILS(id));
  }

  /**
   * Get receipt by number
   */
  static async getReceiptByNumber(receiptNumber: string): Promise<ReceiptData> {
    return get(API_ENDPOINTS.RECEIPTS.BY_NUMBER(receiptNumber));
  }

  /**
   * Get receipts by vehicle passage
   */
  static async getReceiptsByVehiclePassage(passageId: number): Promise<ReceiptData[]> {
    return get(API_ENDPOINTS.RECEIPTS.BY_VEHICLE_PASSAGE(passageId));
  }

  /**
   * Get receipt statistics
   */
  static async getStatistics(startDate?: string, endDate?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const url = `${API_ENDPOINTS.RECEIPTS.STATISTICS}?${queryParams.toString()}`;
    return get(url);
  }

  /**
   * Get recent receipts
   */
  static async getRecentReceipts(): Promise<ReceiptData[]> {
    return get(API_ENDPOINTS.RECEIPTS.RECENT);
  }

  /**
   * Get total revenue
   */
  static async getTotalRevenue(): Promise<any> {
    return get(API_ENDPOINTS.RECEIPTS.TOTAL_REVENUE);
  }

  /**
   * Search receipts
   */
  static async searchReceipts(search: string): Promise<ReceiptData[]> {
    return get(`${API_ENDPOINTS.RECEIPTS.SEARCH}?search=${encodeURIComponent(search)}`);
  }

  /**
   * Get printable receipt data
   */
  static async getPrintableReceipt(id: number): Promise<any> {
    return get(API_ENDPOINTS.RECEIPTS.PRINT(id));
  }

  /**
   * Get receipts by date range
   */
  static async getReceiptsByDateRange(startDate: string, endDate: string): Promise<ReceiptData[]> {
    return get(`${API_ENDPOINTS.RECEIPTS.BY_DATE_RANGE}?start_date=${startDate}&end_date=${endDate}`);
  }

  /**
   * Get receipts by payment method
   */
  static async getReceiptsByPaymentMethod(paymentMethod: string): Promise<ReceiptData[]> {
    return get(`${API_ENDPOINTS.RECEIPTS.BY_PAYMENT_METHOD}?payment_method=${encodeURIComponent(paymentMethod)}`);
  }
}
