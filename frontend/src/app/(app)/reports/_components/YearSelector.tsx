'use client';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export default function YearSelector({ selectedYear, onYearChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i - 1);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-[1.5rem] p-6 shadow-lg shadow-emerald-500/5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 mb-4">Select Tax Year</h3>
      <div className="flex flex-wrap gap-3">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onYearChange(year)}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              selectedYear === year
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white/50 text-gray-600 border border-gray-200/60 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50'
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
