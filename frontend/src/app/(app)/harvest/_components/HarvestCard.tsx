'use client';

import { Sparkline } from '@/components/Sparkline';

interface Opportunity {
  asset: string;
  quantity: number;
  cost_basis: number;
  current_value: number;
  unrealized_loss: number;
  estimated_savings: number;
  chain_id?: string;
  priority?: string;
}

interface HarvestCardProps {
  opportunity: Opportunity;
  index: number;
  onExecute: (index: number) => void;
  isExecuting: boolean;
  sparklineData?: number[];
}

export default function HarvestCard({
  opportunity: opp,
  index,
  onExecute,
  isExecuting,
  sparklineData = [1000, 1500, 1200, 2800, 2200, 3100, 2800, 3500],
}: HarvestCardProps) {
  return (
    <div className="group bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 lg:p-8 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 hover:border-emerald-300/60 transition-all duration-300">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
              {opp.asset.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">{opp.asset}</h3>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold border border-emerald-200/60 bg-emerald-50/80 text-emerald-600">
                  {opp.chain_id?.replace('eip155:', '') || 'ETH'}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                  opp.priority === 'high'
                    ? 'bg-green-50/80 border-green-200/60 text-green-600'
                    : 'bg-amber-50/80 border-amber-200/60 text-amber-600'
                }`}>
                  {opp.priority || 'medium'} priority
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkline data={sparklineData.slice(0, 8)} width={100} height={28} color="#10b981" />
                <span className="text-gray-400 text-xs">24h trend</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Quantity', value: opp.quantity.toFixed(6), color: 'text-gray-900' },
              { label: 'Cost Basis', value: `$${opp.cost_basis.toFixed(2)}`, color: 'text-gray-900' },
              { label: 'Current Value', value: `$${opp.current_value.toFixed(2)}`, color: 'text-gray-900' },
              { label: 'Unrealized Loss', value: `-$${Math.abs(opp.unrealized_loss).toFixed(2)}`, color: 'text-red-600' },
            ].map((col, i) => (
              <div key={i} className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/40">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{col.label}</p>
                <p className={`font-bold text-lg ${col.color}`}>{col.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:min-w-[200px]">
          <div className="text-left lg:text-right">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Est. Tax Savings</p>
            <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              ${opp.estimated_savings.toFixed(0)}
            </p>
          </div>
          <button
            onClick={() => onExecute(index)}
            disabled={isExecuting}
            className="relative w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/btn"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Executing
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Harvest Now
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
