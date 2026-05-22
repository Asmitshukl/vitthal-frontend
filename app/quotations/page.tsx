"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

type QuotationRow = {
  id: string;
  status: string;
  requested_quantity: number;
  requested_price: number | null;
  current_offer_price: number | null;
  current_offer_quantity: number | null;
  current_offer_by: string | null;
  accepted_price: number | null;
  accepted_quantity: number | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  product_name: string;
};

function statusStyles(status: string) {
  switch (status) {
    case "pending_vendor":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "vendor_offered":
    case "vendor_countered":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "client_countered":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "client_accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "client_rejected":
    case "vendor_rejected":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/quotations`, {
          credentials: "include",
          headers: { "Content-Type": "application/json", "x-request-from": "client" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load quotations");
        setQuotations(data.data || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load quotations";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadQuotations();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <FileText className="mx-auto h-12 w-12 text-zinc-300" />
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">No quotations yet</h1>
        <p className="mt-2 text-sm text-zinc-500">Send a quotation request from your quotation cart.</p>
        <Link
          href="/quotation-cart"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to quotation cart
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Your quotations</h1>
      <div className="grid gap-4">
        {quotations.map((quote) => (
          <Link
            key={quote.id}
            href={`/quotations/${quote.id}`}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-zinc-900">{quote.product_name}</p>
                <p className="text-xs text-zinc-500">Requested: {quote.requested_quantity} units</p>
              </div>
              <div className="text-sm text-zinc-600">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusStyles(quote.status)}`}>
                  {quote.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
