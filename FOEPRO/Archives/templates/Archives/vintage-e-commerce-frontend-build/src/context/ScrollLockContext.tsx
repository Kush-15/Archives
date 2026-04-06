import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ScrollLockContextType {
  /**
   * Lock scroll by incrementing reference count
   * Only sets overflow:hidden on first lock
   */
  lock: (componentId: string) => void;

  /**
   * Unlock scroll by decrementing reference count
   * Only clears overflow:hidden when all locks are released
   */
  unlock: (componentId: string) => void;

  /**
   * Current scroll lock count
   */
  lockCount: number;

  /**
   * Whether scroll is currently locked
   */
  isLocked: boolean;

  /**
   * Force reset all scroll locks (debugging only)
   */
  reset: () => void;
}

const ScrollLockContext = createContext<ScrollLockContextType | undefined>(undefined);

/**
 * ScrollLockProvider manages scroll locking with reference counting
 * This allows multiple overlays to independently manage scroll without premature unlock
 */
export function ScrollLockProvider({ children }: { children: ReactNode }) {
  const [lockedComponentIds, setLockedComponentIds] = useState<Set<string>>(new Set());

  const lock = useCallback((componentId: string) => {
    setLockedComponentIds(prev => {
      const newSet = new Set(prev);
      const wasLocked = newSet.size > 0;
      newSet.add(componentId);

      // Only apply overflow:hidden if we're locking for the first time
      if (!wasLocked) {
        document.body.style.overflow = 'hidden';
      }

      return newSet;
    });
  }, []);

  const unlock = useCallback((componentId: string) => {
    setLockedComponentIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(componentId);

      // Only remove overflow:hidden when all locks are released
      if (newSet.size === 0) {
        document.body.style.overflow = '';
      }

      return newSet;
    });
  }, []);

  const reset = useCallback(() => {
    setLockedComponentIds(new Set());
    document.body.style.overflow = '';
    console.warn('[ScrollLock] Force reset - all locks cleared');
  }, []);

  const lockCount = lockedComponentIds.size;
  const isLocked = lockCount > 0;

  return (
    <ScrollLockContext.Provider value={{ lock, unlock, lockCount, isLocked, reset }}>
      {children}
    </ScrollLockContext.Provider>
  );
}

/**
 * Hook to use scroll lock functionality
 * @throws Error if used outside ScrollLockProvider
 */
export function useScrollLock() {
  const context = useContext(ScrollLockContext);
  if (!context) {
    throw new Error('useScrollLock must be used within a ScrollLockProvider');
  }
  return context;
}
