'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  price: number;
  quantity: number;
  imageUrl: string;
  sellerName: string;
  sellerId: string;
  maxQuantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  /** Whether the user has synced their guest cart to the database */
  hasSyncedToDb: boolean;
};

type CartActions = {
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  setHasSyncedToDb: (synced: boolean) => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
};

function generateCartItemId(productId: string, variantId: string | null): string {
  return `${productId}${variantId ? `-${variantId}` : ''}`;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hasSyncedToDb: false,

      addItem: (newItem) => {
        set((state) => {
          const itemId = generateCartItemId(newItem.productId, newItem.variantId);
          const existingIndex = state.items.findIndex((i) => i.id === itemId);

          if (existingIndex >= 0) {
            // Update quantity
            const updated = [...state.items];
            const existing = updated[existingIndex];
            const newQty = Math.min(
              existing.quantity + (newItem.quantity || 1),
              existing.maxQuantity || 99
            );
            updated[existingIndex] = { ...existing, quantity: newQty };
            return { items: updated, isOpen: true };
          }

          // Add new item
          const cartItem: CartItem = {
            id: itemId,
            productId: newItem.productId,
            variantId: newItem.variantId,
            name: newItem.name,
            variantName: newItem.variantName,
            price: newItem.price,
            quantity: newItem.quantity || 1,
            imageUrl: newItem.imageUrl,
            sellerName: newItem.sellerName,
            sellerId: newItem.sellerId,
            maxQuantity: newItem.maxQuantity || 99,
          };

          return { items: [...state.items, cartItem], isOpen: true };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== itemId) };
          }

          return {
            items: state.items.map((i) =>
              i.id === itemId
                ? { ...i, quantity: Math.min(quantity, i.maxQuantity || 99) }
                : i
            ),
          };
        });
      },

      clearCart: () => set({ items: [], hasSyncedToDb: false }),

      setItems: (items) => set({ items }),

      setHasSyncedToDb: (synced) => set({ hasSyncedToDb: synced }),

      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'perfect-store-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, hasSyncedToDb: state.hasSyncedToDb }),
    }
  )
);
