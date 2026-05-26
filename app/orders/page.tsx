"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Loader2,
  Truck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

interface OrderItem {
  product_id: string;
  product_name: string;
  image_url: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  vendor_name: string;
  vendor_id: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/orders");
    }
  }, [isAuthenticated, authLoading, router]);

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "client",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      } else {
        const data = await res.json();
        toast.error("Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("An error occurred while loading orders");
    } finally {
      setFetchingOrders(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      const timer = window.setTimeout(() => {
        void fetchOrders();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-indigo-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass =
      "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit";
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <span className={`${baseClass} bg-amber-100 text-amber-800`}>
            {getStatusIcon(status)} Pending
          </span>
        );
      case "confirmed":
        return (
          <span className={`${baseClass} bg-blue-100 text-blue-800`}>
            {getStatusIcon(status)} Confirmed
          </span>
        );
      case "shipped":
        return (
          <span className={`${baseClass} bg-indigo-100 text-indigo-800`}>
            {getStatusIcon(status)} Shipped
          </span>
        );
      case "delivered":
        return (
          <span className={`${baseClass} bg-green-100 text-green-800`}>
            {getStatusIcon(status)} Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className={`${baseClass} bg-red-100 text-red-800`}>
            {getStatusIcon(status)} Cancelled
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-zinc-100 text-zinc-800`}>
            {getStatusIcon(status)} {status}
          </span>
        );
    }
  };

  if (authLoading || fetchingOrders) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <h1 className="text-3xl font-bold text-zinc-900">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-sm">
            <Package className="mx-auto h-20 w-20 text-zinc-300 mb-6" />
            <h2 className="text-2xl font-semibold text-zinc-900 mb-2">
              No orders yet
            </h2>
            <p className="text-zinc-500 mb-8 max-w-md mx-auto">
              You haven&apos;t placed any orders. Browse our catalog to find the
              best industrial products for your needs.
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                    <div>
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">
                        Order Placed
                      </p>
                      <p className="text-sm font-medium text-zinc-900">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">
                        Total Amount
                      </p>
                      <p className="text-sm font-bold text-zinc-900">
                        ₹{Number(order.total_amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">
                        Vendor
                      </p>
                      <p className="text-sm font-medium text-blue-600">
                        Vendor #{order.vendor_id?.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <span>Order ID:</span>
                      <span className="font-mono text-zinc-900">
                        #{order.order_id.split("-")[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/track-status/${order.order_id}`}
                        className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Track
                      </Link>
                      <Link
                        href={`/orders/review/${order.order_id}`}
                        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                          order.status.toLowerCase() === "delivered"
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-zinc-200 text-zinc-500 pointer-events-none"
                        }`}
                        aria-disabled={order.status.toLowerCase() !== "delivered"}
                        tabIndex={order.status.toLowerCase() !== "delivered" ? -1 : 0}
                      >
                        {order.status.toLowerCase() === "delivered"
                          ? "Review"
                          : "Available after delivery"}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-4">
                    {getStatusBadge(order.status)}

                    <div className="text-sm">
                      <span className="text-zinc-500 mr-2">Payment:</span>
                      <span
                        className={`font-medium ${order.payment_status === "paid" ? "text-green-600" : "text-amber-600"}`}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div
                          key={`${order.order_id}-item-${index}`}
                          className="flex items-start gap-4 p-3 hover:bg-zinc-50 rounded-xl transition-colors"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-16 h-16 rounded-lg object-cover border border-zinc-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-zinc-100 rounded-lg border border-zinc-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-zinc-400" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 hover:text-blue-600 cursor-pointer transition-colors truncate">
                              {item.product_name}
                            </p>
                            <div className="mt-1 flex items-center gap-4 text-sm text-zinc-500">
                              <span>Qty: {item.quantity}</span>
                              <span>
                                ₹{Number(item.price).toLocaleString()} each
                              </span>
                            </div>
                          </div>

                          <div className="text-sm font-bold text-zinc-900">
                            ₹
                            {(
                              Number(item.price) * item.quantity
                            ).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 text-center py-4">
                        No items found in this order.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
