"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, Send, CheckCircle2, XCircle, FileText, ArrowLeft, Package, User, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

type QuotationMessage = {
  id: string;
  sender_role: string;
  action: string;
  offer_price: number | null;
  offer_quantity: number | null;
  note: string | null;
  reason: string | null;
  created_at: string;
};

type QuotationDetail = {
  id: string;
  status: string;
  product_name: string;
  vendor_name: string;
  requested_quantity: number;
  requested_price: number | null;
  current_offer_price: number | null;
  current_offer_quantity: number | null;
  current_offer_by: string | null;
  accepted_price: number | null;
  accepted_quantity: number | null;
  rejection_reason: string | null;
  admin_confirmation_status: string | null;
  admin_confirmation_message: string | null;
  admin_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  product_image?: string;
};

type ChatTab = "vendor" | "admin";

function getStatusInfo(status: string) {
  switch (status) {
    case "pending_vendor":
      return { label: "Awaiting Vendor", bg: "bg-amber-100", text: "text-amber-800" };
    case "vendor_offered":
    case "vendor_countered":
      return { label: "Vendor Offered", bg: "bg-blue-100", text: "text-blue-800" };
    case "client_countered":
      return { label: "You Countered", bg: "bg-violet-100", text: "text-violet-800" };
    case "client_accepted":
      return { label: "Accepted - Awaiting Admin", bg: "bg-indigo-100", text: "text-indigo-800" };
    case "admin_confirmation_pending":
      return { label: "Admin Confirmed - Action Required", bg: "bg-orange-100 animate-pulse", text: "text-orange-800" };
    case "admin_confirmed":
      return { label: "Fully Confirmed", bg: "bg-emerald-100", text: "text-emerald-800" };
    case "client_rejected":
    case "vendor_rejected":
    case "admin_confirmation_rejected":
      return { label: "Rejected", bg: "bg-rose-100", text: "text-rose-800" };
    default:
      return { label: status.replace(/_/g, " "), bg: "bg-zinc-100", text: "text-zinc-800" };
  }
}

export default function QuotationDetailPage() {
  const params = useParams();
  const quotationId = params.id as string;
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [messages, setMessages] = useState<QuotationMessage[]>([]);

  const [activeTab, setActiveTab] = useState<ChatTab>("vendor");

  // Action state
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isClosed = quotation
    ? ["client_accepted", "client_rejected", "vendor_rejected", "cancelled", "expired", "admin_confirmation_pending", "admin_confirmed", "admin_confirmation_rejected"].includes(quotation.status)
    : false;

  const isWaitingForVendor = quotation ? quotation.current_offer_by !== "vendor" && !isClosed : true;
  const canReplyToVendor = quotation ? quotation.current_offer_by === "vendor" && !isClosed : false;

  const showAdminChat = quotation?.admin_confirmation_status !== null;
  const isAdminPending = quotation?.admin_confirmation_status === "pending";

  const loadQuotation = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/quotations/${quotationId}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "client" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load quotation");
      setQuotation(data.data?.quotation || null);
      setMessages(data.data?.messages || []);

      const latestOfferPrice = data.data?.quotation?.current_offer_price ?? null;
      const latestOfferQty = data.data?.quotation?.current_offer_quantity ?? null;
      setOfferPrice(latestOfferPrice != null ? String(latestOfferPrice) : "");
      setOfferQuantity(latestOfferQty != null ? String(latestOfferQty) : "");

      if (data.data?.quotation?.admin_confirmation_status === "pending") {
        setActiveTab("admin");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load quotation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quotationId) void loadQuotation();
  }, [quotationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const submitResponse = async (action: "counter" | "accept" | "reject") => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === "counter") {
        if (!offerPrice || !offerQuantity) throw new Error("Price and quantity required for counter offer");
        payload.offerPrice = Number(offerPrice);
        payload.offerQuantity = Number(offerQuantity);
        payload.reason = reason.trim();
        payload.note = note.trim();
      }
      if (action === "accept") payload.note = note.trim();
      if (action === "reject") {
        if (!reason.trim()) throw new Error("Reason required for rejection");
        payload.reason = reason.trim();
        payload.note = note.trim();
      }

      const res = await fetch(`${API_BASE}/api/quotations/${quotationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-request-from": "client" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit response");

      toast.success("Response submitted successfully");
      setReason("");
      setNote("");
      await loadQuotation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit response";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdminResponse = async (action: "accept" | "reject") => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/quotations/${quotationId}/admin-confirm-respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-request-from": "client" },
        credentials: "include",
        body: JSON.stringify({ action, note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit response");

      toast.success(action === "accept" ? "Order confirmed successfully!" : "Confirmation rejected");
      setNote("");
      await loadQuotation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit response";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-zinc-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center text-center px-4">
        <FileText className="h-16 w-16 text-zinc-300 mb-4" />
        <h2 className="text-2xl font-semibold text-zinc-900">Quotation Not Found</h2>
        <p className="mt-2 text-zinc-500">The quotation you're looking for doesn't exist or you don't have access.</p>
        <Link href="/quotations" className="mt-6 text-blue-600 hover:underline">Return to quotations</Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(quotation.status);
  const vendorMessages = messages.filter(m => m.sender_role !== "admin");
  const adminMessages = messages.filter(m => m.sender_role === "admin" || m.action === "admin_confirmed" || m.action === "admin_rejected");

  const displayMessages = activeTab === "vendor" ? vendorMessages : adminMessages;

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      <div className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/quotations" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
            <ArrowLeft size={16} /> Back to quotations
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{quotation.product_name}</h1>
              <p className="text-sm text-zinc-500 mt-1">Negotiation with <span className="font-semibold text-zinc-800">{quotation.vendor_name || "Unknown Vendor"}</span></p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold border ${statusInfo.bg} ${statusInfo.text} border-current/20`}>
              {statusInfo.label}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Panel - Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Quotation Details
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between pb-4 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm">Requested</span>
                  <span className="font-semibold text-zinc-900">{quotation.requested_quantity} units</span>
                </div>
                {quotation.requested_price && (
                  <div className="flex justify-between pb-4 border-b border-zinc-100">
                    <span className="text-zinc-500 text-sm">Target Price</span>
                    <span className="font-semibold text-zinc-900">₹{quotation.requested_price}</span>
                  </div>
                )}
                {quotation.current_offer_price && (
                  <div className="flex justify-between pb-4 border-b border-zinc-100">
                    <span className="text-blue-600 text-sm font-medium">Latest Offer</span>
                    <span className="font-bold text-blue-700">₹{quotation.current_offer_price} × {quotation.current_offer_quantity}</span>
                  </div>
                )}
                {quotation.accepted_price && (
                  <div className="flex justify-between pb-4 border-b border-zinc-100">
                    <span className="text-emerald-600 text-sm font-medium">Agreed Price</span>
                    <span className="font-bold text-emerald-700">₹{quotation.accepted_price} × {quotation.accepted_quantity}</span>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-xs text-zinc-400">Created: {new Date(quotation.created_at).toLocaleString()}</p>
                  <p className="text-xs text-zinc-400 mt-1">Last Update: {new Date(quotation.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Negotiation Timeline / Steps */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 mb-6">Progress</h2>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:-translate-x-1/2 before:bg-zinc-100">
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                  <p className="text-sm font-semibold text-zinc-900">Request Sent</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full ${quotation.status !== "pending_vendor" ? "bg-blue-600 ring-4 ring-blue-50" : "bg-zinc-200"}`} />
                  <p className={`text-sm font-semibold ${quotation.status !== "pending_vendor" ? "text-zinc-900" : "text-zinc-400"}`}>Negotiation</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full ${quotation.status.includes("accepted") || quotation.admin_confirmation_status ? "bg-blue-600 ring-4 ring-blue-50" : "bg-zinc-200"}`} />
                  <p className={`text-sm font-semibold ${quotation.status.includes("accepted") || quotation.admin_confirmation_status ? "text-zinc-900" : "text-zinc-400"}`}>Terms Agreed</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full ${quotation.admin_confirmation_status === "confirmed" ? "bg-emerald-500 ring-4 ring-emerald-50" : quotation.admin_confirmation_status === "rejected" ? "bg-rose-500 ring-4 ring-rose-50" : "bg-zinc-200"}`} />
                  <p className={`text-sm font-semibold ${quotation.admin_confirmation_status === "confirmed" ? "text-emerald-600" : quotation.admin_confirmation_status === "rejected" ? "text-rose-600" : "text-zinc-400"}`}>Admin Confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Chat and Actions */}
          <div className="lg:col-span-2 flex flex-col h-[800px] rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">

            {/* Chat Tabs */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/80">
              <button
                onClick={() => setActiveTab("vendor")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${activeTab === "vendor" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"}`}
              >
                <User size={18} /> Chat with Vendor
              </button>
              {showAdminChat && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${activeTab === "admin" ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"}`}
                >
                  <ShieldCheck size={18} />
                  Admin Confirmation
                  {isAdminPending && <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse ml-1" />}
                </button>
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30">
              {displayMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <p>No messages yet in this channel.</p>
                </div>
              ) : (
                displayMessages.map((msg) => {
                  const isClient = msg.sender_role === "client";
                  const isAdmin = msg.sender_role === "admin";

                  return (
                    <div key={msg.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[80%] gap-3 ${isClient ? "flex-row-reverse" : "flex-row"}`}>

                        {/* Avatar */}
                        <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm
                          ${isClient ? "bg-blue-600" : isAdmin ? "bg-indigo-600" : "bg-emerald-600"}
                        `}>
                          {isClient ? "U" : isAdmin ? "A" : "V"}
                        </div>

                        {/* Bubble */}
                        <div className={`rounded-2xl p-4 shadow-sm ${isClient
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : isAdmin
                              ? "bg-white border border-indigo-100 text-zinc-800 rounded-tl-sm"
                              : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm"
                          }`}>

                          <div className="flex items-center justify-between gap-4 mb-2">
                            <span className={`text-xs font-bold ${isClient ? "text-blue-100" : isAdmin ? "text-indigo-600" : "text-emerald-600"}`}>
                              {isClient ? "You" : isAdmin ? "MTWO Admin" : quotation.vendor_name || "Vendor"}
                            </span>
                            <span className={`text-[10px] ${isClient ? "text-blue-200" : "text-zinc-400"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Message Content */}
                          <div className={`text-sm ${isClient ? "text-blue-50" : "text-zinc-600"} space-y-2`}>
                            {msg.action && msg.action !== "note" && (
                              <div className={`inline-block rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider ${isClient ? "bg-blue-700/50" : "bg-zinc-100 text-zinc-600"
                                }`}>
                                {msg.action.replace(/_/g, " ")}
                              </div>
                            )}

                            {msg.offer_price && msg.offer_quantity && (
                              <div className={`mt-2 rounded-lg p-3 ${isClient ? "bg-blue-700/50" : "bg-zinc-50 border border-zinc-100"}`}>
                                <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Offer Details</p>
                                <p className="text-lg font-bold">₹{msg.offer_price} × {msg.offer_quantity}</p>
                              </div>
                            )}

                            {msg.reason && (
                              <div>
                                <p className="text-xs uppercase opacity-80 font-semibold mt-2">Reason</p>
                                <p className="mt-0.5">{msg.reason}</p>
                              </div>
                            )}

                            {msg.note && (
                              <div className="whitespace-pre-wrap">{msg.note}</div>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {activeTab === "admin" && quotation.admin_confirmation_message && !displayMessages.some(m => m.sender_role === "admin") && (
                // Fallback display if message record is missing but field exists
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] gap-3 flex-row">
                    <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm bg-indigo-600">A</div>
                    <div className="rounded-2xl p-4 shadow-sm bg-white border border-indigo-100 text-zinc-800 rounded-tl-sm">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-xs font-bold text-indigo-600">MTWO Admin</span>
                      </div>
                      <div className="text-sm text-zinc-600 whitespace-pre-wrap">
                        {quotation.admin_confirmation_message}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Action Area */}
            <div className="bg-white border-t border-zinc-200 p-6">

              {/* Vendor Actions */}
              {activeTab === "vendor" && (
                <>
                  {isClosed && quotation.admin_confirmation_status === null ? (
                    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-zinc-600">
                      <CheckCircle2 className="text-zinc-400" />
                      <p className="text-sm font-medium">This negotiation is closed. Terms have been agreed upon.</p>
                    </div>
                  ) : isWaitingForVendor ? (
                    <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                      <Clock className="text-amber-500 animate-pulse" />
                      <p className="text-sm font-medium">Waiting for vendor to respond to your request...</p>
                    </div>
                  ) : canReplyToVendor ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Your Price (₹)</label>
                          <input
                            type="number"
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Price per unit"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Quantity</label>
                          <input
                            type="number"
                            value={offerQuantity}
                            onChange={(e) => setOfferQuantity(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Units"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Message / Note</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Add a message to the vendor..."
                          className="w-full min-h-[80px] resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>

                      {reason && (
                        <div>
                          <label className="text-xs font-semibold text-rose-500 uppercase tracking-wider ml-1 mb-1 block">Rejection Reason</label>
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Required if rejecting"
                            className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800 placeholder-rose-300 focus:border-rose-500 focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-zinc-100">
                        <button
                          onClick={() => setReason(reason ? "" : "Price too high")}
                          className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mr-auto"
                        >
                          {reason ? "Cancel Rejection" : "Reject Offer"}
                        </button>

                        {reason ? (
                          <button
                            onClick={() => void submitResponse("reject")}
                            disabled={submitting || !reason.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
                          >
                            <XCircle size={18} /> Confirm Rejection
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => void submitResponse("counter")}
                              disabled={submitting || !offerPrice || !offerQuantity}
                              className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-2 text-sm font-bold text-blue-600 shadow-sm hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            >
                              <Send size={18} /> Counter Offer
                            </button>
                            <button
                              onClick={() => void submitResponse("accept")}
                              disabled={submitting}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 hover:shadow-md disabled:opacity-50 transition-all"
                            >
                              <CheckCircle2 size={18} /> Accept Terms
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {/* Admin Actions */}
              {activeTab === "admin" && (
                <>
                  {isAdminPending ? (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 mb-4 flex gap-3">
                        <ShieldCheck className="text-orange-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-orange-900">Action Required</p>
                          <p className="text-sm text-orange-800 mt-1">Admin has reviewed the agreed terms and sent a confirmation request. Please review their message and confirm to proceed with the order.</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Reply Note (Optional)</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Add a message for the admin..."
                          className="w-full min-h-[80px] resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => void submitAdminResponse("reject")}
                          disabled={submitting}
                          className="inline-flex items-center gap-2 rounded-xl bg-white border border-rose-200 px-6 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={18} /> Reject
                        </button>
                        <button
                          onClick={() => void submitAdminResponse("accept")}
                          disabled={submitting}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
                        >
                          <CheckCircle2 size={18} /> Confirm Order
                        </button>
                      </div>
                    </div>
                  ) : quotation.admin_confirmation_status === "confirmed" ? (
                    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 justify-center">
                      <CheckCircle2 className="text-emerald-500" />
                      <p className="text-sm font-bold">You have confirmed the admin's request. Order is active.</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800 justify-center">
                      <XCircle className="text-rose-500" />
                      <p className="text-sm font-bold">You rejected the admin confirmation.</p>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
