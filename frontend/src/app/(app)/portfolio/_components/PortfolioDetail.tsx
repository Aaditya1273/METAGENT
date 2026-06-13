'use client';

import DetailModal from '../../_components/DetailModal';

interface PortfolioDetailProps {
  asset: string | null;
  onClose: () => void;
}

export default function PortfolioDetail({ asset, onClose }: PortfolioDetailProps) {
  return (
    <DetailModal
      open={!!asset}
      onClose={onClose}
      title={asset || ''}
      subtitle="Detailed lot information"
      actions={
        <>
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all">Close</button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97]">View Transactions</button>
        </>
      }
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {(asset || '').slice(0, 2)}
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Cost Basis Method', value: 'HIFO' },
          { label: 'Total Acquired', value: '$12,450.00' },
          { label: 'Total Sold', value: '$8,320.00' },
          { label: 'Realized Gain/Loss', value: '-$4,130.00', loss: true },
        ].map((row, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/40">
            <span className="text-gray-500 text-sm">{row.label}</span>
            <span className={`font-semibold ${row.loss ? 'text-emerald-600' : 'text-gray-900'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </DetailModal>
  );
}
