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

  // Operator management endpoints
  OPERATORS: {
    LIST: "/operators",
    DETAILS: (id: string | number) => `/operators/${id}`,
    CREATE: "/operators",
    UPDATE: (id: string | number) => `/operators/${id}`,
    DELETE: (id: string | number) => `/operators/${id}`,
    ASSIGN_STATION: (id: string | number) => `/operators/${id}/assign-station`,
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
} as const;

// Type for endpoint parameters
export type EndpointParams = {
  [K in keyof typeof API_ENDPOINTS]: {
    [P in keyof typeof API_ENDPOINTS[K]]: typeof API_ENDPOINTS[K][P] extends (param: any) => string
      ? Parameters<typeof API_ENDPOINTS[K][P]>[0]
      : never;
  };
}; 