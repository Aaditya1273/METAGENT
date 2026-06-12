'use client';

import { useState } from 'react';
import { useTaxFi } from '../../../hooks/useTaxFi';
import { useAccount } from 'wagmi';
import { useToast } from '../../../components/Toast';
import { StatCard } from '../../../components/StatCard';
import { ParallaxCard } from '../../../components/ParallaxCard';
import { ScrollReveal } from '../../../components/ScrollReveal';
import { TextReveal } from '../../../components/TextReveal';
import { ProgressRing } from '../../../components/ProgressRing';
import { Sparkline } from '../../../components/Sparkline';

export default function HarvestPage() {
  const { address, isConnected } = useAccount();
  const { opportunities, executeHarvest, isLoading } = useTaxFi();
  const toast = useToast();
  const [executing, setExecuting] = useState<number | null>(null);
  const [filterChain, setFilterChain] = useState<string>('all');

  const filteredOpps = filterChain === 'all'
    ? opportunities
    : opportunities.filter(o => o.chain_id === filterChain);

  const totalHarvestable = filteredOpps.reduce((sum, o) => sum + (o.unrealized_loss || 0), 0);
  const totalSavings = filteredOpps.reduce((sum, o) => sum + (o.estimated_savings || 0), 0);

  const sparklineData = [1000, 1500, 1200, 2800, 2200, 3100, 2800, 3500];

  const handleExecute = async (index: number) => {
    setExecuting(index);
    try {
      const success = await executeHarvest(index);
      if (!success) {
        toast.error('Harvest Failed', 'Please try again or check your wallet connection.');
      } else {
        toast.success('Harvest Executed', 'The tax loss harvest was executed successfully.');
      }
    } finally {
      setExecuting(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="text-6xl mb-4 animate-float">🔐</div>
        <h2 className="text-3xl font-bold text-white mb-4">Tax Loss Harvesting</h2>
        <p className="text-gray-400">Connect your wallet to access harvest opportunities</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <ScrollReveal direction="up" delay={0}>
        <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-gradient">Harvest Opportunities</h1>
          <p className="text-gray-400">Execute tax loss harvesting to reduce your tax bill</p>
        </div>
      </div>

      {/* Summary Stats */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Available Opportunities" 
          value={filteredOpps.length}
          icon="🎯"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          label="Total Harvestable Loss" 
          value={`$${Math.abs(totalHarvestable).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="💰"
          gradient
        />
        <StatCard 
          label="Est. Tax Savings" 
          value={`$${totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="📈"
          gradient
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-3 flex-wrap">
        {(['all', 'eip155:1', 'eip155:8453', 'eip155:42161'] as const).map((chain) => (
          <button
            key={chain}
            onClick={() => setFilterChain(chain)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              filterChain === chain
                ? 'bg-taxfi-500/20 text-taxfi-300 border border-taxfi-500/30 shadow-glow-blue'
                : 'bg-white/[0.02] text-gray-400 border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]'
            }`}
          >
            {chain === 'all' ? 'All Chains' : chain.replace('eip155:', '')}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      {filteredOpps.length === 0 ? (
        <div className="card-premium p-16 text-center">
          <div className="text-7xl mb-6 animate-float">✅</div>
          <h3 className="text-2xl font-bold text-white mb-3">No Opportunities Found</h3>
          <p className="text-gray-400 text-lg">
            Your portfolio has no positions at a loss. Run a scan from the Dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOpps.map((opp, i) => (
            <div
              key={i}
              className="card-premium group hover:scale-[1.01] transition-all duration-300"
            >
              <div className="flex justify-between items-start gap-6">
                <div className="flex-1">
                  {/* Asset Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-harvest-500/20 to-harvest-500/5 flex items-center justify-center text-3xl font-bold group-hover:scale-110 transition-transform">
                      {opp.asset.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-bold text-white">{opp.asset}</h3>
                        <span className="badge badge-info">
                          {opp.chain_id?.replace('eip155:', '') || 'ETH'}
                        </span>
                        <span className={`badge ${
                          opp.priority === 'high' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {opp.priority || 'medium'} priority
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Sparkline data={sparklineData.slice(0, 8)} width={120} height={35} color="#22c55e" />
                        <span className="text-gray-400 text-sm">24h trend</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/[0.02] rounded-xl">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Quantity</p>
                      <p className="text-white font-bold text-lg">{opp.quantity.toFixed(6)}</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-xl">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Cost Basis</p>
                      <p className="text-white font-bold text-lg">${opp.cost_basis.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-xl">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Current Value</p>
                      <p className="text-white font-bold text-lg">${opp.current_value.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-loss-500/10 rounded-xl border border-loss-500/20">
                      <p className="text-loss-400 text-xs font-semibold uppercase tracking-wider mb-1">Unrealized Loss</p>
                      <p className="text-loss-400 font-bold text-lg">-${Math.abs(opp.unrealized_loss).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Panel */}
                <div className="flex flex-col items-end gap-4 min-w-[200px]">
                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-1">Est. Tax Savings</p>
                    <p className="text-4xl font-bold text-gradient">
                      ${opp.estimated_savings.toFixed(0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressRing 
                      progress={Math.min((opp.estimated_savings / 1000) * 100, 100)} 
                      size={60}
                      strokeWidth={6}
                      color="#22c55e"
                    >
                      <span className="text-xs font-bold text-white">
                        {Math.min(Math.round((opp.estimated_savings / 1000) * 100), 100)}%
                      </span>
                    </ProgressRing>
                    <span className="text-gray-400 text-sm">efficiency</span>
                  </div>
                  <button
                    onClick={() => handleExecute(i)}
                    disabled={executing !== null}
                    className="btn-harvest w-full flex items-center justify-center gap-2"
                  >
                    {executing === i ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <span className="text-lg">⚡</span>
                        Harvest Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="card-premium bg-gradient-to-br from-taxfi-500/10 to-harvest-500/5 border border-taxfi-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-taxfi-500/20 to-harvest-500/10 flex items-center justify-center text-2xl flex-shrink-0">
            💡
          </div>
          <div>
            <h4 className="text-taxfi-300 font-bold text-lg mb-3">How Tax Loss Harvesting Works</h4>
            <ul className="text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-taxfi-400 mt-1">•</span>
                <span>Sell assets at a loss to realize the loss for tax purposes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-taxfi-400 mt-1">•</span>
                <span>Immediately rebuy the same or similar asset to maintain your position</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-taxfi-400 mt-1">•</span>
                <span>Losses offset capital gains, reducing your tax bill</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-taxfi-400 mt-1">•</span>
                <span>TaxFi executes gaslessly via 1Shot relayer — you never need ETH</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-taxfi-400 mt-1">•</span>
                <span>TaxFi charges 5% of realized tax savings as a fee</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
