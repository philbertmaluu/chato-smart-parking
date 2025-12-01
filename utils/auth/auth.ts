export function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem("authToken");
  } catch (error) {
    console.error("Failed to get auth token from localStorage:", error);
    return null;
  }
}
  
export function logout() {
  try {
    localStorage.removeItem("authToken");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("smart-parking-current-gate");
    
    // Redirect to login page if we're in the browser
    if (typeof window !== 'undefined') {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }
  } catch (error) {
    console.error("Failed to logout:", error);
  }
} 