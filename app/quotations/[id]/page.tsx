"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Send, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

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
};

export default function QuotationDetailPage() {
  const params = useParams();
  const quotationId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [messages, setMessages] = useState<QuotationMessage[]>([]);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isClosed = quotation
    ? ["client_accepted", "client_rejected", "vendor_rejected", "cancelled", "expired"].includes(quotation.status)
    : false;
  const isWaitingForVendor = quotation ? quotation.current_offer_by !== "vendor" && !isClosed : true;
  const canReplyToVendor = quotation ? quotation.current_offer_by === "vendor" && !isClosed : false;

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
      // Prefill counter inputs from the latest vendor offer when available.
      const latestOfferPrice = data.data?.quotation?.current_offer_price ?? null;
      const latestOfferQty = data.data?.quotation?.current_offer_quantity ?? null;
      setOfferPrice(latestOfferPrice != null ? String(latestOfferPrice) : "");
      setOfferQuantity(latestOfferQty != null ? String(latestOfferQty) : "");
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

  const submitResponse = async (action: "counter" | "accept" | "reject") => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === "counter") {
        payload.offerPrice = Number(offerPrice);
        payload.offerQuantity = Number(offerQuantity);
        payload.reason = reason.trim();
        payload.note = note.trim();
      }
      if (action === "accept") {
        payload.note = note.trim();
      }
      if (action === "reject") {
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
      toast.success("Response submitted");
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">Quotation not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{quotation.product_name}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize">{quotation.status.replace(/_/g, " ")}</span>
          <span>Requested: {quotation.requested_quantity}</span>
          {quotation.current_offer_price ? (
            <span>Latest offer: ₹{quotation.current_offer_price} × {quotation.current_offer_quantity}</span>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Conversation</h2>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex">
              <div className="shrink-0 mr-3">
                <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-700">{msg.sender_role === 'vendor' ? 'V' : 'B'}</div>
              </div>
              <div className="flex-1">
                <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase text-zinc-500">{msg.sender_role === 'vendor' ? 'Vendor' : 'Buyer'}</p>
                    <p className="text-xs text-zinc-400">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                  <div className="mt-2">
                    {msg.offer_price && msg.offer_quantity ? (
                      <p className="text-zinc-800 font-semibold">Offer: ₹{msg.offer_price} × {msg.offer_quantity}</p>
                    ) : null}
                    {msg.action ? <p className="mt-1 text-sm text-zinc-700">Action: {msg.action}</p> : null}
                    {msg.reason ? <p className="mt-1 text-zinc-700">Reason: {msg.reason}</p> : null}
                    {msg.note ? <p className="mt-1 text-zinc-700">Note: {msg.note}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">Take action</h2>
        <p className="text-sm text-zinc-500 mb-4">This timeline is read-only. You can only act when the vendor has sent the latest offer.</p>

        {isWaitingForVendor ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your quotation request is waiting for the vendor's reply. No edit box is available yet.
          </div>
        ) : null}

        {isClosed ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            This quotation is closed. No further discussion is possible.
          </div>
        ) : null}

        {!isWaitingForVendor && !isClosed ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Counter offer price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={offerPrice}
                  onChange={(event) => setOfferPrice(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Counter offer quantity</label>
                <input
                  type="number"
                  min="1"
                  value={offerQuantity}
                  onChange={(event) => setOfferQuantity(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Reason</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full min-h-20 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Note</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full min-h-20 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => void submitResponse("counter")}
                disabled={submitting || !canReplyToVendor}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                Submit counter
              </button>
              <button
                onClick={() => void submitResponse("accept")}
                disabled={submitting || !canReplyToVendor}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept offer
              </button>
              <button
                onClick={() => void submitResponse("reject")}
                disabled={submitting || !canReplyToVendor}
                className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
