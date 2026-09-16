import { create } from 'zustand';
import type { CartLine } from '@/types/domain';

interface CartState {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  removeLine: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

// NOTE: this store exists purely for a responsive UI. The authoritative
// price/stock check happens server-side (Supabase) when the order is
// created — client-computed totals here are never trusted for the charge.
export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addLine: (line) =>
    set((state) => {
      const existing = state.lines.find((l) => l.product.id === line.product.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.product.id === line.product.id
              ? { ...l, quantity: l.quantity + line.quantity }
              : l,
          ),
        };
      }
      return { lines: [...state.lines, line] };
    }),
  removeLine: (productId) =>
    set((state) => ({ lines: state.lines.filter((l) => l.product.id !== productId) })),
  setQuantity: (productId, quantity) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.product.id === productId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0),
    })),
  clear: () => set({ lines: [] }),
}));
