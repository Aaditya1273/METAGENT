'use client';

import Link from 'next/link';
import { Sparkline } from '@/components/Sparkline';

interface Opportunity {
  asset: string;
  quantity: number;
  cost_basis: number;
  unrealized_loss: number;
  estimated_savings: number;
}

interface OpportunitiesSectionProps {
  opportunities: Opportunity[];
  sparklineData?: number[];
}

export default function OpportunitiesSection({
  opportunities,
  sparklineData = [1200, 1900, 1500, 2800, 2200, 3100, 2800, 3500],
}: OpportunitiesSectionProps) {
  if (opportunities.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">Top Opportunities</h3>
        <Link href="/harvest" className="text-sm text-emerald-600 hover:text-emerald-500 transition-colors font-medium flex items-center gap-1">
          View all
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
      <div className="space-y-3">
        {opportunities.slice(0, 5).map((opp, i) => (
          <div
            key={i}
            className="group bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-xl p-4 hover:border-emerald-300/60 hover:bg-emerald-50/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                  {opp.asset.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 font-semibold">{opp.asset}</p>
                  <p className="text-gray-500 text-xs">
                    {opp.quantity.toFixed(4)} units &middot; Cost: ${opp.cost_basis.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-emerald-600 font-bold">-${Math.abs(opp.unrealized_loss).toFixed(2)}</p>
                  <p className="text-gray-500 text-xs">Save ~${opp.estimated_savings.toFixed(0)}</p>
                </div>
                <Sparkline data={sparklineData.slice(0, 7)} width={64} height={24} color="#10b981" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
