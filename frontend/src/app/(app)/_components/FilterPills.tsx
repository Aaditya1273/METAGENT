'use client';

interface FilterPillsProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

export default function FilterPills<T extends string>({
  options,
  selected,
  onSelect,
}: FilterPillsProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            selected === opt.value
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white/70 backdrop-blur-sm text-gray-600 border border-gray-200/60 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
