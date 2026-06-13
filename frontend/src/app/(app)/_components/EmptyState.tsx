'use client';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="relative text-center py-20 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 to-transparent rounded-3xl" />
      <div className="relative">
        {icon ? (
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              {icon}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">{description}</p>
        {action && <div className="flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
