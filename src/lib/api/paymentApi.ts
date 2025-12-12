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
  const response = await authenticatedFetch('/api/payment/balance', {
    method: 'GET',
  });
  return handleResponse<BalanceResponse>(response);
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

