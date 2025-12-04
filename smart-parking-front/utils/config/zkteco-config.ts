/**
 * ZKTeco Camera Configuration
 * Centralized configuration for ZKTeco camera settings
 */

export interface ZKTecoCameraConfig {
  ip: string;
  httpPort: number;
  rtspPort: number;
  username: string;
  password: string;
  // Common ZKTeco stream endpoints
  endpoints: {
    webInterface: string;
    mainStream: string;
    subStream: string;
    mjpeg: string;
    snapshot: string;
    status: string;
  };
}

export interface ZKTecoStreamConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  streamTypes: {
    main: string;
    sub: string;
    mjpeg: string;
    snapshot: string;
  };
}

// Default configuration with fallbacks (Updated from actual camera settings)
export const DEFAULT_ZKTECO_CONFIG: ZKTecoCameraConfig = {
  ip: process.env.NEXT_PUBLIC_ZKTECO_IP || '192.168.0.109',
  httpPort: parseInt(process.env.NEXT_PUBLIC_ZKTECO_HTTP_PORT || '80'),
  rtspPort: parseInt(process.env.NEXT_PUBLIC_ZKTECO_RTSP_PORT || '554'),
  username: process.env.NEXT_PUBLIC_ZKTECO_USERNAME || 'admin',
  password: process.env.NEXT_PUBLIC_ZKTECO_PASSWORD || 'Password123!',
  endpoints: {
    webInterface: '/',
    mainStream: '/ch01',
    subStream: '/ch01_sub',
    mjpeg: '/cgi-bin/mjpeg',
    snapshot: '/cgi-bin/snapshot.cgi',
    status: '/cgi-bin/magicBox.cgi?action=getSystemInfo',
  },
};

export const ZKTECO_STREAM_CONFIG: ZKTecoStreamConfig = {
  baseUrl: '/api/zkteco-stream',
  timeout: 10000,
  retryAttempts: 3,
  streamTypes: {
    main: 'main',
    sub: 'sub', 
    mjpeg: 'mjpeg',
    snapshot: 'snapshot',
  },
};

export class ZKTecoConfigManager {
  private config: ZKTecoCameraConfig;

  constructor(customConfig?: Partial<ZKTecoCameraConfig>) {
    this.config = {
      ...DEFAULT_ZKTECO_CONFIG,
      ...customConfig,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): ZKTecoCameraConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ZKTecoCameraConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Get HTTP URL for camera web interface
   */
  getWebInterfaceUrl(): string {
    return `http://${this.config.ip}:${this.config.httpPort}${this.config.endpoints.webInterface}`;
  }

  /**
   * Get RTSP URL with authentication
   */
  getRtspUrl(streamType: 'main' | 'sub' = 'main'): string {
    const endpoint = streamType === 'main' 
      ? this.config.endpoints.mainStream 
      : this.config.endpoints.subStream;
    
    const encodedPassword = encodeURIComponent(this.config.password);
    return `rtsp://${this.config.username}:${encodedPassword}@${this.config.ip}:${this.config.rtspPort}${endpoint}`;
  }

  /**
   * Get API endpoint URL for frontend proxy
   */
  getApiStreamUrl(streamType: string): string {
    return `${ZKTECO_STREAM_CONFIG.baseUrl}?type=${streamType}&t=${Date.now()}`;
  }

  /**
   * Get snapshot URL
   */
  getSnapshotUrl(): string {
    return this.getApiStreamUrl(ZKTECO_STREAM_CONFIG.streamTypes.snapshot);
  }

  /**
   * Get MJPEG stream URL
   */
  getMjpegUrl(): string {
    return this.getApiStreamUrl(ZKTECO_STREAM_CONFIG.streamTypes.mjpeg);
  }

  /**
   * Validate configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.ip) {
      errors.push('Camera IP address is required');
    }
    
    if (!this.config.username) {
      errors.push('Camera username is required');
    }
    
    if (!this.config.password) {
      errors.push('Camera password is required');
    }

    // Basic IP format validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (this.config.ip && !ipRegex.test(this.config.ip)) {
      errors.push('Invalid IP address format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Test configuration by attempting connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; status?: number }> {
    try {
      const testUrl = `${ZKTECO_STREAM_CONFIG.baseUrl}`;
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Camera-IP': this.config.ip,
          'X-Camera-Username': this.config.username,
          'X-Camera-Password': this.config.password,
        },
        body: JSON.stringify({ action: 'test-connection' }),
      });

      const result = await response.json();
      
      return {
        success: result.success || false,
        message: result.message || 'Connection test failed',
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    return {
      'X-Camera-IP': this.config.ip,
      'X-Camera-Username': this.config.username,
      'X-Camera-Password': this.config.password,
    };
  }

  /**
   * Create Basic Auth header value
   */
  getBasicAuthHeader(): string {
    const credentials = `${this.config.username}:${this.config.password}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }
}

// Export singleton instance
export const zktecoConfig = new ZKTecoConfigManager();