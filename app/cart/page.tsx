"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, Package, Loader2, Heart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, fetchCart, isLoading } = useCartStore();
  const { fetchUser, user } = useAuthStore();
  const { addItem: addToWishlist } = useWishlistStore();

  // Local optimistic quantities for instant UI response
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [movingToWishlistKey, setMovingToWishlistKey] = useState<string | null>(null);

  useLayoutEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useLayoutEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  // Sync local quantities when items change (from server)
  useEffect(() => {
    const synced: Record<string, number> = {};
    items.forEach((item) => {
      const key = `${item.productId}-${item.vendorId}`;
      // Only sync if no pending debounce for this item
      if (!debounceTimers.current[key]) {
        synced[key] = item.quantity;
      }
    });
    setLocalQty((prev) => ({ ...prev, ...synced }));
  }, [items]);

  const getDisplayQty = (productId: string, vendorId: string, serverQty: number) => {
    const key = `${productId}-${vendorId}`;
    return localQty[key] ?? serverQty;
  };

  const handleRemove = async (productId: string, vendorId: string) => {
    const success = await removeItem(productId, vendorId);
    if (success) toast.success("Item removed");
    else toast.error("Failed to remove item");
  };

  // Debounced quantity update: updates UI instantly, sends API after 500ms of no clicks
  const handleUpdateQty = useCallback((productId: string, vendorId: string, newQty: number, moq: number) => {
    const key = `${productId}-${vendorId}`;

    if (newQty < moq) {
      toast.error(`Minimum quantity is ${moq}`);
      return;
    }

    // Optimistic UI update
    setLocalQty((prev) => ({ ...prev, [key]: newQty }));

    // Clear existing timer
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }

    // Set new debounced API call
    debounceTimers.current[key] = setTimeout(async () => {
      const success = await updateQuantity(productId, vendorId, newQty);
      if (!success) {
        toast.error("Failed to update quantity");
        // Revert optimistic update on failure
        setLocalQty((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
      delete debounceTimers.current[key];
    }, 500);
  }, [updateQuantity]);

  const handleClearCart = async () => {
    const success = await clearCart();
    if (success) toast.success("Cart cleared");
    else toast.error("Failed to clear cart");
  };

  const handleMoveToWishlist = async (productId: string, vendorId: string, itemName: string, image: string, price: number, moq: number, vendorName: string) => {
    const key = `${productId}-${vendorId}`;
    setMovingToWishlistKey(key);

    const saved = await addToWishlist({
      productId,
      productName: itemName,
      description: "",
      image,
      vendorId,
      vendorName,
      price,
      moq,
      stockQuantity: 0,
    });

    if (saved) {
      const removed = await removeItem(productId, vendorId);
      if (removed) {
        toast.success("Moved to wishlist");
      } else {
        toast.warning("Saved to wishlist, but could not remove from cart");
      }
    } else {
      toast.error("Failed to move item to wishlist");
    }

    setMovingToWishlistKey(null);
  };

  if (isLoading) {
    return (
      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-6 text-sm text-zinc-500">
            <span className="hover:text-zinc-800 transition-colors cursor-pointer">Home</span>
            <span className="mx-2">/</span>
            <span className="text-zinc-800 font-medium">Cart</span>
          </nav>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-zinc-900">Shopping Cart</h1>
            <div className="h-5 w-16 bg-zinc-200 rounded animate-pulse"></div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Skeleton Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 rounded-md bg-zinc-200"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-zinc-200 rounded mb-2"></div>
                          <div className="h-3 w-24 bg-zinc-200 rounded"></div>
                        </div>
                        <div className="h-8 w-8 bg-zinc-200 rounded"></div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <div className="h-4 w-16 bg-zinc-200 rounded"></div>
                        <div className="h-3 w-20 bg-zinc-200 rounded"></div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-zinc-200 rounded"></div>
                          <div className="h-8 w-10 bg-zinc-200 rounded"></div>
                          <div className="h-8 w-8 bg-zinc-200 rounded"></div>
                        </div>
                        <div className="h-4 w-20 bg-zinc-200 rounded ml-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Skeleton Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sticky top-24 animate-pulse">
                <div className="h-5 w-32 bg-zinc-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-zinc-200 rounded"></div>
                    <div className="h-4 w-16 bg-zinc-200 rounded"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-zinc-200 rounded"></div>
                    <div className="h-4 w-16 bg-zinc-200 rounded"></div>
                  </div>
                  <div className="border-t border-zinc-200 pt-3 mt-3">
                    <div className="flex justify-between">
                      <div className="h-5 w-12 bg-zinc-200 rounded"></div>
                      <div className="h-5 w-20 bg-zinc-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 h-11 w-full bg-zinc-200 rounded"></div>
                <div className="mt-3 h-5 w-32 bg-zinc-200 rounded mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center text-center">
            <ShoppingCart size={64} className="text-zinc-300 mb-4" />
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Your cart is empty</h1>
            <p className="text-sm text-zinc-500 mb-6 max-w-md">
              Browse our industrial products catalog and add items to your cart to get started with procurement.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-md bg-[#1d4ed8] px-6 py-3 text-sm font-medium text-white hover:bg-[#1e40af] transition-colors"
            >
              <ArrowLeft size={16} />
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-800 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800 font-medium">Cart</span>
        </nav>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/cart"
            className="group rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Cart #1</p>
                <h2 className="mt-1 text-lg font-semibold text-blue-900">Direct Order Cart</h2>
                <p className="mt-1 text-sm text-blue-700">Instant checkout for standard quantities.</p>
              </div>
              <div className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700">
                Active
              </div>
            </div>
          </Link>

          <Link
            href="/quotation-cart"
            className="group rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Cart #2</p>
                <h2 className="mt-1 text-lg font-semibold text-amber-900">Quotation Cart</h2>
                <p className="mt-1 text-sm text-amber-700">Negotiate pricing for large quantities.</p>
              </div>
              <div className="rounded-full bg-amber-600/10 px-3 py-1 text-xs font-semibold text-amber-700">
                Open
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Shopping Cart</h1>
          <button
            onClick={handleClearCart}
            disabled={isLoading}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
          >
            Clear all
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.vendorId}`}
                className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 rounded-md border border-zinc-200 bg-zinc-100 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <Package size={24} className="text-zinc-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/product/${item.productId}`} className="text-sm font-semibold text-zinc-900 truncate hover:text-[#1d4ed8] transition-colors">{item.productName}</Link>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleRemove(item.productId, item.vendorId)}
                          disabled={isLoading}
                          className="flex-shrink-0 rounded p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => handleMoveToWishlist(item.productId, item.vendorId, item.productName, item.image, item.price, item.moq, item.vendorName)}
                          disabled={isLoading || movingToWishlistKey === `${item.productId}-${item.vendorId}`}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                        >
                          {movingToWishlistKey === `${item.productId}-${item.vendorId}` ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Heart size={12} />
                          )}
                          Save for later
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="text-sm font-bold text-blue-700">₹{item.price}</div>
                      <div className="text-xs text-zinc-500">MOQ: {item.moq} units</div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQty(item.productId, item.vendorId, getDisplayQty(item.productId, item.vendorId, item.quantity) - 1, item.moq)}
                          disabled={getDisplayQty(item.productId, item.vendorId, item.quantity) <= item.moq}
                          className="rounded border border-zinc-300 p-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-zinc-900">{getDisplayQty(item.productId, item.vendorId, item.quantity)}</span>
                        <button
                          onClick={() => handleUpdateQty(item.productId, item.vendorId, getDisplayQty(item.productId, item.vendorId, item.quantity) + 1, item.moq)}
                          className="rounded border border-zinc-300 p-1 text-zinc-600 hover:bg-zinc-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-sm font-semibold text-zinc-900 ml-auto">
                        ₹{(item.price * getDisplayQty(item.productId, item.vendorId, item.quantity)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Items ({items.length})</span>
                  <span>₹{totalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>GST (18%)</span>
                  <span>₹{Math.round(totalPrice() * 0.18).toLocaleString()}</span>
                </div>
                <div className="border-t border-zinc-200 pt-3 flex justify-between font-semibold text-zinc-900">
                  <span>Total</span>
                  <span>₹{Math.round(totalPrice() * 1.18).toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 flex items-center justify-center h-11 w-full rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af]"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-[#1d4ed8] hover:text-[#1e40af] transition-colors"
              >
                <ArrowLeft size={14} />
                Continue Shopping
              </Link>

              <Link
                href="/quotation-cart"
                className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
              >
                Request quotations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
