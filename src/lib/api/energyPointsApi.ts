/**
 * Energy Points API Client
 * Handles energy points checking and deduction
 */

import { authenticatedFetch, handleResponse, API_BASE_URL } from '../api';

export interface CheckBalanceResponse {
  success: boolean;
  data: {
    hasSufficientBalance: boolean;
    required: number;
    available: number;
    canProceed: boolean;
  };
}

export interface DeductBalanceResponse {
  success: boolean;
  data: {
    userId: string;
    energyPoints: number;
    deducted: number;
    remaining: number;
  };
}

/**
 * Check if user has sufficient energy points for a tool
 * @param tool - Tool name (e.g., 'tts', 'transcription', 'video_dub')
 * @param amount - Optional custom amount (overrides default cost)
 */
export async function checkEnergyBalance(
  tool: string,
  amount?: number
): Promise<CheckBalanceResponse> {
  const response = await authenticatedFetch('/api/payment/check-balance', {
    method: 'POST',
    body: JSON.stringify({ tool, amount }),
  });
  return handleResponse<CheckBalanceResponse>(response);
}

/**
 * Deduct energy points for tool usage
 * @param tool - Tool name (e.g., 'tts', 'transcription', 'video_dub')
 * @param amount - Optional custom amount (overrides default cost)
 * @param jobId - Optional job ID for tracking
 * @param description - Optional description
 */
export async function deductEnergyPoints(
  tool: string,
  amount?: number,
  jobId?: string,
  description?: string
): Promise<DeductBalanceResponse> {
  const response = await authenticatedFetch('/api/payment/deduct', {
    method: 'POST',
    body: JSON.stringify({ tool, amount, jobId, description }),
  });
  return handleResponse<DeductBalanceResponse>(response);
}

