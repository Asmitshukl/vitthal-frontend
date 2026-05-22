"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package, ArrowLeft, Send, Loader2, FileSignature } from "lucide-react";
import { useQuotationCartStore } from "@/store/quotationCartStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export default function QuotationCartPage() {
  const { items, fetchCart, updateQuantity, removeItem, clearCart, isLoading } = useQuotationCartStore();
  const { fetchUser, user } = useAuthStore();
  const [requestNote, setRequestNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  const handleSubmitQuotation = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-request-from": "client" },
        credentials: "include",
        body: JSON.stringify({ requestNote: requestNote.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit quotation");
      }
      toast.success("Quotation requests submitted");
      setRequestNote("");
      await clearCart();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit quotation";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <Package className="mx-auto h-16 w-16 text-zinc-300" />
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Quotation cart is empty</h1>
          <p className="mt-2 text-sm text-zinc-500">Add items that require quotation to get started.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft size={16} />
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-800 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800 font-medium">Quotation Cart</span>
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
                Open
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
                Active
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Quotation Cart</h1>
          <button
            onClick={() => void clearCart()}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear all
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.productId}-${item.vendorId}`} className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
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
                        <Link href={`/product/${item.productId}`} className="text-sm font-semibold text-zinc-900 truncate hover:text-blue-600">
                          {item.productName}
                        </Link>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.vendorId)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="text-sm font-bold text-blue-700">₹{item.price}</div>
                      <div className="text-xs text-zinc-500">MOQ: {item.moq}</div>
                      {item.quotationMinQty ? (
                        <div className="text-xs text-amber-700">Quote min: {item.quotationMinQty}</div>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.productId, item.vendorId, Number(event.target.value))}
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Submit quotation request</h2>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Request note</label>
              <textarea
                value={requestNote}
                onChange={(event) => setRequestNote(event.target.value)}
                className="w-full min-h-[120px] rounded-md border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Add delivery requirements, target price, or timeline."
              />
              <button
                onClick={() => void handleSubmitQuotation()}
                disabled={submitting}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit requests
              </button>
              <p className="mt-4 text-xs text-zinc-500 flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Vendors will respond with negotiated pricing and terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
