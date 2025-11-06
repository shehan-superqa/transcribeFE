/**
 * API Client for User Authentication Backend
 * Handles all communication with the MongoDB + JWT backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

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

/**
 * Get stored authentication token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Store authentication token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

/**
 * Remove authentication token
 */
export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

/**
 * Get stored user data
 */
export function getStoredUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Store user data
 */
export function setStoredUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Remove stored user data
 */
export function removeStoredUser(): void {
  localStorage.removeItem('user');
}

/**
 * Make an authenticated API request
 */
async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
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

/**
 * Handle API response and parse JSON
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = {
      success: false,
      error: data.error || `HTTP error! status: ${response.status}`,
    };
    throw error;
  }

  return data as T;
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{ status: string; service: string; version: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
    }),
  });

  const data = await handleResponse<RegisterResponse>(response);
  
  if (data.success) {
    setAuthToken(data.token);
    setStoredUser(data.user);
  }

  return data;
}

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await handleResponse<LoginResponse>(response);
  
  if (data.success) {
    setAuthToken(data.token);
    setStoredUser(data.user);
  }

  return data;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await authenticatedFetch('/api/users/me', {
    method: 'GET',
  });

  return handleResponse<UserResponse>(response);
}

/**
 * Verify token
 */
export async function verifyToken(token: string): Promise<VerifyTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/verify-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  return handleResponse<VerifyTokenResponse>(response);
}

/**
 * Logout user (clears local storage)
 */
export function logoutUser(): void {
  removeAuthToken();
  removeStoredUser();
}

