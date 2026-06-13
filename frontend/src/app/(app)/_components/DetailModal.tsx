'use client';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function DetailModal({ open, onClose, title, subtitle, children, actions }: DetailModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-emerald-100/60 rounded-[2rem] p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl shadow-emerald-500/10 animate-scale-in">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-500 text-sm flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              {subtitle}
            </p>}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {actions && <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">{actions}</div>}
      </div>
    </div>
  );
}
