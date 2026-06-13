'use client';

import Link from 'next/link';

interface QuickAction {
  path: string;
  title: string;
  description: string;
  gradient: string;
  icon: React.ReactNode;
}

const ACTIONS: QuickAction[] = [
  {
    path: '/harvest',
    title: 'Harvest Losses',
    description: 'Execute tax loss harvesting on your portfolio',
    gradient: 'from-emerald-500 to-teal-500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    path: '/portfolio',
    title: 'View Portfolio',
    description: 'See your cost basis and transaction history',
    gradient: 'from-emerald-500 to-cyan-500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 2.79 8 4" />
      </svg>
    ),
  },
  {
    path: '/reports',
    title: 'Tax Reports',
    description: 'Generate IRS-compliant tax forms',
    gradient: 'from-teal-500 to-cyan-500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {ACTIONS.map((action) => (
          <Link key={action.path} href={action.path}>
            <div className="group relative bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/[0.04] to-transparent rounded-full" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    {action.icon}
                  </div>
                  <svg className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">{action.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
