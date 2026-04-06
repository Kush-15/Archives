import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

type OverlayName = 'cart' | 'search' | 'auth' | 'otp' | null;

interface OverlayContextType {
  /**
   * Currently open overlay (only one can be open at a time)
   */
  openOverlay: OverlayName;

  /**
   * Open a specific overlay (closes previous if any)
   */
  openOverlayByName: (name: Exclude<OverlayName, null>) => void;

  /**
   * Close current overlay
   */
  closeOverlay: () => void;

  /**
   * Check if specific overlay is currently open
   */
  isOverlayOpen: (name: Exclude<OverlayName, null>) => boolean;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);
const OVERLAY_STORAGE_KEY = 'foepro.openOverlay';

/**
 * OverlayProvider manages overlay state with mutual exclusivity
 * Only one overlay can be open at a time
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [openOverlay, setOpenOverlay] = useState<OverlayName>(null);

  useEffect(() => {
    // Cleanup from previous builds that persisted overlay state.
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(OVERLAY_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }, []);

  const openOverlayByName = useCallback((name: Exclude<OverlayName, null>) => {
    setOpenOverlay(name);
  }, []);

  const closeOverlay = useCallback(() => {
    setOpenOverlay(null);
  }, []);

  const isOverlayOpen = useCallback((name: Exclude<OverlayName, null>) => {
    return openOverlay === name;
  }, [openOverlay]);

  return (
    <OverlayContext.Provider
      value={{
        openOverlay,
        openOverlayByName,
        closeOverlay,
        isOverlayOpen,
      }}
    >
      {children}
    </OverlayContext.Provider>
  );
}

/**
 * Hook to use overlay management functionality
 * @throws Error if used outside OverlayProvider
 */
export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}
