'use client';

import { useState, useEffect } from 'react';
import { ParallaxCard } from '../../../components/ParallaxCard';
import { ScrollReveal } from '../../../components/ScrollReveal';
import { TextReveal } from '../../../components/TextReveal';
import { useTaxFi } from '../../../hooks/useTaxFi';
import { useAccount } from 'wagmi';
import { StatCard } from '../../../components/StatCard';
import { TaxChart } from '../../../components/TaxChart';
import { Sparkline } from '../../../components/Sparkline';

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { ledgers, runPipeline, isLoading } = useTaxFi();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lots'>('overview');

  const ledgerList = Object.values(ledgers);
  const totalGainLoss = ledgerList.reduce((sum, l) => sum + (l.realized_gain_loss || 0), 0);
  const totalSold = ledgerList.reduce((sum, l) => sum + (l.total_sold || 0), 0);
  const totalAcquired = ledgerList.reduce((sum, l) => sum + (l.total_acquired || 0), 0);

  // Mock data for charts
  const performanceData = ledgerList.map((ledger, i) => ({
    name: ledger.asset,
    value: ledger.realized_gain_loss || 0,
  }));

  const sparklineData = [1000, 1500, 1200, 2800, 2200, 3100, 2800, 3500];

  if (!isConnected) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="text-6xl mb-4 animate-float">🔐</div>
        <h2 className="text-3xl font-bold text-white mb-4">Portfolio</h2>
        <p className="text-gray-400">Connect your wallet to view your portfolio</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal direction="up" delay={0}>
        <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-gradient">Portfolio</h1>
          <p className="text-gray-400">Cost basis tracking and transaction history</p>
        </div>
        <button
          onClick={() => runPipeline()}
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <span className="text-lg">🔄</span>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Summary Stats */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Acquisitions" 
          value={`$${totalAcquired.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="📥"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard 
          label="Total Disposals" 
          value={`$${totalSold.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="📤"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          label="Net Gain/Loss" 
          value={`$${totalGainLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon="📊"
          gradient
          trend={{ value: totalGainLoss >= 0 ? 12 : -5, isPositive: totalGainLoss >= 0 }}
        />
      </div>

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <TaxChart 
          data={performanceData}
          type="bar"
          dataKey="value"
          color={totalGainLoss >= 0 ? '#22c55e' : '#ef4444'}
          height={300}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-white/[0.02] p-1 rounded-2xl border border-white/[0.08] w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 rounded-xl transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-taxfi-500/20 text-taxfi-300 border border-taxfi-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('lots')}
          className={`px-6 py-2 rounded-xl transition-all duration-300 ${
            activeTab === 'lots'
              ? 'bg-taxfi-500/20 text-taxfi-300 border border-taxfi-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Open Lots
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="card-premium overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className="table-header p-5 text-left">Asset</th>
                <th className="table-header p-5 text-right">Method</th>
                <th className="table-header p-5 text-right">Acquired</th>
                <th className="table-header p-5 text-right">Sold</th>
                <th className="table-header p-5 text-right">Gain/Loss</th>
                <th className="table-header p-5 text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {ledgerList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-lg">No portfolio data yet. Run a scan to analyze your transactions.</p>
                  </td>
                </tr>
              ) : (
                ledgerList.map((ledger, i) => (
                  <tr
                    key={i}
                    className="table-row cursor-pointer hover:scale-[1.01] transition-transform"
                    onClick={() => setSelectedAsset(ledger.asset)}
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-taxfi-500/20 to-taxfi-500/5 flex items-center justify-center text-lg font-bold">
                          {ledger.asset.slice(0, 2)}
                        </div>
                        <span className="text-white font-semibold">{ledger.asset}</span>
                      </div>
                    </td>
                    <td className="p-5 text-gray-400 text-right font-mono text-sm">{ledger.method}</td>
                    <td className="p-5 text-gray-300 text-right font-semibold">
                      ${(ledger.total_acquired || 0).toLocaleString()}
                    </td>
                    <td className="p-5 text-gray-300 text-right font-semibold">
                      ${(ledger.total_sold || 0).toLocaleString()}
                    </td>
                    <td className={`p-5 text-right font-bold ${
                      (ledger.realized_gain_loss || 0) >= 0 ? 'text-harvest-400' : 'text-loss-400'
                    }`}>
                      ${(ledger.realized_gain_loss || 0).toLocaleString()}
                    </td>
                    <td className="p-5">
                      <Sparkline data={sparklineData.slice(0, 8)} width={100} height={30} color={(ledger.realized_gain_loss || 0) >= 0 ? '#22c55e' : '#ef4444'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'lots' && (
        <div className="card-premium p-12 text-center">
          <div className="text-6xl mb-4 animate-float">📋</div>
          <h3 className="text-xl font-bold text-white mb-2">Tax Lot Details</h3>
          <p className="text-gray-400">Detailed tax lot information will appear here after scanning your transactions.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-panel-strong p-8 max-w-2xl w-full mx-4 animate-scale-in">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-taxfi-500/20 to-taxfi-500/5 flex items-center justify-center text-3xl font-bold">
                  {selectedAsset.slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedAsset}</h2>
                  <p className="text-gray-400">Detailed lot information</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-xl">
                <span className="text-gray-400">Cost Basis Method</span>
                <span className="text-white font-semibold">HIFO</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-xl">
                <span className="text-gray-400">Total Acquired</span>
                <span className="text-white font-semibold">$12,450.00</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-xl">
                <span className="text-gray-400">Total Sold</span>
                <span className="text-white font-semibold">$8,320.00</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-xl">
                <span className="text-gray-400">Realized Gain/Loss</span>
                <span className="text-harvest-400 font-bold">-$4,130.00</span>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => setSelectedAsset(null)} className="btn-secondary">
                Close
              </button>
              <button className="btn-primary">View Transactions</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
