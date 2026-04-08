// React hook to use the global cart store
import { useSyncExternalStore } from 'react';
import { CartStore, CartItem } from '@/store/cartStore';
import { Product } from '@/data/products';

// Cache the snapshot to ensure referential equality when values don't change
let cachedSnapshot = {
  items: CartStore.getItems(),
  isOpen: CartStore.isOpen(),
  totalItems: CartStore.getTotalItems(),
  totalPrice: CartStore.getTotalPrice(),
};

export function useCart() {
  // Subscribe to store changes
  const subscribe = (callback: () => void) => {
    return CartStore.subscribe(callback);
  };

  // Get current snapshot - only create new object if values actually changed
  const getSnapshot = () => {
    const items = CartStore.getItems();
    const isOpen = CartStore.isOpen();
    const totalItems = CartStore.getTotalItems();
    const totalPrice = CartStore.getTotalPrice();

    // Only create new snapshot if values changed
    if (
      items === cachedSnapshot.items &&
      isOpen === cachedSnapshot.isOpen &&
      totalItems === cachedSnapshot.totalItems &&
      totalPrice === cachedSnapshot.totalPrice
    ) {
      return cachedSnapshot;
    }

    cachedSnapshot = {
      items,
      isOpen,
      totalItems,
      totalPrice,
    };

    return cachedSnapshot;
  };

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    // State
    items: state.items as CartItem[],
    isOpen: state.isOpen as boolean,
    totalItems: state.totalItems as number,
    totalPrice: state.totalPrice as number,

    // Actions
    openCart: CartStore.open,
    closeCart: CartStore.close,
    toggleCart: CartStore.toggle,
    setIsCartOpen: (open: boolean) => open ? CartStore.open() : CartStore.close(),
    addToCart: CartStore.addItem,
    removeFromCart: CartStore.removeItem,
    updateQuantity: CartStore.updateQuantity,
    clearCart: CartStore.clear,
  };
}

// Re-export for convenience
export type { CartItem } from '@/store/cartStore';
