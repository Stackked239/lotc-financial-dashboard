import { YearFilter as YearFilterType } from '../data/types';

interface YearFilterProps {
  value: YearFilterType;
  onChange: (year: YearFilterType) => void;
}

const options: { value: YearFilterType; label: string }[] = [
  { value: 2025, label: 'FY 2025' },
  { value: 2026, label: 'FY 2026' },
  { value: 'both', label: 'Both Years' },
];

export default function YearFilter({ value, onChange }: YearFilterProps) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-0.5">
      {options.map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            value === opt.value
              ? 'bg-brand-red text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
