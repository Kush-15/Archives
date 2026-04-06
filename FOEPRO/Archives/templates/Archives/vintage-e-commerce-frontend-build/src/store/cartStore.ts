// Global Cart Store - Simple and reliable
import { Product } from '@/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
}

type CartListener = () => void;

// Global state
let cartItems: CartItem[] = [];
let isCartOpen = false;
const listeners: Set<CartListener> = new Set();

// Load from localStorage on init
const STORAGE_KEY = 'archives-cart';
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    cartItems = JSON.parse(saved);
  }
} catch (e) {
  console.error('Failed to load cart:', e);
}

// Notify all listeners
function notify() {
  listeners.forEach(listener => listener());
}

// Save to localStorage
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}

// GLOBAL CART FUNCTIONS - Can be called from anywhere
export const CartStore = {
  // Get current state
  getItems: () => cartItems,
  isOpen: () => isCartOpen,
  getTotalItems: () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
  getTotalPrice: () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),

  // Cart visibility
  open: () => {
    console.log('[CartStore] Opening cart');
    isCartOpen = true;
    notify();
  },
  
  close: () => {
    console.log('[CartStore] Closing cart');
    isCartOpen = false;
    notify();
  },
  
  toggle: () => {
    console.log('[CartStore] Toggling cart, was:', isCartOpen);
    isCartOpen = !isCartOpen;
    notify();
  },

  // Cart operations
  addItem: (product: Product) => {
    console.log('[CartStore] Adding item:', product.name);
    const existing = cartItems.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems = [...cartItems, { product, quantity: 1 }];
    }
    isCartOpen = true; // Open cart when adding
    save();
    notify();
  },

  removeItem: (productId: string) => {
    console.log('[CartStore] Removing item:', productId);
    cartItems = cartItems.filter(item => item.product.id !== productId);
    save();
    notify();
  },

  updateQuantity: (productId: string, quantity: number) => {
    console.log('[CartStore] Updating quantity:', productId, quantity);
    if (quantity <= 0) {
      cartItems = cartItems.filter(item => item.product.id !== productId);
    } else {
      const item = cartItems.find(item => item.product.id === productId);
      if (item) {
        item.quantity = quantity;
      }
    }
    save();
    notify();
  },

  clear: () => {
    console.log('[CartStore] Clearing cart');
    cartItems = [];
    save();
    notify();
  },

  // Subscribe to changes
  subscribe: (listener: CartListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

// Make it available globally for debugging
(window as any).CartStore = CartStore;
