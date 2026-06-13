'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaxFi } from '@/hooks/useTaxFi';
import { useAccount } from 'wagmi';
import { ScrollReveal } from '@/components/ScrollReveal';
import { TaxChart } from '@/components/TaxChart';
import { DonutChart } from '@/components/DonutChart';
import PageHeader from '../_components/PageHeader';
import EmptyState from '../_components/EmptyState';
import LiveIndicator from './_components/LiveIndicator';
import DashboardSkeleton from './_components/DashboardSkeleton';
import QuickActions from './_components/QuickActions';
import OpportunitiesSection from './_components/OpportunitiesSection';

function StatCard({ label, value, gradient = false, children }: { label: string; value: string | number; gradient?: boolean; children?: React.ReactNode }) {
  return (
    <div className="relative bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/[0.06] to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
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

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { isLoading, error, opportunities, lastScan, runPipeline, connectWebSocket } = useTaxFi();
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isConnected && !wsRef.current) {
      const ws = connectWebSocket();
      if (ws) {
        wsRef.current = ws;
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);
        ws.onerror = () => { setWsConnected(false); wsRef.current = null; };
      }
    }
    return () => { wsRef.current?.close(); wsRef.current = null; };
  }, [isConnected, connectWebSocket]);

  const totalSavings = opportunities.reduce((sum, o) => sum + (o.estimated_savings || 0), 0);
  const totalLosses = opportunities.reduce((sum, o) => sum + (o.unrealized_loss || 0), 0);

  const savingsData = [
    { name: 'Jan', savings: 1200 }, { name: 'Feb', savings: 1900 },
    { name: 'Mar', savings: 1500 }, { name: 'Apr', savings: 2800 },
    { name: 'May', savings: 2200 }, { name: 'Jun', savings: totalSavings || 3100 },
  ];
  const portfolioData = [
    { name: 'ETH', value: 45, color: '#10b981' },
    { name: 'BTC', value: 30, color: '#f59e0b' },
    { name: 'USDC', value: 15, color: '#3b82f6' },
    { name: 'Others', value: 10, color: '#8b5cf6' },
  ];

  if (!isConnected) return null;
  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal>
        <PageHeader
          title="Dashboard"
          subtitle={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined}
          actions={
            <div className="flex gap-3 items-center">
              <LiveIndicator connected={wsConnected} />
              <button
                onClick={() => runPipeline()}
                disabled={isLoading}
                className="relative px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Scanning
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Scan Portfolio
                    </>
                  )}
                </span>
              </button>
            </div>
          }
        />
      </ScrollReveal>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl p-4 text-red-600 text-sm flex items-center gap-3 animate-slide-up">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Opportunities" value={opportunities.length}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </StatCard>
          <StatCard label="Harvestable Losses" value={`$${Math.abs(totalLosses).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} gradient>
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
          <StatCard label="Last Scan" value={lastScan ? new Date(lastScan).toLocaleDateString() : 'Never'}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </StatCard>
        </div>
      </ScrollReveal>

      {/* Charts */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 mb-4">Cumulative Tax Savings</h3>
              <TaxChart data={savingsData} type="area" dataKey="savings" color="#10b981" height={320} />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 mb-4">Asset Allocation</h3>
            <DonutChart data={portfolioData} height={320} innerRadius={70} outerRadius={120} />
          </div>
        </div>
      </ScrollReveal>

      {/* Quick Actions */}
      <ScrollReveal>
        <QuickActions />
      </ScrollReveal>

      {/* Top Opportunities */}
      <ScrollReveal>
        <OpportunitiesSection opportunities={opportunities} />
      </ScrollReveal>

      {/* Empty State */}
      {opportunities.length === 0 && !isLoading && (
        <ScrollReveal>
          <EmptyState
            title="No Opportunities Found"
            description="Run a scan to analyze your portfolio for tax savings opportunities."
            action={
              <button
                onClick={() => runPipeline()}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97]"
              >
                Scan Portfolio
              </button>
            }
          />
        </ScrollReveal>
      )}
    </div>
  );
}
