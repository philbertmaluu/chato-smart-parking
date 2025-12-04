// Secure Camera Proxy Service
// This service acts as a secure intermediary between your app and the camera

export interface CameraProxyConfig {
  cameraUrl: string;
  username: string;
  password: string;
  allowedOrigins: string[];
}

export class CameraProxyService {
  private config: CameraProxyConfig;

  constructor(config: CameraProxyConfig) {
    this.config = config;
  }

  // Secure method to fetch camera content
  async fetchCameraContent(path: string = '/') {
    try {
      const url = `${this.config.cameraUrl}${path}`;
      
      // In a real implementation, this would be a server-side API call
      // that fetches the camera content and adds proper CORS headers
      const response = await fetch('/api/camera-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          username: this.config.username,
          password: this.config.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Camera proxy error: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Camera proxy error:', error);
      throw error;
    }
  }

  // Get camera stream URL through proxy
  getProxiedStreamUrl() {
    return `/api/camera-stream?url=${encodeURIComponent(this.config.cameraUrl)}`;
  }

  // Get camera interface URL through proxy
  getProxiedInterfaceUrl() {
    return `/api/camera-interface?url=${encodeURIComponent(this.config.cameraUrl)}`;
  }
}

// Default camera proxy configuration
export const defaultCameraProxy = new CameraProxyService({
  cameraUrl: 'http://192.168.0.109',
  username: 'admin',
  password: 'Password123!',
  allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'], // Add your domains
});
