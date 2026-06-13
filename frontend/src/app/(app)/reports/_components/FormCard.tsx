'use client';

interface FormData {
  transactions?: unknown[];
  title?: string;
}

interface FormCardProps {
  name: string;
  desc: string;
  form?: FormData | null;
  onDownload: () => void;
}

export default function FormCard({ name, desc, form, onDownload }: FormCardProps) {
  return (
    <div className="group bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 hover:border-emerald-300/60 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-200/40">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      <h4 className="text-lg font-bold text-gray-900 mb-1">{name}</h4>
      <p className="text-gray-500 text-sm mb-4">{desc}</p>
      {form && (
        <div className="text-sm text-gray-500 mb-4 p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/40">
          {form.transactions?.length ? <p>{form.transactions.length} entries</p> : <p>{form.title}</p>}
        </div>
      )}
      <button
        onClick={onDownload}
        className="w-full py-2.5 px-4 border border-gray-200/60 text-gray-700 text-sm font-semibold rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all duration-300 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download PDF
      </button>
    </div>
  );
}
