// API Endpoints configuration
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    LOGOUT: "/logout",
    REFRESH: "/refresh",
    USER: "/user",
    UPDATE_PROFILE: "/profile",
    CHANGE_PASSWORD: "/change-password",
    REFRESH_TOKEN: "/refresh-token",
    FORGOT_PASSWORD: "/forgot-password",
   
  },

  // Pricing system endpoints
  PRICING: {
    CALCULATE: "/pricing/calculate",
    CALCULATE_BY_PLATE: "/pricing/calculate-by-plate",
    STATION_SUMMARY: (stationId: string | number) => `/pricing/station/${stationId}/summary`,
    STATION_VALIDATE: (stationId: string | number) => `/pricing/station/${stationId}/validate`,
  },

  // Vehicle body type pricing endpoints
  VEHICLE_BODY_TYPE_PRICES: {
    LIST: "/vehicle-body-type-prices",
    CREATE: "/vehicle-body-type-prices",
    DETAILS: (id: string | number) => `/vehicle-body-type-prices/${id}`,
    UPDATE: (id: string | number) => `/vehicle-body-type-prices/${id}`,
    DELETE: (id: string | number) => `/vehicle-body-type-prices/${id}`,
    CURRENT_PRICE: "/vehicle-body-type-prices/current-price",
    BY_STATION: (stationId: string | number) => `/vehicle-body-type-prices/station/${stationId}`,
    BULK_UPDATE: "/vehicle-body-type-prices/bulk-update",
    SUMMARY: "/vehicle-body-type-prices/summary",
  },

  // Vehicle exemption endpoints
  VEHICLE_EXEMPTION: {
    SET_EXEMPTION: (vehicleId: string | number) => `/toll-v1/vehicles/${vehicleId}/exempt`,
    REMOVE_EXEMPTION: (vehicleId: string | number) => `/toll-v1/vehicles/${vehicleId}/exempt`,
  },

  // Vehicle passage endpoints
  VEHICLE_PASSAGES: {
    LIST: "/vehicle-passages",
    CREATE: "/vehicle-passages",
    DETAILS: (id: string | number) => `/vehicle-passages/${id}`,
    UPDATE: (id: string | number) => `/vehicle-passages/${id}`,
    DELETE: (id: string | number) => `/vehicle-passages/${id}`,
    ENTRY: "/vehicle-passages/entry",
    EXIT: "/vehicle-passages/exit",
    QUICK_LOOKUP: "/vehicle-passages/quick-lookup",
    BY_PASSAGE_NUMBER: (number: string) => `/vehicle-passages/passage/${number}`,
    BY_VEHICLE: (vehicleId: string | number) => `/vehicle-passages/vehicle/${vehicleId}`,
    BY_STATION: (stationId: string | number) => `/vehicle-passages/station/${stationId}`,
    ACTIVE_LIST: "/vehicle-passages/active/list",
    COMPLETED_LIST: "/vehicle-passages/completed/list",
    STATISTICS: "/vehicle-passages/statistics",
    DASHBOARD_SUMMARY: "/vehicle-passages/dashboard-summary",
    UPDATE_STATUS: (id: string | number) => `/vehicle-passages/${id}/status`,
    SEARCH: "/vehicle-passages/search",
  },

  // Receipt endpoints
  RECEIPTS: {
    LIST: "/receipts",
    DETAILS: (id: string | number) => `/receipts/${id}`,
    UPDATE: (id: string | number) => `/receipts/${id}`,
    DELETE: (id: string | number) => `/receipts/${id}`,
    BY_NUMBER: (number: string) => `/receipts/number/${number}`,
    BY_VEHICLE_PASSAGE: (passageId: string | number) => `/receipts/vehicle-passage/${passageId}`,
    STATISTICS: "/receipts/statistics",
    RECENT: "/receipts/recent",
    TOTAL_REVENUE: "/receipts/total-revenue",
    SEARCH: "/receipts/search",
    PRINT: (id: string | number) => `/receipts/print/${id}`,
    BY_DATE_RANGE: "/receipts/by-date-range",
    BY_PAYMENT_METHOD: "/receipts/by-payment-method",
  },

  // Parking management endpoints
  PARKING: {
    STATIONS: "/parking/stations",
    STATION_DETAILS: (id: string | number) => `/parking/stations/${id}`,
    ENTRY: "/parking/entry",
    EXIT: "/parking/exit",
    HISTORY: "/parking/history",
    ANALYTICS: "/parking/analytics",
  },

  // Gate management endpoints
  GATES: {
    LIST: "/gates",
    DETAILS: (id: string | number) => `/gates/${id}`,
    CREATE: "/gates",
    UPDATE: (id: string | number) => `/gates/${id}`,
    DELETE: (id: string | number) => `/gates/${id}`,
    STATUS: (id: string | number) => `/gates/${id}/status`,
    STATISTICS: (id: string | number) => `/gates/${id}/statistics`,
    ACTIVE_LIST: "/gates/active/list",
    BY_STATION: (stationId: string | number) => `/gates/station/${stationId}`,
    TYPE_ENTRY: "/gates/type/entry",
    TYPE_EXIT: "/gates/type/exit",
    TYPE_BOTH: "/gates/type/both",
  },

  // Station management endpoints
  STATIONS: {
    LIST: "/stations",
    DETAILS: (id: string | number) => `/stations/${id}`,
    CREATE: "/stations",
    UPDATE: (id: string | number) => `/stations/${id}`,
    DELETE: (id: string | number) => `/stations/${id}`,
    STATISTICS: (id: string | number) => `/stations/${id}/statistics`,
    ACTIVE_LIST: "/stations/active/list",
  },


  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: "/analytics/dashboard",
    REVENUE: "/analytics/revenue",
    OCCUPANCY: "/analytics/occupancy",
    TRAFFIC: "/analytics/traffic",
    REPORTS: "/analytics/reports",
  },

  // Settings endpoints
  SETTINGS: {
    GENERAL: "/settings/general",
    PARKING_RATES: "/settings/parking-rates",
    NOTIFICATIONS: "/settings/notifications",
    SYSTEM: "/settings/system",
  },

  // Vehicle management endpoints
  VEHICLES: {
    LIST: "/vehicles",
    CREATE: "/vehicles",
    DETAILS: (id: string | number) => `/vehicles/${id}`,
    UPDATE: (id: string | number) => `/vehicles/${id}`,
    DELETE: (id: string | number) => `/vehicles/${id}`,
    TOGGLE_STATUS: (id: string | number) => `/vehicles/${id}/toggle-status`,
    SEARCH_BY_PLATE: (plateNumber: string) => `/vehicles/search/plate/${plateNumber}`,
    LOOKUP_BY_PLATE: (plateNumber: string) => `/vehicles/lookup/${plateNumber}`,
    ACTIVE_LIST: "/vehicles/active/list",
    BY_BODY_TYPE: (bodyTypeId: string | number) => `/vehicles/body-type/${bodyTypeId}`,
    REGISTERED_LIST: "/vehicles/registered/list",
    UNREGISTERED_LIST: "/vehicles/unregistered/list",
  },

  // Vehicle body types endpoints
  VEHICLE_BODY_TYPES: {
    LIST: "/vehicle-body-types",
    CREATE: "/vehicle-body-types",
    DETAILS: (id: string | number) => `/vehicle-body-types/${id}`,
    UPDATE: (id: string | number) => `/vehicle-body-types/${id}`,
    DELETE: (id: string | number) => `/vehicle-body-types/${id}`,
    ACTIVE_LIST: "/vehicle-body-types/active/list",
    BY_CATEGORY: (category: string) => `/vehicle-body-types/category/${category}`,
    WITH_VEHICLE_COUNT: "/vehicle-body-types/with-vehicle-count",
    WITH_PRICING: "/vehicle-body-types/with-pricing",
    CATEGORY_WITH_PRICING: (category: string) => `/vehicle-body-types/category/${category}/with-pricing`,
  },

  // Payment types endpoints
  PAYMENT_TYPES: {
    LIST: "/payment-types",
    CREATE: "/payment-types",
    DETAILS: (id: string | number) => `/payment-types/${id}`,
    UPDATE: (id: string | number) => `/payment-types/${id}`,
    DELETE: (id: string | number) => `/payment-types/${id}`,
    ACTIVE_LIST: "/payment-types/active/list",
    WITH_VEHICLE_PASSAGE_COUNT: "/payment-types/with-vehicle-passage-count",
    USAGE_STATISTICS: "/payment-types/usage-statistics",
    RECENT_USAGE: "/payment-types/recent-usage",
    BY_NAME: (name: string) => `/payment-types/name/${name}`,
  },

  // Bundle types endpoints
  BUNDLE_TYPES: {
    LIST: "/bundle-types",
    CREATE: "/bundle-types",
    DETAILS: (id: string | number) => `/bundle-types/${id}`,
    UPDATE: (id: string | number) => `/bundle-types/${id}`,
    DELETE: (id: string | number) => `/bundle-types/${id}`,
    TOGGLE_STATUS: (id: string | number) => `/bundle-types/${id}/toggle-status`,
    ACTIVE_LIST: "/bundle-types/active/list",
    BY_DURATION: (durationDays: number | string) => `/bundle-types/duration/${durationDays}`,
    WITH_BUNDLE_COUNT: "/bundle-types/with-bundle-count",
    POPULAR: (limit: number = 10) => `/bundle-types/popular?limit=${limit}`,
  },

  // Bundle endpoints
  BUNDLES: {
    LIST: "/bundles",
    CREATE: "/bundles",
    DETAILS: (id: string | number) => `/bundles/${id}`,
    UPDATE: (id: string | number) => `/bundles/${id}`,
    DELETE: (id: string | number) => `/bundles/${id}`,
    TOGGLE_STATUS: (id: string | number) => `/bundles/${id}/toggle-status`,
    ACTIVE_LIST: "/bundles/active/list",
    BY_TYPE: (bundleTypeId: string | number) => `/bundles/type/${bundleTypeId}`,
    BY_PRICE_RANGE: "/bundles/price-range",
    WITH_SUBSCRIPTION_COUNT: "/bundles/with-subscription-count",
    POPULAR: (limit: number = 10) => `/bundles/popular?limit=${limit}`,
  },

  // Customer endpoints
  CUSTOMERS: {
    LIST: "/customers",
    CREATE: "/customers",
    DETAILS: (id: string | number) => `/customers/${id}`,
    UPDATE: (id: string | number) => `/customers/${id}`,
    DELETE: (id: string | number) => `/customers/${id}`,
    ACTIVE_LIST: "/customers/active/list",
    STATISTICS: (id: string | number) => `/customers/${id}/statistics`,
  },

  // Account endpoints
  ACCOUNTS: {
    LIST: "/accounts",
    CREATE: "/accounts",
    DETAILS: (id: string | number) => `/accounts/${id}`,
    UPDATE: (id: string | number) => `/accounts/${id}`,
    DELETE: (id: string | number) => `/accounts/${id}`,
    TOGGLE_STATUS: (id: string | number) => `/accounts/${id}/toggle-status`,
    ACTIVE_LIST: "/accounts/active/list",
    BY_TYPE: (type: string) => `/accounts/type/${type}`,
    BY_CUSTOMER: (customerId: string | number) => `/accounts/customer/${customerId}`,
    STATISTICS: (id: string | number) => `/accounts/${id}/statistics`,
  },

  // Customer Account endpoints (Complete User + Customer + Account management)
  CUSTOMER_ACCOUNTS: {
    LIST: "/customer-accounts",
    CREATE: "/customer-accounts",
    DETAILS: (id: string | number) => `/customer-accounts/${id}`,
    UPDATE: (id: string | number) => `/customer-accounts/${id}`,
    DELETE: (id: string | number) => `/customer-accounts/${id}`,
    ADD_VEHICLE: (accountId: string | number) => `/customer-accounts/${accountId}/vehicles`,
    REMOVE_VEHICLE: (accountId: string | number, vehicleId: string | number) => `/customer-accounts/${accountId}/vehicles/${vehicleId}`,
    GET_VEHICLES: (accountId: string | number) => `/customer-accounts/${accountId}/vehicles`,
  },

  // Bundle Subscription endpoints
  BUNDLE_SUBSCRIPTIONS: {
    LIST: "/bundle-subscriptions",
    CREATE: "/bundle-subscriptions",
    DETAILS: (id: string | number) => `/bundle-subscriptions/${id}`,
    UPDATE: (id: string | number) => `/bundle-subscriptions/${id}`,
    DELETE: (id: string | number) => `/bundle-subscriptions/${id}`,
    UPDATE_STATUS: (id: string | number) => `/bundle-subscriptions/${id}/status`,
    ACTIVE_LIST: "/bundle-subscriptions/active/list",
    BY_ACCOUNT: (accountId: string | number) => `/bundle-subscriptions/account/${accountId}`,
    BY_BUNDLE: (bundleId: string | number) => `/bundle-subscriptions/bundle/${bundleId}`,
    USAGE_STATS: "/bundle-subscriptions/usage-stats",
    EXPIRING: (days: number = 7) => `/bundle-subscriptions/expiring?days=${days}`,
  },

  // Gate Devices endpoints (Hardware Integration)
  GATE_DEVICES: {
    LIST: "/gate-devices",
    CREATE: "/gate-devices",
    DETAILS: (id: string | number) => `/gate-devices/${id}`,
    UPDATE: (id: string | number) => `/gate-devices/${id}`,
    DELETE: (id: string | number) => `/gate-devices/${id}`,
    BY_GATE: (gateId: string | number) => `/gate-devices/gate/${gateId}`,
    BY_TYPE: (type: string) => `/gate-devices/type/${type}`,
    ACTIVE_LIST: "/gate-devices/active/list",
    TEST_CONNECTION: (id: string | number) => `/gate-devices/${id}/test-connection`,
    TOGGLE_STATUS: (id: string | number) => `/gate-devices/${id}/toggle-status`,
  },

  // Operators endpoints (Operators Management)
  OPERATORS: {
    LIST: "/operators",
    ALL: "/operators/all",
    CREATE: "/operators",
    DETAILS: (id: string | number) => `/operators/${id}`,
    UPDATE: (id: string | number) => `/operators/${id}`,
    DELETE: (id: string | number) => `/operators/${id}`,
    ACTIVATE: (id: string | number) => `/operators/${id}/activate`,
    DEACTIVATE: (id: string | number) => `/operators/${id}/deactivate`,
    RESET_PASSWORD: (id: string | number) => `/operators/${id}/reset-password`,
    STATIONS: (id: string | number) => `/operators/${id}/stations`,
    AVAILABLE_GATES: (id: string | number) => `/operators/${id}/available-gates`,
    ASSIGN_STATION: (id: string | number) => `/operators/${id}/assign-station`,
    UNASSIGN_STATION: (id: string | number) => `/operators/${id}/unassign-station`,
    // Logged-in operator endpoints
    MY_AVAILABLE_GATES: "/operators/me/available-gates",
    SELECT_GATE: "/operators/me/select-gate",
    DESELECT_GATE: "/operators/me/deselect-gate",
    MY_SELECTED_GATE_DEVICES: "/operators/me/selected-gate/devices",
    MY_RECENT_VEHICLES: "/operators/me/recent-vehicles",
  },
  
  // Roles endpoints
  ROLES: {
    LIST: "/roles",
  },

  // Camera detection endpoints
  CAMERA_DETECTION: {
    FETCH: "/camera-detection/fetch",
    FETCH_AND_STORE: "/camera-detection/fetch-and-store",
    QUICK_CAPTURE: "/camera-detection/quick-capture",
    LOGS: "/camera-detection/logs",
    LOGS_LATEST: "/camera-detection/logs/latest",
    LOGS_UNPROCESSED: "/camera-detection/logs/unprocessed",
    LOGS_PENDING_VEHICLE_TYPE: "/camera-detection/logs/pending-vehicle-type",
    LOGS_PENDING_EXIT: "/camera-detection/logs/pending-exit",
    PROCESS_WITH_VEHICLE_TYPE: (id: string | number) => `/camera-detection/logs/${id}/process-with-vehicle-type`,
    PROCESS_EXIT: (id: string | number) => `/camera-detection/logs/${id}/process-exit`,
  },

  // Printer endpoints (Thermal receipt printing)
  PRINTER: {
    STATUS: "/printer/status",
    TEST: "/printer/test",
    PRINT_ENTRY: (passageId: string | number) => `/printer/print/entry/${passageId}`,
    PRINT_EXIT: (passageId: string | number) => `/printer/print/exit/${passageId}`,
    PRINT_RECEIPT: (receiptId: string | number) => `/printer/print/receipt/${receiptId}`,
  },
} as const;

// Type for endpoint parameters
export type EndpointParams = {
  [K in keyof typeof API_ENDPOINTS]: {
    [P in keyof typeof API_ENDPOINTS[K]]: typeof API_ENDPOINTS[K][P] extends (param: any) => string
      ? Parameters<typeof API_ENDPOINTS[K][P]>[0]
      : never;
  };
}; 