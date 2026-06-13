'use client';

import { Sparkline } from '@/components/Sparkline';

interface Ledger {
  asset: string;
  method: string;
  total_acquired: number;
  total_sold: number;
  realized_gain_loss: number;
}

interface PortfolioTableProps {
  ledgers: Ledger[];
  onSelectAsset: (asset: string) => void;
  sparklineData?: number[];
}

export default function PortfolioTable({ ledgers, onSelectAsset, sparklineData = [1000, 1500, 1200, 2800, 2200, 3100, 2800, 3500] }: PortfolioTableProps) {
  if (ledgers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-200/40">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">No portfolio data yet. Run a scan to analyze your transactions.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] overflow-hidden shadow-lg shadow-emerald-500/5">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-emerald-100/60">
              <th className="text-xs text-gray-500 font-semibold uppercase tracking-[0.12em] p-5 text-left">Asset</th>
              <th className="text-xs text-gray-500 font-semibold uppercase tracking-[0.12em] p-5 text-right">Method</th>
              <th className="text-xs text-gray-500 font-semibold uppercase tracking-[0.12em] p-5 text-right">Acquired</th>
              <th className="text-xs text-gray-500 font-semibold uppercase tracking-[0.12em] p-5 text-right">Sold</th>
              <th className="text-xs text-gray-500 font-semibold uppercase tracking-[0.12em] p-5 text-right">Gain/Loss</th>
              <th className="text-xs text-gray-500 font-semibold uppercase tracking-[0.12em] p-5 text-right">Trend</th>
            </tr>
          </thead>
          <tbody>
            {ledgers.map((ledger, i) => (
              <tr
                key={i}
                className="border-b border-emerald-100/40 last:border-0 hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                onClick={() => onSelectAsset(ledger.asset)}
              >
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                      {ledger.asset.slice(0, 2)}
                    </div>
                    <span className="text-gray-900 font-semibold">{ledger.asset}</span>
                  </div>
                </td>
                <td className="p-5 text-gray-500 text-right font-mono text-sm">{ledger.method}</td>
                <td className="p-5 text-gray-700 text-right font-semibold">
                  ${(ledger.total_acquired || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="p-5 text-gray-700 text-right font-semibold">
                  ${(ledger.total_sold || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className={`p-5 text-right font-bold ${(ledger.realized_gain_loss || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  ${(ledger.realized_gain_loss || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="p-5">
                  <div className="flex justify-end">
                    <Sparkline data={sparklineData.slice(0, 8)} width={80} height={24} color={(ledger.realized_gain_loss || 0) >= 0 ? '#10b981' : '#ef4444'} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
