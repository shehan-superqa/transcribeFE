/**
 * API Client for User Authentication Backend
 * Handles all communication with the MongoDB + JWT backend API
 */

const API_BASE_URL = 'http://localhost:5000';

export interface User {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  last_login?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export interface VerifyTokenResponse {
  success: boolean;
  valid: boolean;
  user_id?: string;
  email?: string;
  expires_at?: string;
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
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
 * Auth Token / User Storage
 * ------------------------ */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
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

/** -------------------------
 * Authenticated Fetch Helper
 * ------------------------ */
async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  let data;
  
  try {
    data = await response.json();
  } catch (jsonError) {
    // If response is not JSON (e.g., HTML error page), throw meaningful error
    const error: ApiError = {
      success: false,
      error: `Backend unavailable or returned invalid response (status: ${response.status})`,
    };
    throw error;
  }

  if (!response.ok) {
    // Backend returns { message: "error" } on error
    const error: ApiError = {
      success: false,
      error: data.message || data.error || `HTTP error! status: ${response.status}`,
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
export async function registerUser(email: string, password: string, name?: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await handleResponse<any>(response);

  // Backend returns result directly, so we need to normalize it
  const normalizedData: RegisterResponse = {
    success: true,
    message: data.message || 'Registration successful',
    user: data.user,
    token: data.token,
  };

  if (normalizedData.success && normalizedData.token) {
    setAuthToken(normalizedData.token);
    setStoredUser(normalizedData.user);
  }

  return normalizedData;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse<any>(response);

  // Backend returns result directly, so we need to normalize it
  const normalizedData: LoginResponse = {
    success: true,
    message: data.message || 'Login successful',
    user: data.user,
    token: data.token,
  };

  if (normalizedData.success && normalizedData.token) {
    setAuthToken(normalizedData.token);
    setStoredUser(normalizedData.user);
  }

  return normalizedData;
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await authenticatedFetch('/api/users/me', { method: 'GET' });
  return handleResponse<UserResponse>(response);
}

export async function verifyToken(token: string): Promise<VerifyTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/verify-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  return handleResponse<VerifyTokenResponse>(response);
}

export function logoutUser(): void {
  removeAuthToken();
  removeStoredUser();
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
