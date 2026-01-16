import { vi } from 'vitest';

export const mockAuthenticatedFetch = vi.fn();

export const mockGetAccessToken = vi.fn(() => 'mock_token_123');

export const mockRefreshAccessToken = vi.fn(() => Promise.resolve('new_token_123'));

export const mockClearAuthData = vi.fn();

export const createMockResponse = <T>(data: T, ok: boolean = true): Response => {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'default' as ResponseType,
    url: '',
    clone: vi.fn(),
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
  } as Response;
};

export const createMockSuccessResponse = <T>(data: T): Response => {
  return createMockResponse(data, true);
};

export const createMockErrorResponse = (status: number = 400, message: string = 'Error'): Response => {
  return createMockResponse({ success: false, error: message }, false);
};

export const createMockNetworkError = (): Error => {
  return new Error('Network error');
};

export const resetMocks = () => {
  mockAuthenticatedFetch.mockReset();
  mockGetAccessToken.mockReset();
  mockRefreshAccessToken.mockReset();
  mockClearAuthData.mockReset();
};














