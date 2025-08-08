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
} as const;

// Type for endpoint parameters
export type EndpointParams = {
  [K in keyof typeof API_ENDPOINTS]: {
    [P in keyof typeof API_ENDPOINTS[K]]: typeof API_ENDPOINTS[K][P] extends (param: any) => string
      ? Parameters<typeof API_ENDPOINTS[K][P]>[0]
      : never;
  };
}; 