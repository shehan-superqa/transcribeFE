/**
 * Payment API Client
 * Handles energy points purchase and balance operations
 */

import { authenticatedFetch, handleResponse } from '../api';

export interface BalanceResponse {
  success: boolean;
  data: {
    userId: string;
    energyPoints: number;
  };
}

export interface PurchaseRequest {
  amount: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface PurchaseResponse {
  success: boolean;
  data: {
    paymentUrl: string;
    orderId: string;
    energyPoints: number;
    amount: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
}

/**
 * Get current user's energy points balance
 * @returns Balance response with userId and energyPoints
 */
export async function getEnergyPointsBalance(): Promise<BalanceResponse> {
  try {
    const response = await authenticatedFetch('/api/payment/balance', {
      method: 'GET',
    });
    return handleResponse<BalanceResponse>(response);
  } catch (error: any) {
    // If the error is about microservice API key, return a fallback response
    if (error.message?.includes('Microservice API key')) {
      console.warn('Energy points balance check failed, using fallback');
      // Return a fallback response - the backend should handle this properly
      throw new Error('Failed to check energy points balance. Please ensure backend is configured correctly.');
    }
    throw error;
  }
}

/**
 * Initiate energy points purchase
 * @param purchaseData - Purchase request data including amount and optional user info
 * @returns Purchase response with PayHere payment URL and order details
 */
export async function initiatePurchase(
  purchaseData: PurchaseRequest
): Promise<PurchaseResponse> {
  const response = await authenticatedFetch('/api/payment/purchase', {
    method: 'POST',
    body: JSON.stringify(purchaseData),
  });
  return handleResponse<PurchaseResponse>(response);
}

