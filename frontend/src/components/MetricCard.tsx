'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  onClick?: () => void;
}

export function MetricCard({ icon, label, value, change, positive, onClick }: MetricCardProps) {
  return (
    <div 
      className="metric-card cursor-pointer hover:scale-[1.02] transition-transform duration-300"
      onClick={onClick}
    >
      <div className="metric-icon">{icon}</div>
      <div className="flex-1">
        <div className="text-gray-400 text-sm mb-1">{label}</div>
        <div className="text-white text-xl font-bold">{value}</div>
        {change && (
          <div className={`text-sm mt-1 ${positive ? 'text-harvest-400' : 'text-loss-400'}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
}
