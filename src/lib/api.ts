/**
 * API Client for User Authentication Backend
 * Handles all communication with the MongoDB + JWT backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  energyPoints?: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface ApiError {
  success: false;
  message: string;
}

export interface Transcription {
  id: string;
  input_type: 'file' | 'youtube' | 'recording';
  input_source: string;
  transcription_text: string | null;
  duration_seconds: number | null;
  energy_cost: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

/** -------------------------
 * Token Storage
 * ------------------------ */
export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

export function removeAccessToken(): void {
  localStorage.removeItem('accessToken');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function setRefreshToken(token: string): void {
  localStorage.setItem('refreshToken', token);
}

export function removeRefreshToken(): void {
  localStorage.removeItem('refreshToken');
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem('user');
}

export function clearAuthData(): void {
  removeAccessToken();
  removeRefreshToken();
  removeStoredUser();
}

// Legacy support - for backward compatibility
export function getAuthToken(): string | null {
  return getAccessToken();
}

export function setAuthToken(token: string): void {
  setAccessToken(token);
}

export function removeAuthToken(): void {
  removeAccessToken();
}

/** -------------------------
 * Token Refresh Logic
 * ------------------------ */
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Token refresh failed' }));
        throw new Error(errorData.message || 'Token refresh failed');
      }

      const data: RefreshTokenResponse = await response.json();
      
      if (data.success && data.data) {
        setAccessToken(data.data.accessToken);
        setRefreshToken(data.data.refreshToken);
        return data.data.accessToken;
      }

      return null;
    } catch (error) {
      clearAuthData();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** -------------------------
 * Authenticated Fetch Helper
 * ------------------------ */
async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<Response> {
  const token = getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 and retry enabled, try to refresh token
  if (response.status === 401 && retryOn401 && token) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry the request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed, clear auth data
      clearAuthData();
    }
  }

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  let data;
  
  try {
    data = await response.json();
  } catch (jsonError) {
    const error: ApiError = {
      success: false,
      message: `Backend unavailable or returned invalid response (status: ${response.status})`,
    };
    throw error;
  }

  if (!response.ok) {
    const error: ApiError = {
      success: false,
      message: data.message || data.error || `HTTP error! status: ${response.status}`,
    };
    throw error;
  }

  return data as T;
}

/** -------------------------
 * Health Check
 * ------------------------ */
export async function healthCheck(): Promise<{ status: string; service: string; version: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
}

/** -------------------------
 * Auth Endpoints
 * ------------------------ */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await handleResponse<RegisterResponse>(response);

  if (data.success && data.data) {
    setAccessToken(data.data.accessToken);
    setRefreshToken(data.data.refreshToken);
    setStoredUser(data.data.user);
  }

  return data;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse<LoginResponse>(response);

  if (data.success && data.data) {
    setAccessToken(data.data.accessToken);
    setRefreshToken(data.data.refreshToken);
    setStoredUser(data.data.user);
  }

  return data;
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });

  const data = await handleResponse<RefreshTokenResponse>(response);

  if (data.success && data.data) {
    setAccessToken(data.data.accessToken);
    setRefreshToken(data.data.refreshToken);
  }

  return data;
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await authenticatedFetch('/api/auth/me', { method: 'GET' });
  const data = await handleResponse<UserResponse>(response);
  
  if (data.success && data.data) {
    setStoredUser(data.data);
  }
  
  return data;
}

export async function logoutUser(): Promise<void> {
  const refreshTokenValue = getRefreshToken();
  
  if (refreshTokenValue) {
    try {
      const accessToken = getAccessToken();
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  clearAuthData();
}

export async function verifyEmail(token: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  return handleResponse<ApiResponse<{ success: boolean; message: string }>>(response);
}

export async function resendVerificationEmail(email: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  return handleResponse<ApiResponse<{ success: boolean; message: string }>>(response);
}

export async function forgotPassword(email: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  return handleResponse<ApiResponse<{ success: boolean; message: string }>>(response);
}

export async function resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  return handleResponse<ApiResponse<{ success: boolean; message: string }>>(response);
}

/** -------------------------
 * Transcriptions / Generic Fetch
 * ------------------------ */
export async function getTranscriptions(): Promise<{ success: boolean; transcriptions: Transcription[] }> {
  const response = await authenticatedFetch('/api/transcriptions', { method: 'GET' });
  return handleResponse<{ success: boolean; transcriptions: Transcription[] }>(response);
}

// Generic fetch for any endpoint
export async function fetchDataFromApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(endpoint, options);
  return handleResponse<T>(response);
}
