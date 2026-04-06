import { createContext, useContext, ReactNode } from 'react';
import { useCart as useCartHook } from '@/hooks/useCart';
import { Product } from '@/data/products';

// Re-export types
export type { CartItem } from '@/store/cartStore';

// Create context that wraps the hook for backward compatibility
const CartContext = createContext<ReturnType<typeof useCartHook> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCartHook();
  
  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  );
}

// This hook can be used anywhere - it uses the global store directly
export function useCart() {
  return useCartHook();
}
