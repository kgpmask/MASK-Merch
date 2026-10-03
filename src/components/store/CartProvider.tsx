"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { GarmentType } from "@/types/store";

export type CartLine = { variantId: string; productSlug: string; productTitle: string; garmentType: GarmentType; size: string; colour: string; sku: string; unitPricePaise: number; quantity: number };
type CartContextValue = { lines: CartLine[]; itemCount: number; add: (line: CartLine) => void; update: (variantId: string, quantity: number) => void; remove: (variantId: string) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);
const key = "mask-merch-cart-v1";
export function CartProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [lines, setLines] = useState<CartLine[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { const stored = localStorage.getItem(key); if (stored) setLines(JSON.parse(stored) as CartLine[]); } catch { localStorage.removeItem(key); } setReady(true); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(lines)); }, [lines, ready]);
  const value = useMemo<CartContextValue>(() => ({ lines, itemCount: lines.reduce((sum, line) => sum + line.quantity, 0), add: (line) => setLines((current) => { const found = current.find((item) => item.variantId === line.variantId); return found ? current.map((item) => item.variantId === line.variantId ? { ...item, quantity: Math.min(20, item.quantity + line.quantity) } : item) : [...current, line]; }), update: (variantId, quantity) => setLines((current) => current.map((line) => line.variantId === variantId ? { ...line, quantity: Math.max(1, Math.min(20, quantity)) } : line)), remove: (variantId) => setLines((current) => current.filter((line) => line.variantId !== variantId)), clear: () => setLines([]) }), [lines]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart(): CartContextValue { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider."); return value; }
