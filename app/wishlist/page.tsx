
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Loader2, Package, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function WishlistPage() {
  const { fetchUser, user, isLoading: authLoading } = useAuthStore();
  const { addItem: addToCart } = useCartStore();
  const { items, removeItem, clearWishlist, fetchWishlist, isLoading, totalItems } = useWishlistStore();
  const [movingToCartKey, setMovingToCartKey] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);

  const handleRemove = async (productId: string) => {
    const success = await removeItem(productId);
    if (success) {
      toast.success("Item removed from wishlist");
    } else {
      toast.error("Failed to remove item");
    }
  };

  const handleClearWishlist = async () => {
    const success = await clearWishlist();
    if (success) {
      toast.success("Wishlist cleared");
    } else {
      toast.error("Failed to clear wishlist");
    }
  };

  const handleMoveToCart = async (productId: string, vendorId: string | null, itemName: string, image: string, price: number, moq: number, vendorName: string) => {
    if (!vendorId) {
      toast.error("This saved item needs a supplier before it can be added to cart");
      return;
    }

    const key = `${productId}-${vendorId}`;
    setMovingToCartKey(key);

    const success = await addToCart({
      productId,
      productName: itemName,
      image,
      price,
      moq,
      quantity: moq || 1,
      vendorId,
      vendorName,
    });

    setMovingToCartKey(null);

    if (success) {
      toast.success("Added to cart");
    } else {
      toast.error("Failed to add item to cart");
    }
  };

  if (authLoading || (isLoading && user)) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 h-4 w-40 rounded bg-zinc-200 animate-pulse" />
          <div className="flex items-center justify-between mb-8">
            <div className="h-9 w-56 rounded bg-zinc-200 animate-pulse" />
            <div className="h-9 w-28 rounded bg-zinc-200 animate-pulse" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm animate-pulse">
                <div className="flex gap-4">
                  <div className="h-24 w-24 rounded-xl bg-zinc-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-2/3 rounded bg-zinc-200" />
                    <div className="h-4 w-1/2 rounded bg-zinc-200" />
                    <div className="h-4 w-24 rounded bg-zinc-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Heart size={34} />
            </div>
            <h1 className="text-3xl font-semibold text-zinc-900">Sign in to view your wishlist</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Your saved products are tied to your account, so you can revisit them from any device.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e40af]"
              >
                Sign In
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 h-4 w-40 rounded bg-zinc-200 animate-pulse" />
          <div className="flex items-center justify-between mb-8">
            <div className="h-9 w-56 rounded bg-zinc-200 animate-pulse" />
            <div className="h-9 w-28 rounded bg-zinc-200 animate-pulse" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm animate-pulse">
                <div className="flex gap-4">
                  <div className="h-24 w-24 rounded-xl bg-zinc-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-2/3 rounded bg-zinc-200" />
                    <div className="h-4 w-1/2 rounded bg-zinc-200" />
                    <div className="h-4 w-24 rounded bg-zinc-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Heart size={34} />
            </div>
            <h1 className="text-3xl font-semibold text-zinc-900">Your wishlist is empty</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Save products you want to revisit later, compare suppliers, or move items into cart when you are ready to buy.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e40af]"
              >
                <ArrowLeft size={16} />
                Browse Products
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <ShoppingCart size={16} />
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="transition-colors hover:text-zinc-800">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800 font-medium">Wishlist</span>
        </nav>

        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              <Heart size={12} />
              Saved Products
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Wishlist</h1>
            <p className="mt-2 text-sm text-zinc-500">Keep track of products, preferred suppliers, and items ready to move into cart.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700">
              {totalItems()} items
            </div>
            <button
              onClick={handleClearWishlist}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
            >
              <Trash2 size={16} />
              Clear all
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const key = `${item.productId}-${item.vendorId ?? "none"}`;
            return (
              <article key={key} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="flex gap-4 p-5 sm:p-6">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <Package size={26} className="text-zinc-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/product/${item.productId}`} className="block truncate text-lg font-semibold text-zinc-900 transition-colors hover:text-[#1d4ed8]">
                          {item.productName}
                        </Link>
                        <p className="mt-1 text-sm text-zinc-500">{item.description || "Saved for later review"}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">MOQ: {item.moq} units</span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">₹{item.price > 0 ? item.price.toLocaleString() : "Contact"}</span>

                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-zinc-500">
                        {item.vendorId
                          ? "Ready to add back to cart with the saved supplier."
                          : "Open the product page to compare suppliers and choose one for cart."}
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/product/${item.productId}`}
                          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                        >
                          View Product
                        </Link>

                        {item.vendorId ? (
                          <button
                            onClick={() => handleMoveToCart(item.productId, item.vendorId, item.productName, item.image, item.price, item.moq, item.vendorName)}
                            disabled={movingToCartKey === key}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {movingToCartKey === key ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                            {movingToCartKey === key ? "Adding..." : "Add to Cart"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
