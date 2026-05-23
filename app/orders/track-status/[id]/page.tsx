"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  ChevronLeft,
  MapPin,
  CreditCard,
  Store,
  Warehouse,
  Circle,
  AlertTriangle,
  RotateCcw,
  PackageCheck,
  Send,
  Navigation,
  ArrowRight,
  ChevronRight,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

// ── Types ──────────────────────────────────────────────────────────────

interface OrderItem {
  product_id: string;
  product_name: string;
  product_description: string | null;
  image_url: string | null;
  quantity: number;
  price: number;
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

interface FulfillmentEntry {
  id: string;
  fulfillment_status: string;
  fulfillment_note: string | null;
  fulfillment_updated_at: string;
  stop_sequence: number | null;
  location_label: string | null;
  center_id: string | null;
  center_name: string | null;
  center_address: string | null;
  center_city: string | null;
  center_state: string | null;
  center_country: string | null;
  center_pincode: string | null;
  center_latitude: number | null;
  center_longitude: number | null;
}

interface RoutePlanStop {
  id: string;
  stop_sequence: number;
  fulfillment_center_id: string;
  center_name: string;
  center_city: string;
  center_state: string;
  center_pincode: string | null;
  center_latitude: number | null;
  center_longitude: number | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  status: string; // upcoming | in_transit | arrived | departed
}

interface OrderData {
  order_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: string;
  langitude: string;
  order_reference: string | null;
  order_notes: string | null;
  vendor_name: string;
  vendor_id: string;
  vendor_city: string | null;
  vendor_state: string | null;
  vendor_latitude: number | null;
  vendor_longitude: number | null;
}

interface TrackingData {
  order: OrderData;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
  fulfillmentTracking: FulfillmentEntry[];
  routePlan: RoutePlanStop[];
}

// ── Order flow definition ───────────────────────────────────────────────

const ORDER_FLOW: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "dispatched", label: "Dispatched", icon: Send },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const FULFILLMENT_FLOW: { key: string; label: string }[] = [
  { key: "received", label: "Received at Center" },
  { key: "processing", label: "Being Processed" },
  { key: "dispatched", label: "Dispatched from Center" },
  { key: "arrived", label: "Arrived at Destination" },
  { key: "handed_over", label: "Handed Over" },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" };
    case "processing":
      return { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" };
    case "dispatched":
      return { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" };
    case "shipped":
      return { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500" };
    case "delivered":
    case "received":
    case "handed_over":
      return { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" };
    case "cancelled":
      return { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" };
    case "refunded":
      return { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" };
    default:
      return { bg: "bg-zinc-100", text: "text-zinc-800", dot: "bg-zinc-500" };
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock className="w-5 h-5 text-amber-500" />;
    case "processing":
      return <Package className="w-5 h-5 text-blue-500" />;
    case "dispatched":
      return <Send className="w-5 h-5 text-purple-500" />;
    case "shipped":
      return <Truck className="w-5 h-5 text-indigo-500" />;
    case "delivered":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "cancelled":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "refunded":
      return <RotateCcw className="w-5 h-5 text-orange-500" />;
    case "handed_over":
      return <PackageCheck className="w-5 h-5 text-green-500" />;
    case "received":
      return <PackageCheck className="w-5 h-5 text-green-500" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-zinc-500" />;
  }
}

function getFulfillmentIcon(status: string) {
  switch (status.toLowerCase()) {
    case "received":
      return <Warehouse className="w-4 h-4 text-blue-500" />;
    case "processing":
      return <Package className="w-4 h-4 text-amber-500" />;
    case "dispatched":
      return <Send className="w-4 h-4 text-purple-500" />;
    case "arrived":
      return <MapPin className="w-4 h-4 text-indigo-500" />;
    case "handed_over":
      return <PackageCheck className="w-4 h-4 text-green-500" />;
    default:
      return <Circle className="w-4 h-4 text-zinc-400" />;
  }
}

// ── Route Journey Map Component ─────────────────────────────────────────

function RouteJourneyMap({
  routePlan,
  order,
}: {
  routePlan: RoutePlanStop[];
  order: OrderData;
}) {
  // Build the full journey: Seller → FC stops → Customer
  const sellerLocation = order.vendor_city && order.vendor_state
    ? `${order.vendor_city}, ${order.vendor_state}`
    : order.vendor_name;

  const buyerLocation = `${order.city}, ${order.state}`;

  const getStopStatusStyle = (status: string) => {
    switch (status) {
      case "departed":
      case "arrived":
        return {
          ring: "ring-emerald-500 bg-emerald-500",
          icon: "text-white",
          label: "text-emerald-700",
          line: "bg-emerald-500",
          badge: "bg-emerald-100 text-emerald-700",
          badgeText: status === "departed" ? "Departed" : "Arrived",
        };
      case "in_transit":
        return {
          ring: "ring-blue-500 bg-blue-500 animate-pulse",
          icon: "text-white",
          label: "text-blue-700",
          line: "bg-gradient-to-r from-emerald-500 to-blue-400",
          badge: "bg-blue-100 text-blue-700",
          badgeText: "In Transit",
        };
      default:
        return {
          ring: "ring-zinc-300 bg-white",
          icon: "text-zinc-400",
          label: "text-zinc-400",
          line: "bg-zinc-200",
          badge: "bg-zinc-100 text-zinc-500",
          badgeText: "Upcoming",
        };
    }
  };

  // Calculate overall journey progress
  const totalStops = routePlan.length + 2; // seller + FCs + buyer
  const completedStops = routePlan.filter(
    (s) => s.status === "departed" || s.status === "arrived"
  ).length;
  const inTransitStops = routePlan.filter((s) => s.status === "in_transit").length;
  const isDelivered = order.status.toLowerCase() === "delivered";
  const isOrderShipped = ["shipped", "delivered"].includes(order.status.toLowerCase());

  // Seller is always "done" once order is processing
  const sellerDone = order.status.toLowerCase() !== "pending";
  const buyerDone = isDelivered;

  const progressPercent = isDelivered
    ? 100
    : ((1 + completedStops + inTransitStops * 0.5) / (totalStops - 1)) * 100;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Shipment Journey</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {routePlan.length} fulfillment {routePlan.length === 1 ? "center" : "centers"} on route
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-zinc-900">
            {Math.round(progressPercent)}%
          </p>
          <p className="text-xs text-zinc-500">Journey Complete</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="px-6 pt-4">
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Journey stops */}
      <div className="p-6">
        <div className="space-y-0">
          {/* ── Seller Origin ──────────────── */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center ring-2 shrink-0 ${
                  sellerDone
                    ? "ring-emerald-500 bg-emerald-500"
                    : "ring-amber-400 bg-amber-400 animate-pulse"
                }`}
              >
                <Store className="w-5 h-5 text-white" />
              </div>
              {(routePlan.length > 0 || true) && (
                <div
                  className={`w-0.5 flex-1 min-h-[40px] ${
                    sellerDone && routePlan.length > 0
                      ? routePlan[0].status !== "upcoming"
                        ? "bg-emerald-500"
                        : "bg-gradient-to-b from-emerald-500 to-zinc-200"
                      : "bg-zinc-200"
                  }`}
                />
              )}
            </div>
            <div className="pb-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-zinc-900">Seller Location</p>
                {sellerDone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> Picked Up
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">{sellerLocation}</p>
              <p className="text-xs text-zinc-400 mt-1">
                Order placed: {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>

          {/* ── FC Stops ──────────────── */}
          {routePlan.map((stop, index) => {
            const styles = getStopStatusStyle(stop.status);
            const isLast = index === routePlan.length - 1;
            const nextStop = routePlan[index + 1];

            return (
              <div key={stop.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center ring-2 shrink-0 ${styles.ring}`}
                  >
                    <Warehouse className={`w-5 h-5 ${styles.icon}`} />
                  </div>
                  <div
                    className={`w-0.5 flex-1 min-h-[40px] ${
                      stop.status === "departed"
                        ? isLast
                          ? isDelivered || isOrderShipped
                            ? "bg-emerald-500"
                            : nextStop?.status !== "upcoming"
                              ? "bg-emerald-500"
                              : "bg-gradient-to-b from-emerald-500 to-zinc-200"
                          : nextStop?.status !== "upcoming"
                            ? "bg-emerald-500"
                            : "bg-gradient-to-b from-emerald-500 to-zinc-200"
                        : stop.status === "in_transit" || stop.status === "arrived"
                          ? "bg-gradient-to-b from-blue-400 to-zinc-200"
                          : "bg-zinc-200"
                    }`}
                  />
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-bold ${
                      stop.status === "upcoming" ? "text-zinc-400" : "text-zinc-900"
                    }`}>
                      {stop.center_name}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles.badge}`}
                    >
                      {stop.status === "departed" && <CheckCircle2 className="w-3 h-3" />}
                      {stop.status === "in_transit" && <Truck className="w-3 h-3" />}
                      {stop.status === "arrived" && <MapPin className="w-3 h-3" />}
                      {styles.badgeText}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${
                    stop.status === "upcoming" ? "text-zinc-400" : "text-zinc-500"
                  }`}>
                    {stop.center_city}, {stop.center_state}
                    {stop.center_pincode && ` — ${stop.center_pincode}`}
                  </p>

                  {/* ETA or actual arrival */}
                  <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                    {stop.actual_arrival && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Arrived: {formatDateTime(stop.actual_arrival)}
                      </span>
                    )}
                    {!stop.actual_arrival && stop.estimated_arrival && (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        ETA: {formatDate(stop.estimated_arrival)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Customer Destination ──────────────── */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center ring-2 shrink-0 ${
                  buyerDone
                    ? "ring-emerald-500 bg-emerald-500"
                    : "ring-zinc-300 bg-white"
                }`}
              >
                <MapPin
                  className={`w-5 h-5 ${buyerDone ? "text-white" : "text-zinc-400"}`}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className={`text-sm font-bold ${
                    buyerDone ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  Your Delivery Address
                </p>
                {buyerDone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> Delivered
                  </span>
                )}
              </div>
              <p
                className={`text-sm mt-0.5 ${
                  buyerDone ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                {buyerLocation} — {order.pincode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();
  const orderId = params?.id;

  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/track-status/${orderId ?? ""}`);
    }
  }, [authLoading, isAuthenticated, orderId, router]);

  useEffect(() => {
    if (!orderId || !isAuthenticated) return;

    let mounted = true;

    async function fetchTracking() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/orders/track/${orderId}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "client",
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load tracking data");
        }

        if (mounted) {
          setTrackingData(data.data as TrackingData);
        }
      } catch (error) {
        console.error("Error fetching tracking:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load order tracking");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchTracking();
    return () => { mounted = false; };
  }, [isAuthenticated, orderId]);

  // ── Loading state ──────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-medium text-zinc-700">Loading tracking details...</p>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="text-xl font-bold text-zinc-900">Tracking unavailable</h1>
          <p className="mt-2 text-sm text-zinc-600">We could not load the order tracking data. Please try again later.</p>
          <Link
            href="/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const { order, items, statusHistory, fulfillmentTracking, routePlan } = trackingData;
  const currentStatus = order.status.toLowerCase();
  const isCancelled = currentStatus === "cancelled";
  const isRefunded = currentStatus === "refunded";

  // Determine progress step index
  const currentStepIndex = ORDER_FLOW.findIndex((s) => s.key === currentStatus);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/orders")}
            className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Track Order</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Order #{order.order_id.split("-")[0]} &middot; {formatDate(order.created_at)}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(order.status).dot}`} />
            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, " ")}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column (Main Content) ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Progress Stepper ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-6">Order Progress</h2>

              {isCancelled || isRefunded ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-200">
                  <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">
                      {isCancelled ? "Order Cancelled" : "Order Refunded"}
                    </p>
                    <p className="text-sm text-red-600 mt-0.5">
                      This order was {isCancelled ? "cancelled" : "refunded"} and will not proceed further.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress bar background */}
                  <div className="absolute top-5 left-6 right-6 h-1 bg-zinc-200 rounded-full" />
                  {/* Progress bar filled */}
                  <div
                    className="absolute top-5 left-6 h-1 bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: currentStepIndex >= 0
                        ? `calc(${(currentStepIndex / (ORDER_FLOW.length - 1)) * 100}% - 0px)`
                        : "0%",
                    }}
                  />

                  <div className="relative flex justify-between">
                    {ORDER_FLOW.map((step, index) => {
                      const isCompleted = currentStepIndex >= 0 && index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const IconComp = step.icon;

                      return (
                        <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / ORDER_FLOW.length}%` }}>
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isCompleted
                                ? isCurrent
                                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                                  : "bg-blue-500 border-blue-500 text-white"
                                : "bg-white border-zinc-300 text-zinc-400"
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          <p
                            className={`mt-2 text-xs font-medium text-center leading-tight ${
                              isCompleted ? "text-zinc-900" : "text-zinc-400"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Route Journey Map ─────────────────────────────────────── */}
            {routePlan && routePlan.length > 0 && !isCancelled && !isRefunded && (
              <RouteJourneyMap routePlan={routePlan} order={order} />
            )}

            {/* ── No route plan info (direct delivery) ─────────────────── */}
            {(!routePlan || routePlan.length === 0) && !isCancelled && !isRefunded && currentStatus !== "pending" && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">Shipment Journey</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Direct delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Store className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium">From</p>
                      <p className="text-sm font-bold text-zinc-900">
                        {order.vendor_city ? `${order.vendor_city}, ${order.vendor_state}` : order.vendor_name}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-400 mx-2 shrink-0" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium">To</p>
                      <p className="text-sm font-bold text-zinc-900">
                        {order.city}, {order.state}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-3">
                  No intermediate fulfillment centers on this route. Your order will be delivered directly.
                </p>
              </div>
            )}

            {/* ── Unified Tracking Timeline ─────────────────────────────── */}
            {(() => {
              type TimelineEntry =
                | { type: "status"; id: string; status: string; note: string | null; timestamp: string }
                | { type: "fulfillment"; id: string; status: string; note: string | null; timestamp: string; center_name: string | null; center_address: string | null; center_city: string | null; center_state: string | null; center_pincode: string | null };

              const unified: TimelineEntry[] = [
                ...statusHistory.map((s) => ({
                  type: "status" as const,
                  id: s.id,
                  status: s.status,
                  note: s.note,
                  timestamp: s.created_at,
                })),
                ...fulfillmentTracking.map((f) => ({
                  type: "fulfillment" as const,
                  id: f.id,
                  status: f.fulfillment_status,
                  note: f.fulfillment_note,
                  timestamp: f.fulfillment_updated_at,
                  center_name: f.center_name,
                  center_address: f.center_address,
                  center_city: f.center_city,
                  center_state: f.center_state,
                  center_pincode: f.center_pincode,
                })),
              ];

              unified.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

              if (unified.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                      <p className="text-sm text-zinc-500">No tracking updates recorded yet.</p>
                    </div>
                  </div>
                );
              }

              const latestEntry = unified[unified.length - 1];

              return (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  {/* Latest update hero banner */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        {latestEntry.type === "status"
                          ? getStatusIcon(latestEntry.status)
                          : getFulfillmentIcon(latestEntry.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Latest Update</p>
                        <p className="text-lg font-bold text-white mt-1">
                          {latestEntry.type === "status"
                            ? latestEntry.status.charAt(0).toUpperCase() + latestEntry.status.slice(1).replace(/_/g, " ")
                            : (FULFILLMENT_FLOW.find((f) => f.key === latestEntry.status.toLowerCase())?.label ?? latestEntry.status)}
                        </p>
                        {latestEntry.note && (
                          <p className="text-sm text-blue-100 mt-1 leading-relaxed">{latestEntry.note}</p>
                        )}
                      </div>
                      <span className="text-sm text-blue-200 shrink-0 mt-1">{formatDateTime(latestEntry.timestamp)}</span>
                    </div>
                  </div>

                  {/* Unified timeline */}
                  <div className="p-6 sm:p-8">
                    <div className="relative">
                      {unified.map((entry, index) => {
                        const isLast = index === unified.length - 1;
                        const isStatus = entry.type === "status";
                        const colors = isStatus ? getStatusColor(entry.status) : null;
                        const flowLabel = !isStatus
                          ? FULFILLMENT_FLOW.find((f) => f.key === entry.status.toLowerCase())?.label ?? entry.status
                          : null;

                        return (
                          <div key={entry.id} className="flex gap-5">
                            {/* Timeline line & dot */}
                            <div className="flex flex-col items-center">
                              {isStatus ? (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors!.bg}`}>
                                  {getStatusIcon(entry.status)}
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-zinc-100 border border-zinc-200">
                                  {getFulfillmentIcon(entry.status)}
                                </div>
                              )}
                              {!isLast && <div className="w-0.5 flex-1 bg-zinc-200 my-1" />}
                            </div>

                            {/* Content */}
                            <div className={"flex-1 min-w-0 " + (isLast ? "pb-0" : "pb-7")}>
                              {isStatus ? (
                                <>
                                  <p className="text-sm font-bold text-zinc-900">
                                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1).replace(/_/g, " ")}
                                  </p>
                                  <p className="text-xs text-zinc-400 mt-0.5">{formatDateTime(entry.timestamp)}</p>
                                  {entry.note && (
                                    isLast ? (
                                      <div className="mt-3 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                                        <p className="text-sm font-semibold text-blue-900">{entry.note}</p>
                                      </div>
                                    ) : (
                                      <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{entry.note}</p>
                                    )
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-bold text-zinc-900">{flowLabel}</p>
                                  <p className="text-xs text-zinc-400 mt-0.5">{formatDateTime(entry.timestamp)}</p>

                                  {/* Center info */}
                                  {entry.center_name && (
                                    <div className="mt-2.5 flex items-start gap-2.5 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                                      <Warehouse className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                      <div>
                                        <p className="text-sm font-semibold text-blue-900">{entry.center_name}</p>
                                        {entry.center_address && (
                                          <p className="text-sm text-blue-700 mt-0.5 leading-relaxed">
                                            {entry.center_address}
                                            {entry.center_city && `, ${entry.center_city}`}
                                            {entry.center_state && `, ${entry.center_state}`}
                                            {entry.center_pincode && ` - ${entry.center_pincode}`}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {entry.note && (
                                    isLast ? (
                                      <div className="mt-3 bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                                        <p className="text-sm font-semibold text-indigo-900">{entry.note}</p>
                                      </div>
                                    ) : (
                                      <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{entry.note}</p>
                                    )
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Order Items ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">
                Order Items ({items.length})
              </h2>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={`${item.product_id}-${index}`}
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
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {item.product_name}
                      </p>
                      {item.product_description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                          {item.product_description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-4 text-sm text-zinc-500">
                        <span>Qty: {item.quantity}</span>
                        <span>₹{Number(item.price).toLocaleString()} each</span>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-zinc-900">
                      ₹{(Number(item.price) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">Total Amount</span>
                <span className="text-lg font-bold text-zinc-900">₹{Number(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* ── Right Column (Sidebar) ──────────────────────────────────── */}
          <div className="space-y-6">

            {/* ── Quick Info Card ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Order Summary</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Order ID</span>
                  <span className="text-sm font-mono font-medium text-zinc-900">#{order.order_id.split("-")[0]}</span>
                </div>

                {order.order_reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Reference</span>
                    <span className="text-sm font-medium text-zinc-900">{order.order_reference}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Placed On</span>
                  <span className="text-sm font-medium text-zinc-900">{formatDate(order.created_at)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Last Updated</span>
                  <span className="text-sm font-medium text-zinc-900">{formatDate(order.updated_at)}</span>
                </div>

                <div className="h-px bg-zinc-100" />

                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-500">Vendor</span>
                </div>
                <p className="text-sm font-semibold text-blue-600 -mt-1">{order.vendor_name || `Vendor #${order.vendor_id?.slice(0, 8)}`}</p>
              </div>
            </div>

            {/* ── Payment Info ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Payment</h3>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Status</span>
                <span className={`text-sm font-semibold ${order.payment_status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-zinc-500">Amount</span>
                <span className="text-sm font-bold text-zinc-900">₹{Number(order.total_amount).toLocaleString()}</span>
              </div>
            </div>

            {/* ── Delivery Address ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Delivery Address</h3>
              </div>

              <p className="text-sm text-zinc-900 font-medium">{order.address_line}</p>
              <p className="text-sm text-zinc-600 mt-1">
                {order.city}, {order.state}
              </p>
              <p className="text-sm text-zinc-600">
                {order.country} - {order.pincode}
              </p>
            </div>

            {/* ── Order Notes ──────────────────────────────────────────── */}
            {order.order_notes && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700">Order Note</h3>
                </div>
                <p className="text-sm font-medium text-amber-900 leading-relaxed">
                  {order.order_notes}
                </p>
              </div>
            )}

            {/* ── Actions ──────────────────────────────────────────────── */}
            <div className="space-y-3">
              {order.status.toLowerCase() === "delivered" && (
                <Link
                  href={`/orders/review/${order.order_id}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Review Order
                </Link>
              )}
              <Link
                href="/orders"
                className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}