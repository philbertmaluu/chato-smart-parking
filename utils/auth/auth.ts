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
  } catch (error) {
    console.error("Failed to logout:", error);
  }
} 