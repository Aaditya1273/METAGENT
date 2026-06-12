'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaxFi } from '../../../hooks/useTaxFi';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { StatCard } from '../../../components/StatCard';
import { MetricCard } from '../../../components/MetricCard';
import { ProgressRing } from '../../../components/ProgressRing';
import { Sparkline } from '../../../components/Sparkline';
import { TaxChart } from '../../../components/TaxChart';
import { DonutChart } from '../../../components/DonutChart';
import { MagneticButton } from '../../../components/MagneticButton';
import { ParallaxCard } from '../../../components/ParallaxCard';
import { TextReveal } from '../../../components/TextReveal';
import { ScrollReveal } from '../../../components/ScrollReveal';
import { ParticleField } from '../../../components/ParticleField';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const {
    isLoading,
    error,
    opportunities,
    lastScan,
    runPipeline,
    connectWebSocket,
  } = useTaxFi();

  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isConnected && !wsRef.current) {
      const ws = connectWebSocket();
      if (ws) {
        wsRef.current = ws;
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);
        ws.onerror = () => {
          setWsConnected(false);
          wsRef.current = null;
        };
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isConnected, connectWebSocket]);

  const totalSavings = opportunities.reduce(
    (sum, o) => sum + (o.estimated_savings || 0),
    0,
  );
  const totalLosses = opportunities.reduce(
    (sum, o) => sum + (o.unrealized_loss || 0),
    0,
  );

  // Mock data for charts
  const savingsData = [
    { name: 'Jan', savings: 1200 },
    { name: 'Feb', savings: 1900 },
    { name: 'Mar', savings: 1500 },
    { name: 'Apr', savings: 2800 },
    { name: 'May', savings: 2200 },
    { name: 'Jun', savings: totalSavings || 3100 },
  ];

  const portfolioData = [
    { name: 'ETH', value: 45, color: '#627eea' },
    { name: 'BTC', value: 30, color: '#f7931a' },
    { name: 'USDC', value: 15, color: '#2775ca' },
    { name: 'Others', value: 10, color: '#8b5cf6' },
  ];

  const sparklineData = [1200, 1900, 1500, 2800, 2200, 3100, 2800, 3500];

  if (!isConnected) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      {/* Particle Background */}
      <ParticleField className="opacity-30" />
      
      <div className="relative z-10 space-y-8">
        {/* Header */}
        <ScrollReveal direction="up" delay={0}>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <TextReveal text="Dashboard" className="text-4xl font-bold text-gradient" />
              <p className="text-gray-400">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <div 
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  wsConnected
                    ? 'bg-harvest-500/10 border-harvest-500/30 text-harvest-400 glow-green'
                    : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                }`}
                style={wsConnected ? {
                  animation: 'pulse-glow 2s ease-in-out infinite',
                } : {}}
              >
                <span 
                  className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-harvest-400' : 'bg-gray-500'}`}
                  style={wsConnected ? {
                    animation: 'pulse-scale 1s ease-in-out infinite',
                  } : {}}
                />
                {wsConnected ? 'Live' : 'Offline'}
              </div>
              <MagneticButton
                onClick={() => runPipeline()}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div 
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Scanning...
                  </>
                ) : (
                  <>
                    <span 
                      className="text-lg"
                      style={{ animation: 'wiggle 0.5s ease-in-out' }}
                    >
                      ⚡
                    </span>
                    Scan Portfolio
                  </>
                )}
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>

      {error && (
        <div className="bg-loss-500/10 border border-loss-500/30 rounded-2xl p-4 text-loss-400 animate-slide-up">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ParallaxCard className="stat-card">
            <StatCard 
              label="Opportunities" 
              value={opportunities.length} 
              icon="🎯"
              trend={{ value: 12, isPositive: true }}
            />
          </ParallaxCard>
          <ParallaxCard className="stat-card">
            <StatCard 
              label="Harvestable Losses" 
              value={`$${Math.abs(totalLosses).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              icon="💰"
              gradient
            />
          </ParallaxCard>
          <ParallaxCard className="stat-card">
            <StatCard 
              label="Est. Tax Savings" 
              value={`$${totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              icon="📈"
              trend={{ value: 8, isPositive: true }}
              gradient
            />
          </ParallaxCard>
          <ParallaxCard className="stat-card">
            <StatCard 
              label="Last Scan" 
              value={lastScan ? new Date(lastScan).toLocaleDateString() : 'Never'}
              icon="🕐"
            />
          </ParallaxCard>
        </div>
      </ScrollReveal>

      {/* Charts Section */}
      <ScrollReveal direction="up" delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ParallaxCard className="lg:col-span-2">
            <TaxChart 
              data={savingsData} 
              type="area" 
              dataKey="savings"
              color="#0ea5e9"
              height={350}
            />
          </ParallaxCard>
          <ParallaxCard>
            <DonutChart 
              data={portfolioData}
              height={350}
              innerRadius={70}
              outerRadius={120}
            />
          </ParallaxCard>
        </div>
      </ScrollReveal>

      {/* Quick Actions */}
      <ScrollReveal direction="up" delay={0.3}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/harvest">
            <ParallaxCard className="card-premium group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-harvest-500/20 to-harvest-500/5 flex items-center justify-center text-3xl group-hover:rotate-360 group-hover:scale-110 transition-transform duration-600"
                >
                  💰
                </div>
                <div 
                  className="text-harvest-400 opacity-0 group-hover:opacity-100"
                  style={{ animation: 'slide-right 1s ease-in-out infinite' }}
                >
                  →
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Harvest Losses</h3>
              <p className="text-gray-400 text-sm">Execute tax loss harvesting on your portfolio</p>
            </ParallaxCard>
          </Link>

          <Link href="/portfolio">
            <ParallaxCard className="card-premium group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-taxfi-500/20 to-taxfi-500/5 flex items-center justify-center text-3xl group-hover:rotate-360 group-hover:scale-110 transition-transform duration-600"
                >
                  💼
                </div>
                <div 
                  className="text-taxfi-400 opacity-0 group-hover:opacity-100"
                  style={{ animation: 'slide-right 1s ease-in-out infinite' }}
                >
                  →
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">View Portfolio</h3>
              <p className="text-gray-400 text-sm">See your cost basis and transaction history</p>
            </ParallaxCard>
          </Link>

          <Link href="/reports">
            <ParallaxCard className="card-premium group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-purple/5 flex items-center justify-center text-3xl group-hover:rotate-360 group-hover:scale-110 transition-transform duration-600"
                >
                  📋
                </div>
                <div 
                  className="text-accent-purple opacity-0 group-hover:opacity-100"
                  style={{ animation: 'slide-right 1s ease-in-out infinite' }}
                >
                  →
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tax Reports</h3>
              <p className="text-gray-400 text-sm">Generate IRS-compliant tax forms</p>
            </ParallaxCard>
          </Link>
        </div>
      </ScrollReveal>

      {/* Top Opportunities */}
      {opportunities.length > 0 && (
        <ScrollReveal direction="up" delay={0.4}>
          <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
              <TextReveal text="Top Opportunities" className="text-2xl font-bold text-white" />
              <Link href="/harvest" className="text-taxfi-400 hover:text-taxfi-300 transition-colors">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {opportunities.slice(0, 5).map((opp, i) => (
                <ParallaxCard key={i} className="cursor-pointer">
                  <div className="flex justify-between items-center p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-harvest-500/20 to-harvest-500/5 flex items-center justify-center text-2xl group-hover:rotate-360 group-hover:scale-110 transition-transform duration-500"
                      >
                        {opp.asset.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">{opp.asset}</p>
                        <p className="text-gray-400 text-sm">
                          {opp.quantity.toFixed(4)} units • Cost: ${opp.cost_basis.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-harvest font-bold text-xl">-${Math.abs(opp.unrealized_loss).toFixed(2)}</p>
                        <p className="text-gray-400 text-sm">Save ~${opp.estimated_savings.toFixed(0)}</p>
                      </div>
                      <Sparkline data={sparklineData.slice(0, 7)} width={80} height={30} color="#22c55e" />
                    </div>
                  </div>
                </ParallaxCard>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {opportunities.length === 0 && !isLoading && (
        <ScrollReveal direction="up" delay={0.5}>
          <div className="card-premium text-center py-16">
            <div 
              className="text-6xl mb-4"
              style={{ 
                animation: 'float-rotate 3s ease-in-out infinite',
              }}
            >
              🔍
            </div>
            <TextReveal text="No Opportunities Found" className="text-xl font-bold text-white mb-2" />
            <p className="text-gray-400 mb-6">Run a scan to analyze your portfolio for tax savings</p>
            <MagneticButton onClick={() => runPipeline()} className="btn-primary">
              Scan Portfolio
            </MagneticButton>
          </div>
        </ScrollReveal>
      )}
      </div>
    </div>
  );
}
