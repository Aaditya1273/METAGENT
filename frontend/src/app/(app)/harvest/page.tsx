'use client';

import { useState } from 'react';
import { useTaxFi } from '@/hooks/useTaxFi';
import { useAccount } from 'wagmi';
import { useToast } from '@/components/Toast';
import { ScrollReveal } from '@/components/ScrollReveal';
import PageHeader from '../_components/PageHeader';
import FilterPills from '../_components/FilterPills';
import EmptyState from '../_components/EmptyState';
import HarvestCard from './_components/HarvestCard';

const CHAIN_OPTIONS = [
  { value: 'all', label: 'All Chains' },
  { value: 'eip155:1', label: 'Ethereum' },
  { value: 'eip155:8453', label: 'Base' },
  { value: 'eip155:42161', label: 'Arbitrum' },
];

function StatCard({ label, value, gradient = false, children }: { label: string; value: string | number; gradient?: boolean; children?: React.ReactNode }) {
  return (
    <div className="relative bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden group">
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

export default function HarvestPage() {
  const { address, isConnected } = useAccount();
  const { opportunities, executeHarvest, isLoading } = useTaxFi();
  const toast = useToast();
  const [executingIndex, setExecutingIndex] = useState<number | null>(null);
  const [filterChain, setFilterChain] = useState('all');

  const filteredOpps = filterChain === 'all'
    ? opportunities
    : opportunities.filter((o) => o.chain_id === filterChain);

  const totalHarvestable = filteredOpps.reduce((sum, o) => sum + (o.unrealized_loss || 0), 0);
  const totalSavings = filteredOpps.reduce((sum, o) => sum + (o.estimated_savings || 0), 0);

  const handleExecute = async (index: number) => {
    setExecutingIndex(index);
    try {
      const success = await executeHarvest(index);
      if (success) {
        toast.success('Harvest Executed', 'The tax loss harvest was executed successfully.');
      } else {
        toast.error('Harvest Failed', 'Please try again or check your wallet connection.');
      }
    } finally {
      setExecutingIndex(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-200/40">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tax Loss Harvesting</h2>
        <p className="text-gray-500">Connect your wallet to access harvest opportunities</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <PageHeader title="Harvest Opportunities" subtitle="Execute tax loss harvesting to reduce your tax bill" />
      </ScrollReveal>

      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard label="Available Opportunities" value={filteredOpps.length}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </StatCard>
          <StatCard label="Total Harvestable Loss" value={`$${Math.abs(totalHarvestable).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} gradient>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </StatCard>
          <StatCard label="Est. Tax Savings" value={`$${totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} gradient>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </StatCard>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <FilterPills options={CHAIN_OPTIONS} selected={filterChain} onSelect={setFilterChain} />
      </ScrollReveal>

      {filteredOpps.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-200/40">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Opportunities Found</h3>
          <p className="text-gray-500">Your portfolio has no positions at a loss. Run a scan from the Dashboard.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOpps.map((opp, i) => (
            <HarvestCard
              key={i}
              opportunity={opp}
              index={i}
              onExecute={handleExecute}
              isExecuting={executingIndex === i}
            />
          ))}
        </div>
      )}

      {/* Info Box */}
      <ScrollReveal>
        <div className="relative bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-xl border border-emerald-200/60 rounded-[1.5rem] p-8 overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="relative flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-emerald-800 font-bold text-lg mb-3">How Tax Loss Harvesting Works</h4>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <span>Sell assets at a loss to realize the loss for tax purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <span>Immediately rebuy the same or similar asset to maintain your position</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <span>Losses offset capital gains, reducing your tax bill</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <span>TaxFi executes gaslessly via 1Shot relayer &mdash; you never need ETH</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <span>TaxFi charges 5% of realized tax savings as a fee</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
