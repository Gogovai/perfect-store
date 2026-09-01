'use client';

import { create } from 'zustand';

export type WishlistItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  slug: string;
  sellerName: string;
};

type WishlistState = {
  items: WishlistItem[];
  isLoading: boolean;
};

type WishlistActions = {
  setItems: (items: WishlistItem[]) => void;
  toggleItem: (item: Omit<WishlistItem, 'id'> & { id?: string }) => boolean;
  hasItem: (productId: string) => boolean;
  removeItem: (productId: string) => void;
  setLoading: (loading: boolean) => void;
  getCount: () => number;
};

export const useWishlistStore = create<WishlistState & WishlistActions>()((set, get) => ({
  items: [],
  isLoading: false,

  setItems: (items) => set({ items }),

  toggleItem: (item) => {
    const { items } = get();
    const exists = items.find((i) => i.productId === item.productId);

    if (exists) {
      set({ items: items.filter((i) => i.productId !== item.productId) });
      return false; // removed
    }

    set({
      items: [
        ...items,
        {
          id: item.id || `wishlist-${item.productId}`,
          productId: item.productId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          slug: item.slug,
          sellerName: item.sellerName,
        },
      ],
    });
    return true; // added
  },

  hasItem: (productId) => get().items.some((i) => i.productId === productId),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  getCount: () => get().items.length,
}));
