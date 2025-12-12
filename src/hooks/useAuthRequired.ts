import { useCallback } from "react";
import { useAuthModal } from "../contexts/AuthModalContext";
import { checkAuthAndTriggerModal } from "../lib/authCheck";

/**
 * Hook to wrap API calls that require authentication
 * Checks auth before execution and shows modal if needed
 */
export function useAuthRequired() {
  const { openModal } = useAuthModal();

  const requireAuth = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      onSuccess?: () => void
    ): Promise<T | null> => {
      // Check if authenticated
      if (!checkAuthAndTriggerModal(openModal, onSuccess)) {
        // Modal was opened, return null to indicate auth is required
        return null;
      }

      // User is authenticated, proceed with API call
      try {
        return await apiCall();
      } catch (error: any) {
        // Check if it's an auth error from the API
        if (
          error.message?.includes("not authenticated") ||
          error.message?.includes("Please log in") ||
          error.message?.includes("Authentication failed") ||
          error.response?.status === 401
        ) {
          // Show auth modal
          checkAuthAndTriggerModal(openModal, () => {
            // Retry after successful auth
            onSuccess?.();
          });
          return null;
        }
        // Re-throw other errors
        throw error;
      }
    },
    [openModal]
  );

  return { requireAuth };
}

