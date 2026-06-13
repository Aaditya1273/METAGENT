'use client';

import { useState } from 'react';
import { useTaxFi } from '@/hooks/useTaxFi';
import { useAccount } from 'wagmi';
import { ScrollReveal } from '@/components/ScrollReveal';
import { TaxChart } from '@/components/TaxChart';
import PageHeader from '../_components/PageHeader';
import TabBar from '../_components/TabBar';
import EmptyState from '../_components/EmptyState';
import PortfolioTable from './_components/PortfolioTable';
import PortfolioDetail from './_components/PortfolioDetail';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'lots', label: 'Open Lots' },
];

function StatCard({ label, value, gradient = false, children }: { label: string; value: string | number; gradient?: boolean; children?: React.ReactNode }) {
  return (
    <div className="relative bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/[0.06] to-transparent rounded-full" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</span>
          {children}
        </div>
        <div className={`text-2xl lg:text-3xl font-bold ${gradient ? 'bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent' : 'text-gray-900'}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { ledgers, runPipeline, isLoading } = useTaxFi();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const ledgerList = Object.values(ledgers);
  const totalGainLoss = ledgerList.reduce((sum, l) => sum + (l.realized_gain_loss || 0), 0);
  const totalSold = ledgerList.reduce((sum, l) => sum + (l.total_sold || 0), 0);
  const totalAcquired = ledgerList.reduce((sum, l) => sum + (l.total_acquired || 0), 0);

  const performanceData = ledgerList.map((ledger) => ({
    name: ledger.asset,
    value: ledger.realized_gain_loss || 0,
  }));

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-200/40">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 2.79 8 4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Portfolio</h2>
        <p className="text-gray-500">Connect your wallet to view your portfolio</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <PageHeader
          title="Portfolio"
          subtitle="Cost basis tracking and transaction history"
          actions={
            <button
              onClick={() => runPipeline()}
              disabled={isLoading}
              className="relative px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </span>
            </button>
          }
        />
      </ScrollReveal>

      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard label="Total Acquisitions" value={`$${totalAcquired.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </StatCard>
          <StatCard label="Total Disposals" value={`$${totalSold.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </StatCard>
          <StatCard label="Net Gain/Loss" value={`$${totalGainLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} gradient>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </StatCard>
        </div>
      </ScrollReveal>

      {performanceData.length > 0 && (
        <ScrollReveal>
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 mb-4">Realized Gains &amp; Losses</h3>
            <TaxChart data={performanceData} type="bar" dataKey="value" color={totalGainLoss >= 0 ? '#10b981' : '#ef4444'} height={280} />
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </ScrollReveal>

      {activeTab === 'overview' && (
        <ScrollReveal>
          <PortfolioTable ledgers={ledgerList} onSelectAsset={setSelectedAsset} />
        </ScrollReveal>
      )}

      {activeTab === 'lots' && (
        <ScrollReveal>
          <EmptyState
            title="Tax Lot Details"
            description="Detailed tax lot information will appear here after scanning your transactions."
          />
        </ScrollReveal>
      )}

      <PortfolioDetail asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
}
