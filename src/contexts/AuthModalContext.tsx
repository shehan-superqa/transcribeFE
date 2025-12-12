import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AuthModalContextType {
  isOpen: boolean;
  openModal: (mode?: "login" | "signup", onSuccess?: () => void) => void;
  closeModal: () => void;
  mode: "login" | "signup";
  onSuccessCallback: (() => void) | null;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  const openModal = useCallback((modalMode: "login" | "signup" = "login", onSuccess?: () => void) => {
    console.log('[AuthModalContext] Opening modal, mode:', modalMode, 'onSuccess:', !!onSuccess);
    setMode(modalMode);
    setOnSuccessCallback(onSuccess || null);
    setIsOpen(true);
    console.log('[AuthModalContext] Modal state set to open');
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setOnSuccessCallback(null);
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, openModal, closeModal, mode, onSuccessCallback }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}

