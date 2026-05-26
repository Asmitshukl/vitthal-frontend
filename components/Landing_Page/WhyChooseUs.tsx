"use client";

import { ShieldCheck, BarChart2, Zap, Globe, Tag, HeadphonesIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Verified Vendors",
    detail: "KYC-checked suppliers with consistent trade records and buyer ratings",
  },
  {
    icon: BarChart2,
    title: "Transparent Pricing",
    detail: "Compare quotes side-by-side with clear MOQ and lead times",
  },
  {
    icon: Zap,
    title: "Fast Procurement",
    detail: "Centralized RFQ workflow for faster vendor finalization",
  },
  {
    icon: Globe,
    title: "Wide Supplier Network",
    detail: "2,300+ verified suppliers across 180+ cities in India",
  },
  {
    icon: Tag,
    title: "Bulk Discounts",
    detail: "Access competitive bulk pricing and recurring order agreements",
  },
  {
    icon: HeadphonesIcon,
    title: "Reliable Support",
    detail: "24/7 customer support for procurement queries and disputes",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-zinc-50 border-t border-zinc-200">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading title="Why Choose MTWO Groups" subtitle="Built for enterprise procurement teams in manufacturing and distribution" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <article 
                key={point.title}
                className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-[#1d4ed8]/30 hover:shadow-md"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-2.5 text-[#1d4ed8]">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">{point.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">{point.detail}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

